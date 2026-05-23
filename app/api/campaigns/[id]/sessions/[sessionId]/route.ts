import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';

type Params = { id: string; sessionId: string };

export const PATCH = withAuthAndParams<Params>(async (request, auth, { id: campaignId, sessionId }) => {
  try {
    const body = await request.json();
    const updated = await storage.updateSessionLog(sessionId, auth.userId, campaignId, body);
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
