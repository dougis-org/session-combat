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
    const updatedMembers: PartyMember[] = [];
    const activeMemberIds = new Set<string>();

    for (const m of existingParty.members) {
      if (memberCharacterIds.has(m.characterId)) {
        if (m.leftAt) {
          updatedMembers.push(m);
        } else {
          if (newIdSet.has(m.characterId)) {
            updatedMembers.push(m);
            activeMemberIds.add(m.characterId);
          } else {
            updatedMembers.push({ ...m, leftAt: now });
          }
        }
      } else {
        updatedMembers.push(m);
      }
    }

    for (const charId of newIdSet) {
      if (!activeMemberIds.has(charId)) {
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
