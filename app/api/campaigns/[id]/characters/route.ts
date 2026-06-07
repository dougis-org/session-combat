import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { DuplicateShareError } from '@/lib/errors';

type Params = { id: string };

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const bodyObj = body !== null && typeof body === 'object' ? body as Record<string, unknown> : {};
  const { characterId: rawCharacterId } = bodyObj;
  if (typeof rawCharacterId !== 'string' || rawCharacterId.trim() === '') {
    return NextResponse.json({ error: 'characterId is required' }, { status: 400 });
  }
  const characterId = rawCharacterId.trim();

  try {
    const member = await storage.getMember(campaignId, auth.userId);
    if (!member || member.status !== 'active' || member.role !== 'player') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const character = await storage.loadCharacterById(characterId);
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    if (character.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const id = crypto.randomUUID();
    await storage.addShare({
      id,
      campaignId,
      characterId,
      userId: auth.userId,
      sharedAt: new Date(),
    });

    return NextResponse.json({ id, characterId }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateShareError) {
      return NextResponse.json({ error: 'Character already shared' }, { status: 409 });
    }
    console.error('Error sharing character:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const GET = withAuthAndParams<Params>(async (_request, auth, { id: campaignId }) => {
  try {
    const member = await storage.getMember(campaignId, auth.userId);
    if (!member || member.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shares = await storage.listSharesForCampaign(campaignId, auth.userId);
    return NextResponse.json(shares);
  } catch (error) {
    console.error('Error listing character shares:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
