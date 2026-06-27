import { NextResponse } from 'next/server';
import { withAuthAndParams } from '@/lib/middleware';
import { storage } from '@/lib/storage';
import { getDatabase } from '@/lib/db';
import { emitFiltered } from '@/lib/server/transport';
import { canSeeMessage } from '@/lib/utils/campaignMessages';
import type { CampaignMessage, MessageVisibility } from '@/lib/types';

type Params = { id: string };

function validateScenePayload(text: unknown, attachmentId: unknown): NextResponse | null {
  const hasText = typeof text === 'string' && text.trim().length > 0;
  const hasAttachment = typeof attachmentId === 'string' && attachmentId.trim().length > 0;
  if (!hasText && !hasAttachment) {
    return NextResponse.json(
      { error: 'Scene messages require at least one of text or attachmentId' },
      { status: 400 }
    );
  }
  if (hasText && (text as string).trim().length > 5000) {
    return NextResponse.json({ error: 'text exceeds maximum length of 5000 characters' }, { status: 400 });
  }
  return null;
}

function validateChatPayload(text: unknown): NextResponse | null {
  if (typeof text !== 'string' || text.trim() === '') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (text.trim().length > 5000) {
    return NextResponse.json({ error: 'text exceeds maximum length of 5000 characters' }, { status: 400 });
  }
  return null;
}

function isValidScope(scope: unknown): scope is 'group' | 'direct' | 'dm-only' {
  return scope === 'group' || scope === 'direct' || scope === 'dm-only';
}

function getToUserId(vis: Record<string, unknown>): string {
  const raw = vis['toUserId'];
  return typeof raw === 'string' ? raw.trim() : '';
}

function parseVisibility(visibility: unknown): { error: NextResponse } | { msgVisibility: MessageVisibility } {
  if (!visibility || typeof visibility !== 'object') {
    return { error: NextResponse.json({ error: 'visibility is required' }, { status: 400 }) };
  }
  const vis = visibility as Record<string, unknown>;
  const scope = vis['scope'];
  if (!isValidScope(scope)) {
    return { error: NextResponse.json({ error: 'visibility.scope must be group, direct, or dm-only' }, { status: 400 }) };
  }
  const toUserId = getToUserId(vis);
  if (scope === 'direct' && !toUserId) {
    return { error: NextResponse.json({ error: 'visibility.toUserId is required for direct messages' }, { status: 400 }) };
  }
  const msgVisibility: MessageVisibility = scope === 'direct'
    ? { scope: 'direct', toUserId }
    : { scope };
  return { msgVisibility };
}

type CallerRecord = Awaited<ReturnType<typeof storage.getMember>>;

function checkCallerAccess(caller: CallerRecord, isScene: boolean): NextResponse | null {
  if (!caller || caller.status !== 'active') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (isScene && caller.role !== 'dm') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

function applySceneFields(message: CampaignMessage, attachmentId: unknown): void {
  message.kind = 'scene';
  if (typeof attachmentId === 'string' && attachmentId.trim().length > 0) {
    message.attachmentId = attachmentId.trim();
  }
}

export const POST = withAuthAndParams<Params>(async (request, auth, { id: campaignId }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { text, visibility, kind, attachmentId } = body as Record<string, unknown>;
  const isScene = kind === 'scene';

  const caller = await storage.getMember(campaignId, auth.userId);
  const accessError = checkCallerAccess(caller, isScene);
  if (accessError) return accessError;

  const bodyError = isScene ? validateScenePayload(text, attachmentId) : validateChatPayload(text);
  if (bodyError) return bodyError;

  const visResult = parseVisibility(visibility);
  if ('error' in visResult) return visResult.error;

  const user = await storage.getUserById(auth.userId);
  const senderName = user?.username ?? 'Unknown';

  const message: CampaignMessage = {
    id: crypto.randomUUID(),
    campaignId,
    senderId: auth.userId,
    senderName,
    text: typeof text === 'string' ? text.trim() : '',
    visibility: visResult.msgVisibility,
    createdAt: new Date(),
  };

  if (isScene) applySceneFields(message, attachmentId);

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
