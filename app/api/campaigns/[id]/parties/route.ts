import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { getMember } from '@/lib/storage/membershipRepo';
import * as partyRepo from '@/lib/storage/partyRepo';

type Params = { id: string };

export const GET = withAuthAndParams<Params>(async (_request, auth, { id: campaignId }) => {
  try {
    const member = await getMember(campaignId, auth.userId);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const parties = await partyRepo.loadPartiesByCampaign(campaignId);
    return NextResponse.json(parties);
  } catch (error) {
    console.error('Error loading campaign parties:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
