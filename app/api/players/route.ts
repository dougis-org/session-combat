import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Player } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const players = await storage.loadPlayers(auth.userId);
    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const { name, hp, maxHp, ac, initiativeBonus, dexterity } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    const player: Player = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      hp: hp || 0,
      maxHp: maxHp || 0,
      ac: ac || 10,
      initiativeBonus: initiativeBonus || 0,
      dexterity: dexterity || 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.savePlayer(player);

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
