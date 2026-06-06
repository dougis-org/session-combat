import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { getDatabase } from '@/lib/db';
import { DuplicateMemberError } from '@/lib/errors';

type Params = { id: string };

export const GET = withAuthAndParams<Params>(async (_request, auth, { id: campaignId }) => {
  try {
    const caller = await storage.getMember(campaignId, auth.userId);
    if (!caller || caller.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await storage.listMembersForCampaign(campaignId);

    const validObjectIds = members
      .map(m => m.userId)
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const db = await getDatabase();
    const userDocs = await db
      .collection('users')
      .find({ _id: { $in: validObjectIds } }, { projection: { username: 1 } })
      .toArray();

    const usernameMap = new Map(
      userDocs.map(u => [u._id.toString(), typeof u.username === 'string' ? u.username : u._id.toString()])
    );

    const enriched = members.map(m => ({
      id: m.id,
      userId: m.userId,
      username: usernameMap.get(m.userId) ?? m.userId,
      role: m.role,
      status: m.status,
    }));

    return NextResponse.json({ members: enriched });
  } catch (error) {
    console.error('Error listing members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const { userId: rawUserId } = body as Record<string, unknown>;

    if (typeof rawUserId !== 'string' || rawUserId.trim() === '') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userId = rawUserId.trim();

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

    await storage.updateMemberStatus(campaignId, userId, 'invited', auth.userId, 'player');
    return NextResponse.json({ id: target.id, status: 'invited' }, { status: 201 });
  } catch (error) {
    if (error instanceof DuplicateMemberError) {
      return NextResponse.json({ error: 'Member already exists' }, { status: 409 });
    }
    console.error('Error inviting member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
