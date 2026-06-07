import { NextRequest, NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';

export const GET = withAuthAndParams<{ id: string }>(async (_request, auth, { id: campaignId }) => {
  try {
    const member = await storage.getMember(campaignId, auth.userId);
    if (!member) {
      return NextResponse.json({ error: 'Not a member' }, { status: 404 });
    }
    return NextResponse.json(member);
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

type Params = { id: string };

export const PATCH = withAuthAndParams<Params>(async (request: NextRequest, auth, { id: campaignId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { action } = (body ?? {}) as Record<string, unknown>;
  if (action !== 'accept' && action !== 'decline') {
    return NextResponse.json({ error: 'action must be "accept" or "decline"' }, { status: 400 });
  }

  try {
    const member = await storage.getMember(campaignId, auth.userId);
    if (!member || member.status === 'removed') {
      return NextResponse.json({ error: 'No invitation found' }, { status: 404 });
    }

    const { status } = member;

    if (action === 'accept') {
      if (status === 'active') return NextResponse.json({ status: 'active' }, { status: 200 });
      if (status === 'declined') return NextResponse.json({ error: 'You have already declined this invitation' }, { status: 409 });
      await storage.updateMemberStatus(campaignId, auth.userId, 'active', auth.userId);
      return NextResponse.json({ status: 'active' }, { status: 200 });
    }

    // action === 'decline'
    if (status === 'declined') return NextResponse.json({ status: 'declined' }, { status: 200 });
    if (status === 'active') return NextResponse.json({ error: 'You have already accepted this invitation' }, { status: 409 });
    await storage.updateMemberStatus(campaignId, auth.userId, 'declined', auth.userId);
    return NextResponse.json({ status: 'declined' }, { status: 200 });
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
