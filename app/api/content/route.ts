import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import * as savedContentRepo from '@/lib/storage/savedContentRepo';
import { validateIdentifier, validateSavedContentCreate } from '@/lib/validation/savedContent';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const campaign = validateIdentifier(searchParams.get('campaignId'), 'campaignId');
    if (!campaign.valid) {
      return NextResponse.json({ error: campaign.error }, { status: 400 });
    }
    const items = await savedContentRepo.list(campaign.value, auth.userId);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching saved content:', error);
    return NextResponse.json({ error: 'Failed to fetch saved content' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const input = validateSavedContentCreate(body);
    if (!input.valid) {
      return NextResponse.json({ error: input.error }, { status: 400 });
    }

    const item = await savedContentRepo.create({ userId: auth.userId, ...input.value });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating saved content:', error);
    return NextResponse.json({ error: 'Failed to create saved content' }, { status: 500 });
  }
});
