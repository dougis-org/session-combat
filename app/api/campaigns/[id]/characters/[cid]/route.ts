import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';

type Params = { id: string; cid: string };

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id: campaignId, cid: characterId }) => {
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

    const deleted = await storage.removeShare(campaignId, characterId, auth.userId);
    if (!deleted) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    void storage.setPartyMemberLeftAt(campaignId, characterId, new Date()).catch(
      (e: unknown) => console.error('Error during party cleanup after unshare:', e)
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unsharing character:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
