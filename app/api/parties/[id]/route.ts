import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import * as partyRepo from '@/lib/storage/partyRepo';
import { Party, PartyMember } from '@/lib/types';
import { validateStringArray, parseCampaignIdInput, CampaignIdInput } from '@/lib/validation/core';
import { PartyCampaignAuthorizationError } from '@/lib/storage/errors';

type Params = { id: string };

type MemberReconciliationResult =
  | { ok: true; members: PartyMember[] }
  | { ok: false; status: number; error: string };

async function reconcileMembers(
  existingParty: Party,
  validatedIds: string[] | undefined,
  campaignIdInput: CampaignIdInput,
  userId: string,
  now: Date
): Promise<MemberReconciliationResult> {
  const existingActiveIds = new Set<string>(
    existingParty.members.filter(m => !m.leftAt).map(m => m.characterId)
  );
  // When characterIds is omitted, membership itself is unchanged, but a
  // campaign move still needs every currently-active character re-checked
  // against the new campaign's sharing rules.
  const newIdSet = validatedIds !== undefined ? new Set<string>(validatedIds) : existingActiveIds;

  const effectiveCampaignId = campaignIdInput.kind === 'set'
    ? campaignIdInput.value
    : existingParty.campaignId;
  const campaignChanged = effectiveCampaignId !== existingParty.campaignId;

  if (effectiveCampaignId) {
    const charsToCheck = Array.from(newIdSet).filter(charId => campaignChanged || !existingActiveIds.has(charId));
    const checks = await Promise.all(
      charsToCheck.map(charId => partyRepo.canAddToCampaignParty(effectiveCampaignId, charId, userId))
    );
    if (checks.some(allowed => !allowed)) {
      return { ok: false, status: 403, error: 'Character not shared into campaign' };
    }
  }

  if (validatedIds === undefined) {
    return { ok: true, members: existingParty.members };
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

  return { ok: true, members: updatedMembers };
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
    const idsResult = validateStringArray(characterIds, 'characterIds');
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

export const GET = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
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
    const body = await request.json();
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
    const reconciliation = await reconcileMembers(existingParty, validatedIds, campaignIdInput, auth.userId, now);
    if (!reconciliation.ok) {
      return NextResponse.json({ error: reconciliation.error }, { status: reconciliation.status });
    }

    const updatedParty: Party = {
      ...existingParty,
      name: name !== undefined ? name.trim() : existingParty.name,
      description: description !== undefined ? description.trim() : (existingParty.description || ''),
      members: reconciliation.members,
      updatedAt: now,
    };

    try {
      await partyRepo.reassignPartyCampaign(updatedParty, (body as Record<string, unknown>).campaignId, existingParty.campaignId, auth.userId);
    } catch (err) {
      if (err instanceof PartyCampaignAuthorizationError) {
        return NextResponse.json({ error: 'Not authorized to link this campaign' }, { status: 403 });
      }
      throw err;
    }

    await partyRepo.saveParty(updatedParty);

    return NextResponse.json(updatedParty);
  } catch (error) {
    console.error('Error updating party:', error);
    return NextResponse.json({ error: 'Failed to update party' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
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
