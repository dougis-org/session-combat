import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { DuplicateMemberError } from '@/lib/errors';

type Params = { id: string };

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  try {
    const body = await request.json();
    const { userId } = body;

    if (typeof userId !== 'string' || userId.trim() === '') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (userId === auth.userId) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    const caller = await storage.getMember(campaignId, auth.userId);
    if (!caller || caller.role !== 'dm' || caller.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const target = await storage.getMember(campaignId, userId);

    if (!target) {
      const newId = crypto.randomUUID();
      await storage.addMember({
        id: newId,
        campaignId,
        userId,
        role: 'player',
        status: 'invited',
        history: [{ action: 'invited', by: auth.userId, at: new Date() }],
      });
      return NextResponse.json({ id: newId, status: 'invited' }, { status: 201 });
    }

    if (target.status === 'active' || target.status === 'invited') {
      return NextResponse.json({ error: 'Member already exists' }, { status: 409 });
    }

    await storage.updateMemberStatus(campaignId, userId, 'invited', auth.userId);
    return NextResponse.json({ id: target.id, status: 'invited' }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateMemberError) {
      return NextResponse.json({ error: 'Member already exists' }, { status: 409 });
    }
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
