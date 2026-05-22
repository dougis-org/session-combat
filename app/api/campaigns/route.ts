import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { Campaign } from '@/lib/types';

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
    const { name, moduleName, active, chapters, currentChapterId } = body;

    if (typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    let sanitizedChapters: any[] = [];
    if (Array.isArray(chapters)) {
      sanitizedChapters = chapters
        .map((ch: any, index: number) => {
          const id = typeof ch?.id === 'string' ? ch.id : crypto.randomUUID();
          const title = typeof ch?.title === 'string' ? ch.title.trim() : '';
          const order = typeof ch?.order === 'number' ? ch.order : index;
          return { id, title, order };
        })
        .sort((a, b) => a.order - b.order)
        .map((ch, index) => ({ ...ch, order: index }));
    }

    let sanitizedCurrentChapterId: string | undefined = undefined;
    if (typeof currentChapterId === 'string' && currentChapterId.trim() !== '') {
      const exists = sanitizedChapters.some((ch) => ch.id === currentChapterId);
      if (exists) {
        sanitizedCurrentChapterId = currentChapterId;
      }
    }

    const campaign: Campaign = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      name: name.trim(),
      moduleName: typeof moduleName === 'string' ? moduleName.trim() : '',
      chapters: sanitizedChapters,
      currentChapterId: sanitizedCurrentChapterId,
      active: typeof active === 'boolean' ? active : false,
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
