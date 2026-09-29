import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import * as partyRepo from '@/lib/storage/partyRepo';
import { Party, PartyMember } from '@/lib/types';
import { validateEntityIdArray, validateEntityId, parseCampaignIdInput, CampaignIdInput } from '@/lib/validation/core';
import { PartyCampaignAuthorizationError } from '@/lib/storage/errors';

type Params = { id: string };

function validatePartyIdParam(id: string): { ok: true; value: string } | { ok: false; status: number; error: string } {
  const result = validateEntityId(id, 'id');
  if (!result.valid) {
    return { ok: false, status: 400, error: result.error.message };
  }
  return { ok: true, value: result.value };
}

type CampaignAuthResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Authorizes every campaign a PUT's character-sharing check is about to run
 * against — whether it's a brand-new target or the party's currently-linked
 * campaign(s) — before running that check. Otherwise a caller with no
 * authority over a campaign could learn whether a given character is shared
 * into it purely from the sharing check's own 403.
 *
 * Takes an array, not a single id: a party is normally linked to at most one
 * campaign, but nothing at the data level guarantees that, so every campaign
 * a party is actually linked to must be authorized and sharing-checked, not
 * just the first one found.
 */
async function authorizeCampaignSharing(
  effectiveCampaignIds: string[],
  campaignChanged: boolean,
  newIdSet: Set<string>,
  existingActiveIds: Set<string>,
  userId: string
): Promise<CampaignAuthResult> {
  if (effectiveCampaignIds.length === 0) {
    return { ok: true };
  }

  for (const campaignId of effectiveCampaignIds) {
    const authorized = await partyRepo.isActiveDm(campaignId, userId);
    if (!authorized) {
      return { ok: false, status: 403, error: 'Not authorized to link this campaign' };
    }
  }

  const charsToCheck = Array.from(newIdSet).filter(charId => campaignChanged || !existingActiveIds.has(charId));
  for (const campaignId of effectiveCampaignIds) {
    const checks = await Promise.all(
      charsToCheck.map(charId => partyRepo.canAddToCampaignParty(campaignId, charId, userId))
    );
    if (checks.some(allowed => !allowed)) {
      return { ok: false, status: 403, error: 'Character not shared into campaign' };
    }
  }
  return { ok: true };
}

type CampaignAuthContext =
  | { ok: true; newIdSet: Set<string>; existingActiveIds: Set<string>; linkedCampaignIds: string[] }
  | { ok: false; status: number; error: string };

/**
 * Resolves the party's live campaign linkage, works out which campaign(s)
 * this PUT's character set must be authorized/sharing-checked against, and
 * runs that check. Kept out of the PUT handler so the handler itself is
 * just request parsing and response mapping.
 */
async function authorizeCampaignTransition(
  existingParty: Party,
  validatedIds: string[] | undefined,
  campaignIdInput: CampaignIdInput,
  userId: string
): Promise<CampaignAuthContext> {
  const linkedCampaignIds = await partyRepo.getLinkedCampaignIds(existingParty.id, existingParty.campaignId);

  const existingActiveIds = new Set<string>(
    existingParty.members.filter(m => !m.leftAt).map(m => m.characterId)
  );
  // When characterIds is omitted, membership itself is unchanged, but a
  // campaign move still needs every currently-active character re-checked
  // against the new campaign's sharing rules.
  const newIdSet = validatedIds !== undefined ? new Set<string>(validatedIds) : existingActiveIds;

  let effectiveCampaignIds: string[];
  let campaignChanged: boolean;
  if (campaignIdInput.kind === 'set') {
    effectiveCampaignIds = campaignIdInput.value ? [campaignIdInput.value] : [];
    campaignChanged = linkedCampaignIds.length !== 1 || linkedCampaignIds[0] !== campaignIdInput.value;
  } else {
    // Unchanged — but re-validate against every campaign this party is
    // actually (possibly more than one) linked to right now, not just the
    // first, since campaign.campaignId is only ever a single-value hint.
    effectiveCampaignIds = linkedCampaignIds;
    campaignChanged = false;
  }

  const authResult = await authorizeCampaignSharing(effectiveCampaignIds, campaignChanged, newIdSet, existingActiveIds, userId);
  if (!authResult.ok) {
    return authResult;
  }
  return { ok: true, newIdSet, existingActiveIds, linkedCampaignIds };
}

/** Pure add/remove reconciliation of party membership — no authorization. */
function reconcileMembers(
  existingParty: Party,
  validatedIds: string[] | undefined,
  newIdSet: Set<string>,
  existingActiveIds: Set<string>,
  now: Date
): PartyMember[] {
  if (validatedIds === undefined) {
    return existingParty.members;
  }

  const updatedMembers = existingParty.members.map(m => {
    if (!m.leftAt && !newIdSet.has(m.characterId)) {
      return { ...m, leftAt: now };
    }
    return m;
  });
  for (const charId of newIdSet) {
    if (!existingActiveIds.has(charId)) {
      updatedMembers.push({ characterId: charId, addedAt: now });
    }
  }
  return updatedMembers;
}

