import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { SessionLog } from '@/lib/types';

type Params = { id: string };

export const GET = withAuthAndParams<Params>(async (_request, auth, { id: campaignId }) => {
  try {
    const campaign = await storage.loadCampaignById(campaignId, auth.userId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    const logs = await storage.loadSessionLogs(auth.userId, campaignId);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching session logs:', error);
    return NextResponse.json({ error: 'Failed to fetch session logs' }, { status: 500 });
  }
});

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const campaign = await storage.loadCampaignById(campaignId, auth.userId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const body = await request.json();
    const { datePlayed, sessionNumber, title, summary, events, milestone, newLevel } = body;

    if (!datePlayed) {
      return NextResponse.json({ error: 'datePlayed is required' }, { status: 400 });
    }

    const resolvedSessionNumber =
      typeof sessionNumber === 'number'
        ? sessionNumber
        : await storage.getNextSessionNumber(auth.userId, campaignId);

    const now = new Date();
    const log: SessionLog = {
      id: crypto.randomUUID(),
      userId: auth.userId,
      campaignId,
      sessionNumber: resolvedSessionNumber,
      title: typeof title === 'string' ? title.trim() || undefined : undefined,
      datePlayed: new Date(datePlayed),
      summary: typeof summary === 'string' ? summary : undefined,
      events: Array.isArray(events) ? events : [],
      milestone: milestone === true,
      ...(typeof newLevel === 'number' && { newLevel }),
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
