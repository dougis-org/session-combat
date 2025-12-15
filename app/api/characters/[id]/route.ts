import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Character } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const characters = await storage.loadCharacters(auth.userId);
    const character = characters.find((c) => c.id === id);

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const { name, hp, maxHp, ac, initiativeBonus, dexterity } = body;

    // Get the existing character to verify ownership
    const characters = await storage.loadCharacters(auth.userId);
    const existingCharacter = characters.find((c) => c.id === id);

    if (!existingCharacter) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'Character name is required' },
        { status: 400 }
      );
    }

    const updatedCharacter: Character = {
      ...existingCharacter,
      name: name !== undefined ? name.trim() : existingCharacter.name,
      hp: hp !== undefined ? hp : existingCharacter.hp,
      maxHp: maxHp !== undefined ? maxHp : existingCharacter.maxHp,
      ac: ac !== undefined ? ac : existingCharacter.ac,
      initiativeBonus: initiativeBonus !== undefined ? initiativeBonus : existingCharacter.initiativeBonus,
      dexterity: dexterity !== undefined ? dexterity : existingCharacter.dexterity,
      updatedAt: new Date(),
    };

    await storage.saveCharacter(updatedCharacter);

    return NextResponse.json(updatedCharacter);
  } catch (error) {
    console.error('Error updating character:', error);
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    // Verify ownership before deleting
    const characters = await storage.loadCharacters(auth.userId);
    const character = characters.find((c) => c.id === id);

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }

    await storage.deleteCharacter(id, auth.userId);

    return NextResponse.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Error deleting character:', error);
    return NextResponse.json(
      { error: 'Failed to delete character' },
      { status: 500 }
    );
  }
}
