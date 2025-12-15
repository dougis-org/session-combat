import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Party } from '@/lib/types';

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
    const parties = await storage.loadParties(auth.userId);
    const party = parties.find((p) => p.id === id);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(party);
  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json(
      { error: 'Failed to fetch party' },
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
    const { name, description, characterIds } = body;

    // Get the existing party to verify ownership
    const parties = await storage.loadParties(auth.userId);
    const existingParty = parties.find((p) => p.id === id);

    if (!existingParty) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'Party name is required' },
        { status: 400 }
      );
    }

    const updatedParty: Party = {
      ...existingParty,
      name: name !== undefined ? name.trim() : existingParty.name,
      description: description !== undefined ? description.trim() : (existingParty.description || ''),
      characterIds: Array.isArray(characterIds) ? characterIds : existingParty.characterIds,
      updatedAt: new Date(),
    };

    await storage.saveParty(updatedParty);

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json(
      { error: 'Failed to update party' },
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
    const parties = await storage.loadParties(auth.userId);
    const party = parties.find((p) => p.id === id);

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      );
    }

    await storage.deleteParty(id, auth.userId);

    return NextResponse.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json(
      { error: 'Failed to delete party' },
      { status: 500 }
    );
  }
}
