import type { ChangeStream } from 'mongodb';
import { connectToDatabase, getDatabase } from '@/lib/db';
import { storage } from '@/lib/storage';
import { canSeeMessage } from '@/lib/utils/campaignMessages';
import { canSeeRoll } from '@/lib/utils/campaignRolls';
import type { CampaignMember, CampaignMessage, CampaignRoll, CampaignStreamEvent } from '@/lib/types';

type EventHandler = (event: CampaignStreamEvent) => void;

interface Subscription {
  userId: string;
  handler: EventHandler;
}

// Module-level singletons — process-scoped state (safe on Fly.io single-process,
// cross-instance-safe delivery is handled by the shared change-stream/poll observing
// writes made by *any* instance, not by this in-memory state itself).
let openPromise: Promise<ChangeStream> | null = null;
let sharedCursor: ChangeStream | null = null;
let subscriberCount = 0;
// Keyed by a per-subscription token so the same user can hold multiple concurrent
// subscriptions (e.g. multiple browser tabs) without overwriting each other.
const registry = new Map<string, Map<string, Subscription>>();
// Last-observed activeSessionId per campaignId, used to derive `session` events from
// field-level changes on the `campaigns` collection (Decision 3). Cleaned up when the
// last subscriber for a campaign tears down.
const lastKnownActiveSessionId = new Map<string, string | null>();
let nextSubId = 0;
let isReplicaSet: boolean | null = null;
let detectPromise: Promise<boolean> | null = null;

async function detectReplicaSet(): Promise<boolean> {
  if (isReplicaSet !== null) return isReplicaSet;
  if (!detectPromise) {
    detectPromise = (async () => {
      try {
        // Probe by opening a change stream — avoids needing admin privileges for replSetGetStatus.
        const { client } = await connectToDatabase();
        const probe = client.db().collection('campaigns').watch([], { maxAwaitTimeMS: 100 });
        await probe.close();
        isReplicaSet = true;
      } catch (err) {
        const isNotReplicaSetError =
          err instanceof Error && (
            err.message.includes('not running with --replSet') ||
            err.message.includes('$changeStream') ||
            (err as { code?: number }).code === 76 ||
            (err as { code?: number }).code === 40573
          );
        if (isNotReplicaSetError) {
          isReplicaSet = false;
        } else {
          // Transient error — don't cache, retry next time
          detectPromise = null;
          return false;
        }
      }
      detectPromise = null;
      return isReplicaSet ?? false;
    })();
  }
  return detectPromise;
}

async function activeMembers(campaignId: string): Promise<CampaignMember[]> {
  const members = await storage.listMembersForCampaign(campaignId);
  return members.filter(m => m.status === 'active');
}

function emitToRegistry(
  campaignId: string,
  event: CampaignStreamEvent,
  canReceive?: (userId: string) => boolean
) {
  const handlers = registry.get(campaignId);
  if (!handlers) return;
  for (const sub of handlers.values()) {
    if (canReceive && !canReceive(sub.userId)) continue;
    try { sub.handler(event); } catch { /* handler errors don't break the stream */ }
  }
}

// Compares against the last-known activeSessionId for a campaign in the given tracking
// map, updates it, and reports whether a `session` event should be emitted.
//
// The change-stream path uses the shared `lastKnownActiveSessionId` map, since one
// observed write there fans out to every registry subscriber via a single
// emitToRegistry call — there's no risk of one subscriber's observation suppressing
// another's. The polling path instead gives each subscription its own private map:
// each subscription polls independently, so sharing state across subscriptions for the
// same campaign would let whichever subscription's poll happens to run first "consume"
// the transition and starve every other subscriber of that campaign's session event.
function shouldEmitSession(
  map: Map<string, string | null>,
  campaignId: string,
  activeSessionId: string | null
): boolean {
  if (map.get(campaignId) === activeSessionId) return false;
  map.set(campaignId, activeSessionId);
  return true;
}

