import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Encounter } from '@/lib/types';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { validateString } from '@/lib/validation/core';
import { validateMonsterData } from '@/lib/validation/monsterUpload';

export const GET = withAuth(async (request, auth) => {
  try {
    const encounters = await storage.loadEncounters(auth.userId);
    return NextResponse.json(encounters);
  } catch (error) {
    console.error('Error fetching encounters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch encounters' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request, auth) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: 'Request body must be an object' }, { status: 400 });
  }

  try {
    const { name, description, monsters, campaignId } = body as Record<string, unknown>;

    const nameResult = validateString(name, 'name', { required: true, minLength: 1 });
    if (!nameResult.valid) {
      return NextResponse.json({ error: 'Encounter name is required' }, { status: 400 });
    }

    const descriptionResult = validateString(description, 'description');
    if (!descriptionResult.valid) {
      return NextResponse.json({ error: descriptionResult.error.message }, { status: 400 });
    }

    if (monsters !== undefined) {
      if (!Array.isArray(monsters)) {
        return NextResponse.json({ error: 'monsters must be an array' }, { status: 400 });
      }
      for (let i = 0; i < monsters.length; i++) {
        const monsterResult = validateMonsterData(monsters[i] ?? {}, i);
        if (!monsterResult.valid) {
          return NextResponse.json({ error: monsterResult.errors[0].message }, { status: 400 });
        }
      }
    }

    let linkedCampaignId: string | undefined;
    if (campaignId !== undefined) {
      const campaignIdResult = validateString(campaignId, 'campaignId', { required: true, minLength: 1 });
      if (!campaignIdResult.valid) {
        return NextResponse.json({ error: campaignIdResult.error.message }, { status: 400 });
      }
      linkedCampaignId = campaignIdResult.value;

      const result = await assertCampaignAccess(linkedCampaignId, auth.userId);
      if (result instanceof NextResponse) return result;
      const { role } = result;
      if (role !== 'dm') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
    }

    const encounter: Encounter = {
      _id: undefined,
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: nameResult.value,
      description: descriptionResult.value,
      monsters: (monsters as Encounter['monsters']) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveEncounter(encounter);

    if (linkedCampaignId !== undefined) {
      try {
        await storage.addEncounterToCampaign(linkedCampaignId, encounter.id, auth.userId);
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
