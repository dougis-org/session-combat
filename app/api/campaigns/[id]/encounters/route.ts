import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { validateString } from '@/lib/validation/core';

type Params = { id: string };

export const GET = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) return NextResponse.json({ error: idResult.error.message }, { status: 400 });

    const result = await assertCampaignAccess(id, auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign } = result;

    const encounters = await storage.loadEncountersByIds(campaign.encounterIds ?? [], campaign.userId);
    return NextResponse.json(encounters);
  } catch (error) {
    console.error('Error fetching campaign encounters:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign encounters' }, { status: 500 });
  }
});

export const POST = withAuthAndParams<Params>(async (request, auth, { id }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) return NextResponse.json({ error: idResult.error.message }, { status: 400 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
    }

    const encounterIdResult = validateString((body as Record<string, unknown>).encounterId, 'encounterId', { required: true, minLength: 1 });
    if (!encounterIdResult.valid) {
      return NextResponse.json({ error: encounterIdResult.error.message }, { status: 400 });
    }
    const encounterId = encounterIdResult.value;

    const result = await assertCampaignAccess(id, auth.userId);
    if (result instanceof NextResponse) return result;
    const { role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const owned = await storage.loadEncountersByIds([encounterId], auth.userId);
    if (owned.length === 0) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }

    await storage.addEncounterToCampaign(id, encounterId, auth.userId);

    return NextResponse.json({ message: 'Encounter linked successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error linking encounter to campaign:', error);
    return NextResponse.json({ error: 'Failed to link encounter to campaign' }, { status: 500 });
  }
});