// Builds a `{ type, campaignId, data }` event per doc and hands it to `dispatch` along
// with a per-doc visibility predicate. `dispatch` decides how delivery actually happens:
// the change-stream path fans out to every registry subscriber via emitToRegistry, the
// polling path checks the single subscription's own userId before calling its handler.
function emitVisible<T>(
  campaignId: string,
  type: 'message' | 'roll',
  docs: T[],
  members: CampaignMember[],
  canSee: (doc: T, userId: string, members: CampaignMember[]) => boolean,
  dispatch: (event: CampaignStreamEvent, canReceive: (userId: string) => boolean) => void
) {
  for (const doc of docs) {
    dispatch(
      { type, campaignId, data: doc } as CampaignStreamEvent,
      uid => canSee(doc, uid, members)
    );
  }
}

type ChangeDoc = {
  ns?: { coll?: string };
  fullDocument?: Record<string, unknown>;
  updateDescription?: { updatedFields?: Record<string, unknown> };
};

async function demuxCampaignDoc(doc: ChangeDoc, campaignId: string, fullDocument: Record<string, unknown>) {
  const { campaignId: _cid, id: _id, ...rest } = fullDocument;
  emitToRegistry(campaignId, { type: 'change', campaignId, data: rest });

  const changedFields = doc.updateDescription?.updatedFields ?? fullDocument;
  if ('activeSessionId' in changedFields) {
    const activeSessionId = (fullDocument['activeSessionId'] ?? null) as string | null;
    if (shouldEmitSession(lastKnownActiveSessionId, campaignId, activeSessionId)) {
      emitToRegistry(campaignId, { type: 'session', campaignId, data: { activeSessionId } });
    }
  }
}

// Raw Mongo documents carry `_id` (an ObjectId); the same-instance emitFiltered() fast
// path never has one (routes construct CampaignMessage/CampaignRoll without it before
// insert). Strip it here so the Mongo-observed path's payload shape matches the fast
// path's exactly, regardless of which one a given subscriber's event happens to take.
function stripMongoId<T extends { _id?: unknown }>(doc: T): Omit<T, '_id'> {
  const { _id: _ignored, ...rest } = doc;
  return rest;
}

async function demuxMessageDoc(campaignId: string, fullDocument: Record<string, unknown>) {
  if (!registry.get(campaignId)?.size) return;
  const message = stripMongoId(fullDocument as unknown as CampaignMessage);
  const members = await activeMembers(campaignId);
  emitVisible(campaignId, 'message', [message], members, canSeeMessage,
    (event, canReceive) => emitToRegistry(campaignId, event, canReceive));
}

async function demuxRollDoc(campaignId: string, fullDocument: Record<string, unknown>) {
  if (!registry.get(campaignId)?.size) return;
  const roll = stripMongoId(fullDocument as unknown as CampaignRoll);
  const members = await activeMembers(campaignId);
  emitVisible(campaignId, 'roll', [roll], members, canSeeRoll,
    (event, canReceive) => emitToRegistry(campaignId, event, canReceive));
}

async function demux(doc: ChangeDoc): Promise<void> {
  const fullDocument = doc.fullDocument;
  if (!fullDocument) return;
  const campaignId = (fullDocument['campaignId'] ?? fullDocument['id']) as string | undefined;
  if (!campaignId) return;
  if (!registry.has(campaignId)) return;

  const coll = doc.ns?.coll;
  if (coll === 'campaignMessages') {
    await demuxMessageDoc(campaignId, fullDocument);
  } else if (coll === 'campaignRolls') {
    await demuxRollDoc(campaignId, fullDocument);
  } else if (coll === 'campaigns' || coll === undefined) {
    // Undefined ns.coll covers the legacy/mocked collection-level watch shape; a real
    // db-level watch always sets ns.coll. Any other collection name is explicitly
    // ignored below. The server-side $match in openStream() already restricts the watch
    // to the three collections above, but this allowlist stays as defense in depth —
    // without it, a bug in that pipeline (or a future change to it) that let an
    // unrelated collection's write through would otherwise be broadcast to that
    // campaign's subscribers as a `change` event, leaking data outside the three
    // collections this transport is meant to serve.
    await demuxCampaignDoc(doc, campaignId, fullDocument);
  }
}

