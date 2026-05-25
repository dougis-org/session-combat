import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { SavedContent } from '@/lib/types';

export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }
    const items = await storage.savedContent.list(campaignId, auth.userId);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching saved content:', error);
    return NextResponse.json({ error: 'Failed to fetch saved content' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const body = await request.json();
    const { campaignId, type, title, systemPrompt, userMessage, prompt, chapter } = body;

    if (!campaignId || !type || !title || !systemPrompt || !userMessage || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes: SavedContent['type'][] = ['npc', 'location', 'shop', 'magic-item', 'room'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const item = await storage.savedContent.create({
      userId: auth.userId,
      campaignId,
      type,
      title,
      systemPrompt,
      userMessage,
      prompt,
      chapter: typeof chapter === 'string' ? chapter : undefined,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating saved content:', error);
    return NextResponse.json({ error: 'Failed to create saved content' }, { status: 500 });
  }
});
