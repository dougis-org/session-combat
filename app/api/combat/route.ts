import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';
import { CombatState } from '@/lib/types';

export const GET = withAuth(async (request, auth) => {
  try {
    const db = await getDatabase();
    const combatState = await db
      .collection<CombatState>('combatStates')
      .findOne({ userId: auth.userId });

    if (!combatState) {
      return NextResponse.json(null);
    }

    return NextResponse.json(combatState);
  } catch (error) {
    console.error('Error fetching combat state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch combat state' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { encounterId, combatants } = body;

    const combatState: CombatState = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      encounterId: encounterId || undefined,
      combatants: combatants || [],
      currentRound: 1,
      currentTurnIndex: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    await db
      .collection<CombatState>('combatStates')
      .updateOne(
        { userId: auth.userId },
        { $set: combatState },
        { upsert: true }
      );

    return NextResponse.json(combatState, { status: 201 });
  } catch (error) {
    console.error('Error creating combat state:', error);
    return NextResponse.json(
      { error: 'Failed to create combat state' },
      { status: 500 }
    );
  }
});