async function closeStream() {
  const promise = openPromise;
  const cursor = sharedCursor;
  openPromise = null;
  sharedCursor = null;
  if (promise) {
    try {
      const resolvedCursor = await promise;
      await resolvedCursor.close();
    } catch { /* ignore */ }
  } else if (cursor) {
    try {
      await cursor.close();
    } catch { /* ignore */ }
  }
}

// Server-side $match narrows the change stream to the three collections this transport
// serves, so Mongo itself filters out irrelevant collections instead of every document
// in the database being shipped to this process just to be discarded by demux()'s
// in-process ns.coll allowlist.
const WATCHED_COLLECTIONS = ['campaigns', 'campaignMessages', 'campaignRolls'];

async function openStream(): Promise<ChangeStream> {
  if (openPromise) return openPromise;
  const promise = (async () => {
    const { client } = await connectToDatabase();
    const cursor = client.db().watch(
      [{ $match: { 'ns.coll': { $in: WATCHED_COLLECTIONS } } }],
      { fullDocument: 'updateLookup' }
    ) as ChangeStream;
    sharedCursor = cursor;

    // Start async iteration in background
    (async () => {
      try {
        for await (const doc of cursor as AsyncIterable<ChangeDoc>) {
          // A single malformed/unexpected document (e.g. a members lookup or visibility
          // predicate throwing on unexpected shape) must not tear down the shared cursor
          // — that would kill cross-instance delivery for every campaign, not just the
          // one document that failed to process.
          try {
            await demux(doc);
          } catch (err) {
            console.error('transport demux error (document skipped, stream continues):', err);
          }
        }
      } catch (err) {
        const isInvalidated =
          err instanceof Error &&
          (err.name === 'ChangeStreamInvalidatedError' || err.message.includes('ChangeStreamInvalidated'));

        // Log even the expected-invalidation case (not just genuine failures) — this is
        // the shared cursor for every campaign on the instance dying, silently or not,
        // and an operator needs to see it happened even if a reconnect follows.
        console.error('transport change stream terminated:', err);

        // Close the cursor before clearing references to release server-side resources.
        try { await cursor.close(); } catch { /* ignore */ }

        // Clear state so the next subscribe() can retry opening the stream.
        openPromise = null;
        sharedCursor = null;

        if (isInvalidated) {
          try {
            await openStream();
          } catch {
            // Fall through — stream stays closed; subscribers receive no further events.
          }
        }
        // Non-invalidation errors (network, transient): state is cleared above so the
        // next subscribe() call will reattempt openStream() automatically.
      }
    })();

    return cursor;
  })();

  openPromise = promise;
  // If connectToDatabase()/watch() itself throws (before the background iteration even
  // starts), clear openPromise so the next subscribe() retries instead of permanently
  // reusing this rejected promise.
  promise.catch(() => { if (openPromise === promise) openPromise = null; });

  return promise;
}

async function pollCampaigns(
  campaignId: string,
  handler: EventHandler,
  since: Date,
  db: Awaited<ReturnType<typeof getDatabase>>,
  sessionState: Map<string, string | null>
) {
  const docs = await db
    .collection('campaigns')
    .find({
      $or: [
        { id: campaignId, updatedAt: { $gt: since } },
        { campaignId, createdAt: { $gt: since } },
      ],
    })
    .toArray() as Array<Record<string, unknown>>;

  for (const doc of docs) {
    const docCampaignId = (doc['campaignId'] ?? doc['id']) as string | undefined;
    if (docCampaignId !== campaignId) continue;
    const { campaignId: _cid, id: _id, ...rest } = doc;
    handler({ type: 'change', campaignId, data: rest });

    // Polling subscribers aren't in `registry` (that's Atlas-only), so the session event
    // must be delivered directly to this poll's own handler rather than via emitToRegistry.
    // `sessionState` is private to this subscription (see shouldEmitSession's comment).
    const activeSessionId = (doc['activeSessionId'] ?? null) as string | null;
    if (shouldEmitSession(sessionState, campaignId, activeSessionId)) {
      handler({ type: 'session', campaignId, data: { activeSessionId } });
    }
  }
}