type PutBodyValidation =
  | {
      ok: true;
      name: string | undefined;
      description: string | undefined;
      validatedIds: string[] | undefined;
      campaignIdInput: CampaignIdInput;
    }
  | { ok: false; status: number; error: string };

function validatePutBody(body: Record<string, unknown>): PutBodyValidation {
  const { name, description, characterIds, campaignId } = body;

  if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
    return { ok: false, status: 400, error: 'Party name is required' };
  }

  if (description !== undefined && typeof description !== 'string') {
    return { ok: false, status: 400, error: 'description must be a string' };
  }

  const campaignIdInput = parseCampaignIdInput(campaignId);
  if (campaignIdInput.kind === 'invalid') {
    return { ok: false, status: 400, error: 'campaignId must be a string' };
  }

  let validatedIds: string[] | undefined;
  if (characterIds !== undefined) {
    if (!Array.isArray(characterIds)) {
      return { ok: false, status: 400, error: 'characterIds must be an array of strings' };
    }
    const idsResult = validateEntityIdArray(characterIds, 'characterIds');
    if (!idsResult.valid) {
      return { ok: false, status: 400, error: idsResult.error.message };
    }
    validatedIds = idsResult.value;
  }

  return {
    ok: true,
    name: name as string | undefined,
    description: description as string | undefined,
    validatedIds,
    campaignIdInput,
  };
}

type CampaignReassignmentResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Commits the campaign-link change for a PUT and persists the updated party,
 * rolling the campaign link back to its previous state if saving the party
 * document fails partway through (so campaigns.partyIds and the party
 * document never diverge).
 */
async function applyCampaignReassignment(
  updatedParty: Party,
  campaignIdInput: CampaignIdInput,
  existingCampaignId: string | undefined,
  currentCampaignId: string | undefined,
  callerId: string,
  partyId: string
): Promise<CampaignReassignmentResult> {
  try {
    await partyRepo.reassignPartyCampaign(updatedParty, campaignIdInput, existingCampaignId, callerId);
  } catch (err) {
    if (err instanceof PartyCampaignAuthorizationError) {
      return { ok: false, status: 403, error: 'Not authorized to link this campaign' };
    }
    throw err;
  }

  try {
    await partyRepo.saveParty(updatedParty);
  } catch (err) {
    if (campaignIdInput.kind !== 'omit') {
      const newLiveCampaignId = campaignIdInput.kind === 'set' ? campaignIdInput.value : currentCampaignId;
      const rollbackInput: CampaignIdInput = currentCampaignId !== undefined
        ? { kind: 'set', value: currentCampaignId }
        : { kind: 'set', value: '' };
      await partyRepo.reassignPartyCampaign(updatedParty, rollbackInput, newLiveCampaignId, callerId).catch((rollbackErr) => {
        console.error(`Failed to roll back campaign reassignment for party ${partyId} after saveParty failure:`, rollbackErr);
      });
    }
    throw err;
  }

  return { ok: true };
}

export const GET = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const idValidation = validatePartyIdParam(id);
    if (!idValidation.ok) {
      return NextResponse.json({ error: idValidation.error }, { status: idValidation.status });
    }

    const parties = await partyRepo.loadParties(auth.userId);
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
    const idValidation = validatePartyIdParam(id);
    if (!idValidation.ok) {
      return NextResponse.json({ error: idValidation.error }, { status: idValidation.status });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const validation = validatePutBody(body as Record<string, unknown>);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { name, description, validatedIds, campaignIdInput } = validation;

    const parties = await partyRepo.loadParties(auth.userId);
    const existingParty = parties.find((p) => p.id === id);

    if (!existingParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const now = new Date();

    const authContext = await authorizeCampaignTransition(existingParty, validatedIds, campaignIdInput, auth.userId);
    if (!authContext.ok) {
      return NextResponse.json({ error: authContext.error }, { status: authContext.status });
    }
    const { newIdSet, existingActiveIds, linkedCampaignIds } = authContext;

    const updatedParty: Party = {
      ...existingParty,
      name: name !== undefined ? name.trim() : existingParty.name,
      description: description !== undefined ? description.trim() : (existingParty.description || ''),
      members: reconcileMembers(existingParty, validatedIds, newIdSet, existingActiveIds, now),
      updatedAt: now,
    };

    const applied = await applyCampaignReassignment(updatedParty, campaignIdInput, existingParty.campaignId, linkedCampaignIds[0], auth.userId, id);
    if (!applied.ok) {
      return NextResponse.json({ error: applied.error }, { status: applied.status });
    }

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json({ error: 'Failed to update party' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const idValidation = validatePartyIdParam(id);
    if (!idValidation.ok) {
      return NextResponse.json({ error: idValidation.error }, { status: idValidation.status });
    }

    const parties = await partyRepo.loadParties(auth.userId);
    const party = parties.find((p) => p.id === id);

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    await partyRepo.deleteParty(id, auth.userId);

    return NextResponse.json({ message: 'Party deleted successfully' });
  } catch (error) {
    console.error('Error deleting party:', error);
    return NextResponse.json({ error: 'Failed to delete party' }, { status: 500 });
  }
});
