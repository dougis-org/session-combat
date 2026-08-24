import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { validateString } from '@/lib/validation/core';

type Params = { id: string; encounterId: string };

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id, encounterId }) => {
  try {
    const idResult = validateString(id, 'id', { required: true, minLength: 1 });
    if (!idResult.valid) return NextResponse.json({ error: idResult.error.message }, { status: 400 });
    const encounterIdResult = validateString(encounterId, 'encounterId', { required: true, minLength: 1 });
    if (!encounterIdResult.valid) return NextResponse.json({ error: encounterIdResult.error.message }, { status: 400 });

    const result = await assertCampaignAccess(id, auth.userId);
    if (result instanceof NextResponse) return result;
    const { role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    await storage.removeEncounterFromCampaign(id, encounterId, auth.userId);

    return NextResponse.json({ message: 'Encounter unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking encounter from campaign:', error);
    return NextResponse.json({ error: 'Failed to unlink encounter from campaign' }, { status: 500 });
  }
});
