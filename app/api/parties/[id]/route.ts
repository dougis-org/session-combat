import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Party, PartyMember } from '@/lib/types';

type Params = { id: string };

export const GET = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const parties = await storage.loadParties(auth.userId);
    const party = parties.find((p) => p.id === id);
    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }
    return NextResponse.json(party);
  } catch (error) {
    console.error('Error fetching party:', error);
    return NextResponse.json({ error: 'Failed to fetch party' }, { status: 500 });
  }
});

export const PUT = withAuthAndParams<Params>(async (request, auth, { id }) => {
  try {
    const body = await request.json();
    const { name, description, characterIds, campaignId } = body;

    const parties = await storage.loadParties(auth.userId);
    const existingParty = parties.find((p) => p.id === id);

    if (!existingParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
    }

    const now = new Date();
    let updatedMembers: PartyMember[] = existingParty.members;
    if (Array.isArray(characterIds)) {
      const newIdSet = new Set<string>(characterIds);
      const existingActiveIds = new Set<string>(
        existingParty.members.filter(m => !m.leftAt).map(m => m.characterId)
      );
      updatedMembers = existingParty.members.map(m => {
        if (!m.leftAt && !newIdSet.has(m.characterId)) {
          return { ...m, leftAt: now };
        }
        return m;
      });
      for (const charId of characterIds) {
        if (!existingActiveIds.has(charId)) {
          updatedMembers.push({ characterId: charId, addedAt: now });
        }
      }
    }

    const updatedParty: Party = {
      ...existingParty,
      name: name !== undefined && typeof name === 'string' ? name.trim() : existingParty.name,
      description: description !== undefined && typeof description === 'string' ? description.trim() : (existingParty.description || ''),
      members: updatedMembers,
      updatedAt: now,
    };

    if (campaignId !== undefined) {
      const normalized = typeof campaignId === 'string' ? campaignId.trim() : '';
      if (normalized) {
        updatedParty.campaignId = normalized;
      } else {
        delete updatedParty.campaignId;
      }
    }

    await storage.saveParty(updatedParty);

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json({ error: 'Failed to update party' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const parties = await storage.loadParties(auth.userId);
    const party = parties.find((p) => p.id === id);

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    await storage.deleteParty(id, auth.userId);

    return NextResponse.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json({ error: 'Failed to delete party' }, { status: 500 });
  }
});
