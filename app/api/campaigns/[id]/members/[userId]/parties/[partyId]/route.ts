import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import type { PartyMember } from '@/lib/types';
import { validateStringArray } from '@/lib/validation/core';

type Params = { id: string; userId: string; partyId: string };

async function isAuthorized(campaignId: string, callerId: string, memberId: string): Promise<boolean> {
  if (callerId === memberId) return true;
  const caller = await storage.getMember(campaignId, callerId);
  return !!caller && caller.role === 'dm' && caller.status === 'active';
}

function resolveCharacterIds(characterIds: string[], memberCharacterIds: Set<string>): Set<string> | { error: string } {
  const newIdSet = new Set<string>();
  for (const charId of characterIds) {
    if (!memberCharacterIds.has(charId)) {
      return { error: 'Character not owned by member' };
    }
    newIdSet.add(charId);
  }
  return newIdSet;
}

// Preserves membership history: a character that previously left (has `leftAt`)
// keeps that record, and rejoining creates a new active record with a fresh `addedAt`.
function mergePartyMembers(
  existingMembers: PartyMember[],
  memberCharacterIds: Set<string>,
  newIdSet: Set<string>,
  now: Date
): PartyMember[] {
  const updatedMembers: PartyMember[] = [];
  const activeMemberIds = new Set<string>();

  for (const m of existingMembers) {
    if (!memberCharacterIds.has(m.characterId) || m.leftAt) {
      updatedMembers.push(m);
      continue;
    }
    if (newIdSet.has(m.characterId)) {
      updatedMembers.push(m);
      activeMemberIds.add(m.characterId);
    } else {
      updatedMembers.push({ ...m, leftAt: now });
    }
  }

  for (const charId of newIdSet) {
    if (!activeMemberIds.has(charId)) {
      updatedMembers.push({ characterId: charId, addedAt: now });
    }
  }

  return updatedMembers;
}

export const PUT = withAuthAndParams<Params>(async (request, auth, { id: campaignId, userId: memberId, partyId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { characterIds } = body as Record<string, unknown>;

  try {
    const characterIdsResult = validateStringArray(characterIds, 'characterIds');
    if (!characterIdsResult.valid) {
      return NextResponse.json({ error: characterIdsResult.error.message }, { status: 400 });
    }

    if (!(await isAuthorized(campaignId, auth.userId, memberId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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

    const newIdSet = resolveCharacterIds(characterIdsResult.value, memberCharacterIds);
    if (!(newIdSet instanceof Set)) {
      return NextResponse.json({ error: newIdSet.error }, { status: 400 });
    }

    const now = new Date();
    const updatedParty = {
      ...existingParty,
      members: mergePartyMembers(existingParty.members, memberCharacterIds, newIdSet, now),
      updatedAt: now,
    };

    await storage.saveParty(updatedParty);

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
