import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { requireAuth } from '@/lib/middleware';
import { Campaign, CampaignChapter } from '@/lib/types';
import { randomUUID } from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const templates = await storage.loadGlobalCampaignTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      return NextResponse.json({ error: 'Campaign template not found' }, { status: 404 });
    }

    const copiedChapters: CampaignChapter[] = template.chapters.map((ch) => ({
      ...ch,
      id: randomUUID(),
    }));

    const campaign: Campaign = {
      id: randomUUID(),
      userId: auth.userId,
      name: template.name,
      moduleName: template.moduleName,
      chapters: copiedChapters,
      currentChapterId: copiedChapters.length > 0 ? copiedChapters[0].id : undefined,
      templateId: template.id,
      active: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveCampaign(campaign);

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error copying campaign template:', error);
    return NextResponse.json({ error: 'Failed to copy campaign template' }, { status: 500 });
  }
}
