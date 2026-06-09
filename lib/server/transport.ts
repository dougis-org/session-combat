import type { ChangeStream } from 'mongodb';
import { connectToDatabase, getDatabase } from '@/lib/db';
import type { CampaignStreamEvent } from '@/lib/types';

type EventHandler = (event: CampaignStreamEvent) => void;

// Module-level singletons — process-scoped state (safe on Fly.io single-process)
let openPromise: Promise<ChangeStream> | null = null;
let sharedCursor: ChangeStream | null = null;
let subscriberCount = 0;
const registry = new Map<string, Set<EventHandler>>();
let isReplicaSet: boolean | null = null;

async function detectReplicaSet(): Promise<boolean> {
  if (isReplicaSet !== null) return isReplicaSet;
  try {
    const { db } = await connectToDatabase();
    await db.admin().command({ replSetGetStatus: 1 });
    isReplicaSet = true;
  } catch (err) {
    const isNotReplicaSetError =
      err instanceof Error && (
        err.message.includes('not running with --replSet') ||
        (err as { code?: number }).code === 76
      );
    if (isNotReplicaSetError) {
      isReplicaSet = false;
    } else {
      // Transient error (connection/auth issue) — fall back to polling this time
      // but don't cache so next subscribe retries detection
      return false;
    }
  }
  return isReplicaSet;
}

function demux(doc: { fullDocument?: { campaignId?: string } & Record<string, unknown> }) {
  const campaignId = doc.fullDocument?.campaignId;
  if (!campaignId) return;
  const handlers = registry.get(campaignId);
  if (!handlers) return;
  const event: CampaignStreamEvent = {
    type: 'heartbeat',
    campaignId,
    data: { ts: Date.now() },
  };
  for (const handler of handlers) {
    try { handler(event); } catch { /* handler errors don't break the stream */ }
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
    const cursor = client.watch([], { fullDocument: 'updateLookup' }) as ChangeStream;
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

        if (isInvalidated) {
          openPromise = null;
          sharedCursor = null;
          try {
            await openStream();
          } catch {
            // Fall through — stream stays closed; subscribers receive no further events.
          }
        }
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
      const event: CampaignStreamEvent = {
        type: 'heartbeat',
        campaignId,
        data: { ts: Date.now() },
      };
      handler(event);
    }

    sinceRef.value = Date.now();
  } catch (err) {
    console.error('transport poll error:', err);
  }
}

export async function subscribe(campaignId: string, onEvent: EventHandler): Promise<() => void> {
  const atlasMode = await detectReplicaSet();

  if (atlasMode) {
    if (!registry.has(campaignId)) {
      registry.set(campaignId, new Set());
    }
    registry.get(campaignId)!.add(onEvent);
    subscriberCount++;

    const streamPromise = openStream();

    let torn = false;
    return () => {
      if (torn) return;
      torn = true;
      registry.get(campaignId)?.delete(onEvent);
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
