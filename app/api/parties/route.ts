import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import * as partyRepo from '@/lib/storage/partyRepo';
import { Party, PartyMember } from '@/lib/types';
import { validateStringArray, parseCampaignIdInput } from '@/lib/validation/core';
import { PartyCampaignAuthorizationError } from '@/lib/storage/errors';

export const GET = withAuth(async (_request, auth) => {
  try {
    const parties = await partyRepo.loadParties(auth.userId);
    return NextResponse.json(parties);
  } catch (error) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ error: 'Failed to fetch parties' }, { status: 500 });
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }
    const { name, description, characterIds, campaignId } = body;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
    }

    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json({ error: 'description must be a string' }, { status: 400 });
    }

    const idsResult = validateStringArray(characterIds, 'characterIds');
    if (!idsResult.valid) {
      return NextResponse.json({ error: idsResult.error.message }, { status: 400 });
    }

    const campaignIdInput = parseCampaignIdInput(campaignId);
    if (campaignIdInput.kind === 'invalid') {
      return NextResponse.json({ error: 'campaignId must be a string' }, { status: 400 });
    }

    const now = new Date();
    const ids = idsResult.value;

    if (campaignIdInput.kind === 'set' && campaignIdInput.value) {
      const cid = campaignIdInput.value;
      const checks = await Promise.all(ids.map(charId => partyRepo.canAddToCampaignParty(cid, charId, auth.userId)));
      if (checks.some(allowed => !allowed)) {
        return NextResponse.json({ error: 'Character not shared into campaign' }, { status: 403 });
      }
    }

    const members: PartyMember[] = ids.map(characterId => ({ characterId, addedAt: now }));

    const partyId = crypto.randomUUID();

    const party: Party = {
      id: partyId,
      userId: auth.userId,
      name: name.trim(),
      description: description !== undefined ? (description as string).trim() : '',
      members,
      createdAt: now,
      updatedAt: now,
    };

    await partyRepo.saveParty(party);

    if (campaignIdInput.kind === 'set' && campaignIdInput.value) {
      try {
        await partyRepo.addPartyToCampaign(campaignIdInput.value, partyId, auth.userId);
      } catch (err) {
        await partyRepo.deleteParty(partyId, auth.userId);
        if (err instanceof PartyCampaignAuthorizationError) {
          return NextResponse.json({ error: 'Not authorized to link this campaign' }, { status: 403 });
        }
        throw err;
      }
    }

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
});
