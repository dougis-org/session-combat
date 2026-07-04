import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { PartyMember } from '@/lib/types';

type Params = { id: string; userId: string; partyId: string };

export const PUT = withAuthAndParams<Params>(async (request, auth, { id: campaignId, userId: memberId, partyId }) => {
  try {
    const body = await request.json();
    const { characterIds } = body;

    if (!Array.isArray(characterIds)) {
      return NextResponse.json({ error: 'characterIds must be an array' }, { status: 400 });
    }

    if (auth.userId !== memberId) {
      const caller = await storage.getMember(campaignId, auth.userId);
      if (!caller || caller.role !== 'dm') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const member = await storage.getMember(campaignId, memberId);
    if (!member || (member.status !== 'active' && member.status !== 'invited')) {
      // Actually member.status can be 'active'.
      // If GM adds a character to an invited member, that's fine.
      return NextResponse.json({ error: 'Member not found or not active' }, { status: 404 });
    }
    
    if (auth.userId === memberId && member.status !== 'active') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      if (typeof charId !== 'string') continue;
      if (!memberCharacterIds.has(charId)) {
        return NextResponse.json({ error: 'Character not owned by member' }, { status: 400 });
      }
      newIdSet.add(charId);
    }

    const now = new Date();
    const updatedMembers: PartyMember[] = [];

    for (const m of existingParty.members) {
      if (memberCharacterIds.has(m.characterId)) {
        if (!m.leftAt && !newIdSet.has(m.characterId)) {
          updatedMembers.push({ ...m, leftAt: now });
        } else {
          updatedMembers.push(m);
        }
      } else {
        updatedMembers.push(m);
      }
    }

    const existingActiveIds = new Set(
      existingParty.members.filter(m => !m.leftAt).map(m => m.characterId)
    );

    for (const charId of newIdSet) {
      if (!existingActiveIds.has(charId)) {
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
