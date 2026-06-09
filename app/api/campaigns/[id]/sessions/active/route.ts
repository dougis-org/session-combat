import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { SessionLog } from '@/lib/types';
import { assertCampaignAccess } from '@/lib/utils/campaign';

type Params = { id: string };

export const POST = withAuthAndParams<Params>(async (_request, _auth, { id: campaignId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, _auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign, role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    if (campaign.activeSessionId) {
      return NextResponse.json({ error: 'A session is already active' }, { status: 409 });
    }

    const now = new Date();
    const log: SessionLog = {
      id: crypto.randomUUID(),
      userId: campaign.userId,
      campaignId,
      sessionNumber: await storage.getNextSessionNumber(campaign.userId, campaignId),
      datePlayed: now,
      title: undefined,
      summary: undefined,
      events: [],
      milestone: false,
      createdAt: now,
      updatedAt: now,
    };

    await storage.saveSessionLog(log);
    await storage.setActiveCampaignSession(campaignId, log.id);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error opening active session:', error);
    return NextResponse.json({ error: 'Failed to open active session' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (request, _auth, { id: campaignId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, _auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign, role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const force = new URL(request.url).searchParams.get('force') === 'true';

    if (!force && !campaign.activeSessionId) {
      return NextResponse.json({ error: 'No active session' }, { status: 404 });
    }

    const closedSessionId = campaign.activeSessionId ?? null;
    await storage.setActiveCampaignSession(campaignId, null);

    return NextResponse.json({ sessionId: closedSessionId });
  } catch (error) {
    console.error('Error closing active session:', error);
    return NextResponse.json({ error: 'Failed to close active session' }, { status: 500 });
  }
});
