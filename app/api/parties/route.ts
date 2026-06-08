import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Party, PartyMember } from '@/lib/types';

export const GET = withAuth(async (_request, auth) => {
  try {
    const parties = await storage.loadParties(auth.userId);
    return NextResponse.json(parties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ error: 'Failed to fetch parties' }, { status: 500 });
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { name, description, characterIds, campaignId } = body;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
    }

    const now = new Date();
    const ids: string[] = Array.isArray(characterIds) ? characterIds : [];

    if (typeof campaignId === 'string' && campaignId.trim()) {
      const cid = campaignId.trim();
      for (const charId of ids) {
        const allowed = await storage.canAddToCampaignParty(cid, charId, auth.userId);
        if (!allowed) {
          return NextResponse.json({ error: 'Character not shared into campaign' }, { status: 403 });
        }
      }
    }

    const members: PartyMember[] = ids.map(characterId => ({ characterId, addedAt: now }));

    const party: Party = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      description: description?.trim() || '',
      members,
      ...(typeof campaignId === 'string' && campaignId.trim() && { campaignId: campaignId.trim() }),
      createdAt: now,
      updatedAt: now,
    };

    await storage.saveParty(party);

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
});
