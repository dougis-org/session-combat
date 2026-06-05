import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { assertCampaignAccess } from '@/lib/utils/campaign';

type Params = { id: string; sessionId: string };

export const PATCH = withAuthAndParams<Params>(async (request, auth, { id: campaignId, sessionId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, auth.userId);
    if (result instanceof NextResponse) return result;
    const { role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const body = await request.json();
    const { title, datePlayed, summary, events, milestone, newLevel } = body;
    const patch = { title, datePlayed, summary, events, milestone, newLevel };
    const updated = await storage.updateSessionLog(sessionId, auth.userId, campaignId, patch);
    if (!updated) {
      return NextResponse.json({ error: 'Session log not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating session log:', error);
    return NextResponse.json({ error: 'Failed to update session log' }, { status: 500 });
  }
});

export const DELETE = withAuthAndParams<Params>(async (_request, auth, { id: campaignId, sessionId }) => {
  try {
    const result = await assertCampaignAccess(campaignId, auth.userId);
    if (result instanceof NextResponse) return result;
    const { role } = result;

    if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const deleted = await storage.deleteSessionLog(sessionId, auth.userId, campaignId);
    if (!deleted) {
      return NextResponse.json({ error: 'Session log not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Session log deleted' });
  } catch (error) {
    console.error('Error deleting session log:', error);
    return NextResponse.json({ error: 'Failed to delete session log' }, { status: 500 });
  }
});
