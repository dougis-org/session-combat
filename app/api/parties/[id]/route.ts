import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import * as partyRepo from '@/lib/storage/partyRepo';
import { Party, PartyMember } from '@/lib/types';
import { validateStringArray } from '@/lib/validation/core';

type Params = { id: string };

type MemberReconciliationResult =
  | { ok: true; members: PartyMember[] }
  | { ok: false; status: number; error: string };

async function reconcileMembers(
  existingParty: Party,
  characterIds: unknown,
  campaignId: unknown,
  userId: string,
  now: Date
): Promise<MemberReconciliationResult> {
  if (!Array.isArray(characterIds)) {
    return { ok: true, members: existingParty.members };
  }

  const idsResult = validateStringArray(characterIds, 'characterIds');
  if (!idsResult.valid) {
    return { ok: false, status: 400, error: idsResult.error.message };
  }
  const newIdSet = new Set<string>(idsResult.value);
  const existingActiveIds = new Set<string>(
    existingParty.members.filter(m => !m.leftAt).map(m => m.characterId)
  );

  const effectiveCampaignId = campaignId !== undefined
    ? (typeof campaignId === 'string' ? campaignId.trim() : '')
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

async function reassignCampaign(
  updatedParty: Party,
  campaignId: unknown,
  existingCampaignId: string | undefined
): Promise<void> {
  if (campaignId === undefined) return;

  const normalized = typeof campaignId === 'string' ? campaignId.trim() : '';

  // Remove from all campaigns (UI expects 1-to-1 for now)
  await partyRepo.removePartyFromAllCampaigns(updatedParty.id);

  if (normalized) {
    try {
      await partyRepo.addPartyToCampaign(normalized, updatedParty.id);
    } catch (err) {
      if (existingCampaignId) {
        await partyRepo.addPartyToCampaign(existingCampaignId, updatedParty.id).catch(() => {});
      }
      throw err;
    }
  }

  // Ensure field stays decoupled
  delete updatedParty.campaignId;
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
    const { name, description, characterIds, campaignId } = body;

    const parties = await partyRepo.loadParties(auth.userId);
    const existingParty = parties.find((p) => p.id === id);

    if (!existingParty) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return NextResponse.json({ error: 'Party name is required' }, { status: 400 });
    }

    const now = new Date();
    const reconciliation = await reconcileMembers(existingParty, characterIds, campaignId, auth.userId, now);
    if (!reconciliation.ok) {
      return NextResponse.json({ error: reconciliation.error }, { status: reconciliation.status });
    }

    const updatedParty: Party = {
      ...existingParty,
      name: name !== undefined && typeof name === 'string' ? name.trim() : existingParty.name,
      description: description !== undefined && typeof description === 'string' ? description.trim() : (existingParty.description || ''),
      members: reconciliation.members,
      updatedAt: now,
    };

    await reassignCampaign(updatedParty, campaignId, existingParty.campaignId);

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
