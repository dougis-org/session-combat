import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Player } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const players = await storage.loadPlayers(auth.userId);
    const player = players.find((p) => p.id === params.id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const { name, hp, maxHp, ac, initiativeBonus } = body;

    // Get the existing player to verify ownership
    const players = await storage.loadPlayers(auth.userId);
    const existingPlayer = players.find((p) => p.id === params.id);

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (name !== undefined && name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const updatedPlayer: Player = {
      ...existingPlayer,
      name: name !== undefined ? name.trim() : existingPlayer.name,
      hp: hp !== undefined ? hp : existingPlayer.hp,
      maxHp: maxHp !== undefined ? maxHp : existingPlayer.maxHp,
      ac: ac !== undefined ? ac : existingPlayer.ac,
      initiativeBonus: initiativeBonus !== undefined ? initiativeBonus : existingPlayer.initiativeBonus,
      updatedAt: new Date(),
    };

    await storage.savePlayer(updatedPlayer);

    return NextResponse.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    // Verify ownership before deleting
    const players = await storage.loadPlayers(auth.userId);
    const player = players.find((p) => p.id === params.id);

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    await storage.deletePlayer(params.id, auth.userId);

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
