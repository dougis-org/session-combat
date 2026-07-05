import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { PartyMember } from '@/lib/types';

type Params = { id: string; userId: string; partyId: string };

export const PUT = withAuthAndParams<Params>(async (request, auth, { id: campaignId, userId: memberId, partyId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { characterIds } = body as Record<string, unknown>;

  try {
    if (!Array.isArray(characterIds)) {
      return NextResponse.json({ error: 'characterIds must be an array' }, { status: 400 });
    }

    if (auth.userId !== memberId) {
      const caller = await storage.getMember(campaignId, auth.userId);
      if (!caller || caller.role !== 'dm' || caller.status !== 'active') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    // When caller is the member themselves, their active status is validated below via the 'member' fetch

    const member = await storage.getMember(campaignId, memberId);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Member not found or not active' }, { status: 404 });
    }

    const parties = await storage.loadPartiesByCampaign(campaignId);
    const existingParty = parties.find(p => p.id === partyId);
    if (!existingParty) {
      return NextResponse.json({ error: 'Party not found in campaign' }, { status: 404 });
    }

    const memberCharacters = await storage.loadCharacters(memberId);
    const memberCharacterIds = new Set(memberCharacters.map(c => c.id));

    const newIdSet = new Set<string>();
    for (const charId of characterIds) {
      if (typeof charId !== 'string') {
        return NextResponse.json({ error: 'characterIds must contain only strings' }, { status: 400 });
      }
      if (!memberCharacterIds.has(charId)) {
        return NextResponse.json({ error: 'Character not owned by member' }, { status: 400 });
      }
      newIdSet.add(charId);
    }

    const now = new Date();
    // Track which characters owned by this member have already been handled
    // to avoid duplicates when a character rejoins (was previously leftAt).
    const handledIds = new Set<string>();
    const updatedMembers: PartyMember[] = [];

    for (const m of existingParty.members) {
      if (memberCharacterIds.has(m.characterId)) {
        handledIds.add(m.characterId);
        if (newIdSet.has(m.characterId)) {
          // rejoin: strip leftAt so the character becomes active again without creating a duplicate record
          const { leftAt: _, ...rest } = m;
          updatedMembers.push(rest.addedAt ? rest : { ...rest, addedAt: now });
        } else if (!m.leftAt) {
          // Character should be removed — mark leftAt
          updatedMembers.push({ ...m, leftAt: now });
        } else {
          // Already marked as left — keep as-is
          updatedMembers.push(m);
        }
      } else {
        updatedMembers.push(m);
      }
    }

    // Add new characters not previously in the party at all
    for (const charId of newIdSet) {
      if (!handledIds.has(charId)) {
        updatedMembers.push({ characterId: charId, addedAt: now });
      }
    }

    const updatedParty = {
      ...existingParty,
      members: updatedMembers,
      updatedAt: now,
    };

    await storage.saveParty(updatedParty);

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
