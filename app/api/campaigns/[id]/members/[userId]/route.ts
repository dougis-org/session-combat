import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';

type Params = { id: string; userId: string };

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id: campaignId, userId: targetUserId }) => {
  try {
    const caller = await storage.getMember(campaignId, auth.userId);
    if (!caller || caller.role !== 'dm' || caller.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (auth.userId === targetUserId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    const target = await storage.getMember(campaignId, targetUserId);
    if (!target || (target.status !== 'active' && target.status !== 'invited')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await storage.updateMemberStatus(campaignId, targetUserId, 'removed', auth.userId);

    void (async () => {
      try {
        const shares = await storage.listAllSharesForCampaign(campaignId);
        const targetShares = shares.filter(s => s.userId === targetUserId);
        const now = new Date();
        await Promise.all(
          targetShares.map(share => storage.setPartyMemberLeftAt(campaignId, share.characterId, now))
        );
      } catch (cleanupError) {
        console.error('Error during party cleanup after member removal:', cleanupError);
      }
    })();

    return NextResponse.json({ status: 'removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
