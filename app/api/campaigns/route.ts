import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Campaign, CAMPAIGN_STATUSES } from '@/lib/types';
import { sanitizeChapters, sanitizeCurrentChapterId } from '@/lib/utils/campaign';

export const GET = withAuth(async (_request, auth) => {
  try {
    const campaigns = await storage.loadCampaigns(auth.userId);
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
});

export const POST = withAuth(async (request, auth) => {
  try {
    const body = await request.json();
    const { name, moduleName, status, notes, chapters, currentChapterId } = body;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    if (typeof notes === 'string' && notes.length > 10000) {
      return NextResponse.json({ error: 'Notes must be a string of 10,000 characters or fewer' }, { status: 400 });
    }

    const sanitizedChapters = sanitizeChapters(chapters);
    const sanitizedCurrentChapterId = sanitizeCurrentChapterId(currentChapterId, sanitizedChapters);

    const resolvedStatus = CAMPAIGN_STATUSES.includes(status) ? status : 'active';

    const campaign: Campaign = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      moduleName: typeof moduleName === 'string' ? moduleName.trim() : '',
      chapters: sanitizedChapters,
      currentChapterId: sanitizedCurrentChapterId,
      status: resolvedStatus,
      notes: typeof notes === 'string' ? notes : '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveCampaign(campaign);

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
});
