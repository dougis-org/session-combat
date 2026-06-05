import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { SessionLog } from '@/lib/types';
import { assertCampaignAccess } from '@/lib/utils/campaign';

type Params = { id: string };

export const GET = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign } = result;

    const logs = await storage.loadSessionLogs(campaign.userId, campaignId);
    const limitParam = new URL(request.url).searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    return NextResponse.json(limit && limit > 0 ? logs.slice(0, limit) : logs);
  } catch (error) {
    console.error('Error fetching session logs:', error);
    return NextResponse.json({ error: 'Failed to fetch session logs' }, { status: 500 });
  }
});

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, auth.userId);
    if (result instanceof NextResponse) return result;
    const { campaign, role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const body = await request.json();
    const { datePlayed, sessionNumber, title, summary, events, milestone, newLevel } = body;

    if (!datePlayed) {
      return NextResponse.json({ error: 'datePlayed is required' }, { status: 400 });
    }

    const resolvedSessionNumber =
      typeof sessionNumber === 'number' && Number.isInteger(sessionNumber) && sessionNumber >= 0
        ? sessionNumber
        : await storage.getNextSessionNumber(campaign.userId, campaignId);

    const now = new Date();
    const log: SessionLog = {
      id: crypto.randomUUID(),
      userId: campaign.userId,
      campaignId,
      sessionNumber: resolvedSessionNumber,
      title: typeof title === 'string' ? title.trim() || undefined : undefined,
      datePlayed: new Date(datePlayed),
      summary: typeof summary === 'string' ? summary : undefined,
      events: Array.isArray(events) ? events : [],
      milestone: milestone === true,
      ...(milestone === true && typeof newLevel === 'number' && Number.isInteger(newLevel) && newLevel > 0 && { newLevel }),
      createdAt: now,
      updatedAt: now,
    };

    await storage.saveSessionLog(log);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating session log:', error);
    return NextResponse.json({ error: 'Failed to create session log' }, { status: 500 });
  }
});
