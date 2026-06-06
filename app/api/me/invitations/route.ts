import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { getDatabase } from '@/lib/db';
import { Campaign, MemberHistoryEntry } from '@/lib/types';

function lastInvitedEntry(history: MemberHistoryEntry[]): MemberHistoryEntry | undefined {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].action === 'invited') return history[i];
  }
  return undefined;
}

export const GET = withAuth(async (_request: NextRequest, auth) => {
  try {
    const invitations = await storage.listInvitationsForUser(auth.userId);
    if (invitations.length === 0) {
      return NextResponse.json({ invitations: [] }, { status: 200 });
    }

    const uniqueCampaignIds = [...new Set(invitations.map((m) => m.campaignId))];
    const uniqueInviterIds = [
      ...new Set(
        invitations
          .map((m) => lastInvitedEntry(m.history ?? [])?.by)
          .filter((id): id is string => typeof id === 'string'),
      ),
    ];

    const db = await getDatabase();
    const [campaignDocs, usernameMap] = await Promise.all([
      db
        .collection<Campaign>('campaigns')
        .find({ id: { $in: uniqueCampaignIds } }, { projection: { id: 1, name: 1 } })
        .toArray(),
      storage.getUsersByIds(uniqueInviterIds),
    ]);

    const campaignNameMap: Record<string, string> = {};
    for (const c of campaignDocs) {
      campaignNameMap[c.id] = c.name;
    }

    const result = invitations.map((m) => {
      const entry = lastInvitedEntry(m.history ?? []);
      const invitedBy = entry?.by ? (usernameMap[entry.by] ?? 'Unknown user') : 'Unknown user';
      return {
        id: m.id,
        campaignId: m.campaignId,
        campaignName: campaignNameMap[m.campaignId] ?? '',
        invitedBy,
        invitedAt: entry?.at ?? null,
      };
    });

    return NextResponse.json({ invitations: result }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