async function pollCollection<T extends { _id?: unknown }>(
  collectionName: string,
  campaignId: string,
  since: Date,
  db: Awaited<ReturnType<typeof getDatabase>>
): Promise<T[]> {
  const docs = await db
    .collection(collectionName)
    .find({ campaignId, createdAt: { $gt: since } })
    .toArray();
  return (docs as unknown as T[]).map(stripMongoId) as T[];
}

async function pollFn(
  campaignId: string,
  userId: string,
  handler: EventHandler,
  sinceRef: { value: number },
  sessionState: Map<string, string | null>
) {
  // Capture start time before querying so documents created during the query window are not skipped.
  const pollStart = Date.now();
  try {
    const db = await getDatabase();
    const since = new Date(sinceRef.value);

    await pollCampaigns(campaignId, handler, since, db, sessionState);

    const messages = await pollCollection<CampaignMessage>('campaignMessages', campaignId, since, db);
    const rolls = await pollCollection<CampaignRoll>('campaignRolls', campaignId, since, db);

    if (messages.length || rolls.length) {
      const members = await activeMembers(campaignId);
      const dispatch = (event: CampaignStreamEvent, canReceive: (userId: string) => boolean) => {
        if (canReceive(userId)) handler(event);
      };
      emitVisible(campaignId, 'message', messages, members, canSeeMessage, dispatch);
      emitVisible(campaignId, 'roll', rolls, members, canSeeRoll, dispatch);
    }

    sinceRef.value = pollStart;
  } catch (err) {
    console.error(`transport poll error (campaign=${campaignId}):`, err);
  }
}

export function emitFiltered(
  campaignId: string,
  event: CampaignStreamEvent,
  canReceive: (userId: string) => boolean
): void {
  emitToRegistry(campaignId, event, canReceive);
}

export async function subscribe(campaignId: string, userId: string, onEvent: EventHandler): Promise<() => void> {
  const atlasMode = await detectReplicaSet();

  if (atlasMode) {
    if (!registry.has(campaignId)) {
      registry.set(campaignId, new Map());
    }
    const subId = `${userId}:${++nextSubId}`;
    registry.get(campaignId)!.set(subId, { userId, handler: onEvent });
    subscriberCount++;

    const streamPromise = openStream();

    let torn = false;
    return () => {
      if (torn) return;
      torn = true;
      registry.get(campaignId)?.delete(subId);
      if (registry.get(campaignId)?.size === 0) {
        registry.delete(campaignId);
        lastKnownActiveSessionId.delete(campaignId);
      }
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0) {
        streamPromise.then(() => closeStream()).catch(() => closeStream());
      }
    };
  } else {
    const sinceRef = { value: Date.now() };
    // Private to this subscription — see shouldEmitSession's comment for why polling
    // can't share session-tracking state across subscriptions the way registry-backed
    // change-stream delivery can.
    const sessionState = new Map<string, string | null>();
    // Guards against overlapping poll cycles: pollFn now issues four sequential queries
    // (campaigns, messages, rolls, members) instead of one, so a slow DB round-trip can
    // take longer than the 2s interval. Without this guard, setInterval would start a
    // new pollFn call on top of one still in flight, doubling DB load and — because both
    // calls would compute an overlapping `since` window — redelivering the same events.
    let pollInFlight = false;
    const intervalId = setInterval(() => {
      if (pollInFlight) return;
      pollInFlight = true;
      pollFn(campaignId, userId, onEvent, sinceRef, sessionState).finally(() => { pollInFlight = false; });
    }, 2000);
    (intervalId as unknown as { unref?: () => void }).unref?.();

    let torn = false;
    return () => {
      if (torn) return;
      torn = true;
      clearInterval(intervalId);
    };
  }
}
