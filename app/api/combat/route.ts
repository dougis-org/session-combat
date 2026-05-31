import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';
import { CombatState } from '@/lib/types';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') ?? undefined;
    const db = await getDatabase();
    const combatState = await db
      .collection<CombatState>('combatStates')
      .findOne({ userId: auth.userId, isActive: true, ...(campaignId ? { campaignId } : {}) });

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
    const { campaignId, encounterId, encounterDescription, combatants, currentRound, currentTurnIndex } = body;

    const combatState: CombatState = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      campaignId,
      encounterId: encounterId || undefined,
      encounterDescription: encounterDescription || undefined,
      combatants: combatants || [],
      currentRound: currentRound ?? 1,
      currentTurnIndex: currentTurnIndex ?? 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const db = await getDatabase();
    await db
      .collection<CombatState>('combatStates')
      .insertOne(combatState);

    return NextResponse.json(combatState, { status: 201 });
  } catch (error) {
    console.error('Error creating combat state:', error);
    return NextResponse.json(
      { error: 'Failed to create combat state' },
      { status: 500 }
    );
  }
});
