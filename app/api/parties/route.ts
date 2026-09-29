import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import * as partyRepo from '@/lib/storage/partyRepo';
import { Party, PartyMember } from '@/lib/types';
import { validateEntityIdArray, parseCampaignIdInput, CampaignIdInput } from '@/lib/validation/core';
import { PartyCampaignAuthorizationError } from '@/lib/storage/errors';

type PostBodyValidation =
  | { ok: true; name: string; description: string | undefined; ids: string[]; campaignIdInput: CampaignIdInput }
  | { ok: false; status: number; error: string };

function validatePostBody(body: Record<string, unknown>): PostBodyValidation {
  const { name, description, characterIds, campaignId } = body;

  if (typeof name !== 'string' || name.trim() === '') {
    return { ok: false, status: 400, error: 'Party name is required' };
  }
  if (description !== undefined && typeof description !== 'string') {
    return { ok: false, status: 400, error: 'description must be a string' };
  }

  const idsResult = validateEntityIdArray(characterIds, 'characterIds');
  if (!idsResult.valid) {
    return { ok: false, status: 400, error: idsResult.error.message };
  }

  const campaignIdInput = parseCampaignIdInput(campaignId);
  if (campaignIdInput.kind === 'invalid') {
    return { ok: false, status: 400, error: 'campaignId must be a string' };
  }

  return { ok: true, name, description: description as string | undefined, ids: idsResult.value, campaignIdInput };
}

type CampaignLinkResult = { ok: true } | { ok: false; status: number; error: string };

// Authorize the target campaign before running the character-sharing check
// — otherwise a caller with no authority over the campaign could learn
// whether a given character is shared into it purely from the sharing
// check's own 403, before ever being told they're not authorized.
async function authorizeAndValidateCampaignLink(
  campaignIdInput: CampaignIdInput,
  ids: string[],
  callerId: string
): Promise<CampaignLinkResult> {
  if (campaignIdInput.kind !== 'set' || !campaignIdInput.value) {
    return { ok: true };
  }
  const cid = campaignIdInput.value;
  const authorized = await partyRepo.isActiveDm(cid, callerId);
  if (!authorized) {
    return { ok: false, status: 403, error: 'Not authorized to link this campaign' };
  }
  const checks = await Promise.all(ids.map(charId => partyRepo.canAddToCampaignParty(cid, charId, callerId)));
  if (checks.some(allowed => !allowed)) {
    return { ok: false, status: 403, error: 'Character not shared into campaign' };
  }
  return { ok: true };
}

async function linkNewPartyToCampaign(
  campaignIdInput: CampaignIdInput,
  partyId: string,
  callerId: string
): Promise<CampaignLinkResult> {
  if (campaignIdInput.kind !== 'set' || !campaignIdInput.value) {
    return { ok: true };
  }
  try {
    await partyRepo.addPartyToCampaign(campaignIdInput.value, partyId, callerId);
  } catch (err) {
    try {
      await partyRepo.deleteParty(partyId, callerId);
    } catch (cleanupErr) {
      console.error(`Failed to roll back orphaned party ${partyId} after campaign link failure:`, cleanupErr);
    }
    if (err instanceof PartyCampaignAuthorizationError) {
      return { ok: false, status: 403, error: 'Not authorized to link this campaign' };
    }
    throw err;
  }
  return { ok: true };
}

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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const validation = validatePostBody(body as Record<string, unknown>);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { name, description, ids, campaignIdInput } = validation;

    const linkCheck = await authorizeAndValidateCampaignLink(campaignIdInput, ids, auth.userId);
    if (!linkCheck.ok) {
      return NextResponse.json({ error: linkCheck.error }, { status: linkCheck.status });
    }

    const now = new Date();
    const members: PartyMember[] = ids.map(characterId => ({ characterId, addedAt: now }));
    const partyId = crypto.randomUUID();
    const party: Party = {
      id: partyId,
      userId: auth.userId,
      name: name.trim(),
      description: description !== undefined ? description.trim() : '',
      members,
      createdAt: now,
      updatedAt: now,
    };

    await partyRepo.saveParty(party);

    const linkResult = await linkNewPartyToCampaign(campaignIdInput, partyId, auth.userId);
    if (!linkResult.ok) {
      return NextResponse.json({ error: linkResult.error }, { status: linkResult.status });
    }

    return NextResponse.json(party, { status: 201 });
  } catch (error) {
    console.error('Error creating party:', error);
    return NextResponse.json({ error: 'Failed to create party' }, { status: 500 });
  }
});
