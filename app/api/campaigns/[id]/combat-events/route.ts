import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { getDatabase } from '@/lib/db';
import { CombatState, SessionEvent } from '@/lib/types';

export const GET = withAuthAndParams<{ id: string }>(async (request, auth, { id }) => {
  try {
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    const sinceDate = sinceParam ? new Date(sinceParam) : new Date(0);

    const db = await getDatabase();
    const docs = await db
      .collection<CombatState>('combatStates')
      .find({
        userId: auth.userId,
        campaignId: id,
        isActive: false,
        completedAt: { $gte: sinceDate },
      })
      .toArray();

    const events: SessionEvent[] = docs.map(doc => ({
      type: 'combat_completed',
      description: `Combat: ${doc.encounterDescription || 'Unnamed encounter'} (${doc.currentRound - 1} rounds)`,
      encounterId: doc.encounterId,
      encounterDescription: doc.encounterDescription,
      rounds: doc.currentRound - 1,
      completedAt: doc.completedAt,
      campaignId: doc.campaignId,
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching combat events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch combat events' },
      { status: 500 }
    );
  }
});
