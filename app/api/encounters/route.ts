import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { loadEncounters, saveEncounter, addEncounterToCampaign } from '@/lib/storage/encounterRepo';
import { Encounter } from '@/lib/types';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { validateString } from '@/lib/validation/core';
import { validateEncounterFields } from '@/lib/validation/encounterFields';

export const GET = withAuth(async (_request, auth) => {
  try {
    const encounters = await loadEncounters(auth.userId);
    return NextResponse.json(encounters);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encounters' },
      { status: 500 }
    );
  }
});

async function parseEncounterBody(request: Request): Promise<Record<string, unknown> | NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }
  return body as Record<string, unknown>;
}

async function resolveLinkedCampaign(
  campaignId: unknown,
  userId: string
): Promise<{ campaignId: string } | NextResponse | undefined> {
  if (campaignId === undefined) return undefined;

  const campaignIdResult = validateString(campaignId, 'campaignId', { required: true, minLength: 1 });
  if (!campaignIdResult.valid) {
    return NextResponse.json({ error: campaignIdResult.error.message }, { status: 400 });
  }

  const result = await assertCampaignAccess(campaignIdResult.value, userId);
  if (result instanceof NextResponse) return result;
  if (result.role !== 'dm') {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  return { campaignId: campaignIdResult.value };
}

export const POST = withAuth(async (request, auth) => {
  const body = await parseEncounterBody(request);
  if (body instanceof NextResponse) return body;

  try {
    const fieldsResult = validateEncounterFields(body);
    if (!fieldsResult.valid) {
      return NextResponse.json({ error: fieldsResult.error }, { status: 400 });
    }

    const linked = await resolveLinkedCampaign(body.campaignId, auth.userId);
    if (linked instanceof NextResponse) return linked;

    const encounter: Encounter = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: fieldsResult.value.name,
      description: fieldsResult.value.description ?? '',
      monsters: fieldsResult.value.monsters ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveEncounter(encounter);

    if (linked !== undefined) {
      try {
        await addEncounterToCampaign(linked.campaignId, encounter.id, auth.userId);
      } catch (linkError) {
        console.error('Error linking encounter to campaign:', linkError);
        return NextResponse.json(
          { ...encounter, linkWarning: 'Encounter created but could not be linked to campaign; link it manually.' },
          { status: 201 }
        );
      }
    }

    return NextResponse.json(encounter, { status: 201 });
  } catch (error) {
    console.error('Error creating encounter:', error);
    return NextResponse.json(
      { error: 'Failed to create encounter' },
      { status: 500 }
    );
  }
});
