import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { CampaignTemplate } from '@/lib/types';
import { GLOBAL_USER_ID } from '@/lib/constants';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/api-helpers';

export async function GET(_request: NextRequest) {
  try {
    const templates = await storage.loadGlobalCampaignTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching global campaign templates:', error);
    return NextResponse.json({ error: 'Failed to fetch global campaign templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  try {
    const body = await request.json();
    const { name, moduleName, description, chapters } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const validatedChapters = Array.isArray(chapters)
      ? chapters
          .filter((ch): boolean =>
            ch && typeof ch === 'object' &&
            typeof ch.id === 'string' && ch.id.trim() !== '' &&
            typeof ch.title === 'string' && ch.title.trim() !== '' &&
            typeof ch.order === 'number' && Number.isFinite(ch.order)
          )
          .map((ch: Record<string, unknown>) => ({
            id: (ch.id as string).trim(),
            title: (ch.title as string).trim(),
            order: ch.order as number,
            ...(typeof ch.description === 'string' && { description: ch.description }),
            ...(typeof ch.levelRange === 'string' && { levelRange: ch.levelRange }),
            ...(typeof ch.location === 'string' && { location: ch.location }),
          }))
      : [];

    const template: CampaignTemplate = {
      id: randomUUID(),
      userId: GLOBAL_USER_ID,
      isGlobal: true,
      name: name.trim(),
      moduleName: typeof moduleName === 'string' ? moduleName.trim() : '',
      description: typeof description === 'string' ? description : undefined,
      chapters: validatedChapters,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.saveCampaignTemplate(template);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating global campaign template:', error);
    return NextResponse.json({ error: 'Failed to create global campaign template' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const errorResponse = await requireAdmin(request);
  if (errorResponse) {
    return errorResponse;
  }

  return NextResponse.json({ error: 'Seed not yet implemented' }, { status: 501 });
}
