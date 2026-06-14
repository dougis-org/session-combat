import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { getDatabase } from '@/lib/db';
import { emitFiltered } from '@/lib/server/transport';
import { canSeeMessage } from '@/lib/utils/campaignMessages';
import type { CampaignMessage, MessageVisibility } from '@/lib/types';

type Params = { id: string };

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, visibility } = body as Record<string, unknown>;

  if (typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const MAX_TEXT_LENGTH = 5000;
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }, { status: 400 });
  }

  if (!visibility || typeof visibility !== 'object') {
    return NextResponse.json({ error: 'visibility is required' }, { status: 400 });
  }

  const vis = visibility as Record<string, unknown>;
  const scope = vis['scope'];

  if (scope !== 'group' && scope !== 'direct' && scope !== 'dm-only') {
    return NextResponse.json({ error: 'visibility.scope must be group, direct, or dm-only' }, { status: 400 });
  }

  if (scope === 'direct' && (typeof vis['toUserId'] !== 'string' || vis['toUserId'].trim() === '')) {
    return NextResponse.json({ error: 'visibility.toUserId is required for direct messages' }, { status: 400 });
  }

  const caller = await storage.getMember(campaignId, auth.userId);
  if (!caller || caller.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await storage.getUserById(auth.userId);
  const senderName = user?.username ?? 'Unknown';

  let msgVisibility: MessageVisibility;
  if (scope === 'direct') {
    msgVisibility = { scope: 'direct', toUserId: (vis['toUserId'] as string).trim() };
  } else {
    msgVisibility = { scope };
  }

  const message: CampaignMessage = {
    id: crypto.randomUUID(),
    campaignId,
    senderId: auth.userId,
    senderName,
    text: text.trim(),
    visibility: msgVisibility,
    createdAt: new Date(),
  };

  const db = await getDatabase();
  const { _id: _ignored, ...messageDoc } = message;
  void _ignored;
  await db.collection('campaignMessages').insertOne(messageDoc);

  const activeMembers = await storage.listMembersForCampaign(campaignId);
  const activeMembersFiltered = activeMembers.filter(m => m.status === 'active');

  emitFiltered(
    campaignId,
    { type: 'message', campaignId, data: message },
    (uid) => canSeeMessage(message, uid, activeMembersFiltered)
  );

  return NextResponse.json(message, { status: 201 });
});

export const GET = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  const caller = await storage.getMember(campaignId, auth.userId);
  if (!caller || caller.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10);
  const limit = Math.min(isNaN(rawLimit) || rawLimit < 1 ? 50 : rawLimit, 100);
  const before = searchParams.get('before');

  let beforeDate: Date | null = null;
  if (before) {
    const parsed = new Date(before);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'Invalid before cursor' }, { status: 400 });
    }
    beforeDate = parsed;
  }

  const userId = auth.userId;
  const role = caller.role;

  const query: Record<string, unknown> = {
    campaignId,
    ...(beforeDate ? { createdAt: { $lt: beforeDate } } : {}),
    $or: [
      { 'visibility.scope': 'group' },
      { 'visibility.scope': 'direct', 'visibility.toUserId': userId },
      { 'visibility.scope': 'direct', senderId: userId },
      { 'visibility.scope': 'dm-only', senderId: userId },
      ...(role === 'dm' ? [{ 'visibility.scope': 'dm-only' }] : []),
    ],
  };

  const db = await getDatabase();
  const docs = await db
    .collection('campaignMessages')
    .find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .toArray();

  let nextCursor: string | undefined;
  if (docs.length > limit) {
    docs.pop();
    nextCursor = (docs[docs.length - 1]['createdAt'] as Date).toISOString();
  }

  const messages = docs.map(doc => {
    const { _id, ...rest } = doc;
    void _id;
    return rest as unknown as CampaignMessage;
  });

  return NextResponse.json({ messages, ...(nextCursor ? { nextCursor } : {}) });
});
