import type { ChangeStream } from 'mongodb';
import { connectToDatabase, getDatabase } from '@/lib/db';
import type { CampaignStreamEvent } from '@/lib/types';

type EventHandler = (event: CampaignStreamEvent) => void;

interface Subscription {
  userId: string;
  handler: EventHandler;
}

// Module-level singletons — process-scoped state (safe on Fly.io single-process)
let openPromise: Promise<ChangeStream> | null = null;
let sharedCursor: ChangeStream | null = null;
let subscriberCount = 0;
// Keyed by a per-subscription token so the same user can hold multiple concurrent
// subscriptions (e.g. multiple browser tabs) without overwriting each other.
const registry = new Map<string, Map<string, Subscription>>();
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

function demux(doc: { fullDocument?: { campaignId?: string; id?: string } & Record<string, unknown> }) {
  const campaignId = doc.fullDocument?.campaignId ?? doc.fullDocument?.id;
  if (!campaignId) return;
  const handlers = registry.get(campaignId);
  if (!handlers) return;
  const { campaignId: _cid, id: _id, ...rest } = doc.fullDocument ?? {};
  const event: CampaignStreamEvent = {
    type: 'change',
    campaignId,
    data: rest,
  };
  for (const sub of handlers.values()) {
    try { sub.handler(event); } catch { /* handler errors don't break the stream */ }
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

async function openStream(): Promise<ChangeStream> {
  if (openPromise) return openPromise;
  openPromise = (async () => {
    const { client } = await connectToDatabase();
    const cursor = client.db().collection('campaigns').watch([], { fullDocument: 'updateLookup' }) as ChangeStream;
    sharedCursor = cursor;

    // Start async iteration in background
    (async () => {
      try {
        for await (const doc of cursor as AsyncIterable<{ fullDocument?: { campaignId?: string } & Record<string, unknown> }>) {
          demux(doc);
        }
      } catch (err) {
        const isInvalidated =
          err instanceof Error &&
          (err.name === 'ChangeStreamInvalidatedError' || err.message.includes('ChangeStreamInvalidated'));

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

  return openPromise;
}

async function pollFn(
  campaignId: string,
  handler: EventHandler,
  sinceRef: { value: number }
) {
  // Capture start time before querying so documents created during the query window are not skipped.
  const pollStart = Date.now();
  try {
    const db = await getDatabase();
    const since = new Date(sinceRef.value);
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
      const event: CampaignStreamEvent = {
        type: 'change',
        campaignId,
        data: rest,
      };
      handler(event);
    }

    sinceRef.value = pollStart;
  } catch (err) {
    console.error('transport poll error:', err);
  }
}

export function emitFiltered(
  campaignId: string,
  event: CampaignStreamEvent,
  canReceive: (userId: string) => boolean
): void {
  const handlers = registry.get(campaignId);
  if (!handlers) return;
  for (const sub of handlers.values()) {
    if (canReceive(sub.userId)) {
      try { sub.handler(event); } catch { /* handler errors don't break dispatch */ }
    }
  }
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
      if (registry.get(campaignId)?.size === 0) registry.delete(campaignId);
      subscriberCount = Math.max(0, subscriberCount - 1);
      if (subscriberCount === 0) {
        streamPromise.then(() => closeStream()).catch(() => closeStream());
      }
    };
  } else {
    const sinceRef = { value: Date.now() };
    const intervalId = setInterval(() => pollFn(campaignId, onEvent, sinceRef), 2000);
    (intervalId as unknown as { unref?: () => void }).unref?.();

    let torn = false;
    return () => {
      if (torn) return;
      torn = true;
      clearInterval(intervalId);
    };
  }
}
