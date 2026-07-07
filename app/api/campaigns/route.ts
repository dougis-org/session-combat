import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { CAMPAIGN_STATUSES } from '@/lib/types';
import type { Campaign, Party } from '@/lib/types';
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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
    }

    const { name, moduleName, status, notes, chapters, currentChapterId } = body as Record<string, unknown>;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    if (typeof notes === 'string' && notes.length > 10000) {
      return NextResponse.json({ error: 'Notes must be a string of 10,000 characters or fewer' }, { status: 400 });
    }

    const sanitizedChapters = sanitizeChapters(chapters);
    const sanitizedCurrentChapterId = sanitizeCurrentChapterId(currentChapterId, sanitizedChapters);

    const resolvedStatus: (typeof CAMPAIGN_STATUSES)[number] =
      typeof status === 'string' && CAMPAIGN_STATUSES.includes(status as (typeof CAMPAIGN_STATUSES)[number])
        ? (status as (typeof CAMPAIGN_STATUSES)[number])
        : 'active';

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

    const party: Party = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: 'Main Party',
      description: '',
      members: [],
      campaignId: campaign.id,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };

    try {
      await storage.saveParty(party);
    } catch (partyError) {
      try {
        await storage.deleteCampaign(campaign.id, auth.userId);
      } catch (rollbackError) {
        console.error('Failed to rollback campaign creation:', rollbackError);
      }
      throw partyError;
    }

    try {
      await storage.addMember({
        id: crypto.randomUUID(),
        campaignId: campaign.id,
        userId: auth.userId,
        role: 'dm',
        status: 'active',
        history: [{ action: 'active' as const, by: auth.userId, at: new Date() }],
      });
    } catch (memberError) {
      try {
        await storage.deleteParty(party.id, auth.userId);
      } catch (rollbackError) {
        console.error('Failed to rollback party creation:', rollbackError);
      }
      try {
        await storage.deleteCampaign(campaign.id, auth.userId);
      } catch (rollbackError) {
        console.error('Failed to rollback campaign creation:', rollbackError);
      }
      throw memberError;
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
});
