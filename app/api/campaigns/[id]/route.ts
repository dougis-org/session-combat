import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Campaign } from '@/lib/types';
import { sanitizeChapters, sanitizeCurrentChapterId } from '@/lib/utils/campaign';

type Params = { id: string };

async function findCampaign(id: string, userId: string): Promise<Campaign | NextResponse> {
  const campaign = await storage.loadCampaignById(id, userId);
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  return campaign;
}

export const GET = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const result = await findCampaign(id, auth.userId);
    if (result instanceof NextResponse) return result;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
});

export const PATCH = withAuthAndParams<Params>(async (request, auth, { id }) => {
  try {
    const result = await findCampaign(id, auth.userId);
    if (result instanceof NextResponse) return result;
    const campaign = result;

    const body = await request.json();
    const { name, moduleName, active, chapters, currentChapterId } = body;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
      }
    }

    let sanitizedChapters = campaign.chapters;
    let chaptersUpdated = false;
    if (chapters !== undefined) {
      chaptersUpdated = true;
      sanitizedChapters = sanitizeChapters(chapters);
    }

    let sanitizedCurrentChapterId = campaign.currentChapterId;
    if (currentChapterId !== undefined) {
      sanitizedCurrentChapterId = sanitizeCurrentChapterId(currentChapterId, sanitizedChapters);
    } else if (chaptersUpdated) {
      sanitizedCurrentChapterId = sanitizeCurrentChapterId(campaign.currentChapterId, sanitizedChapters);
    }

    const updated = {
      ...campaign,
      ...(name !== undefined && typeof name === 'string' && { name: name.trim() }),
      ...(moduleName !== undefined && typeof moduleName === 'string' && { moduleName: moduleName.trim() }),
      ...(active !== undefined && typeof active === 'boolean' && { active }),
      ...(chapters !== undefined && { chapters: sanitizedChapters }),
      currentChapterId: sanitizedCurrentChapterId,
      updatedAt: new Date(),
    };

    await storage.saveCampaign(updated);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id }) => {
  try {
    const result = await findCampaign(id, auth.userId);
    if (result instanceof NextResponse) return result;
    await storage.deleteCampaign(id, auth.userId);
    return NextResponse.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
});
