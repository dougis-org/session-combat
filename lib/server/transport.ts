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
  } catch {
    isReplicaSet = false;
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
    handler(event);
  }
}

async function closeStream() {
  if (sharedCursor) {
    await sharedCursor.close();
  }
  sharedCursor = null;
  openPromise = null;
}

async function openStream(): Promise<ChangeStream> {
  if (openPromise) return openPromise;
  openPromise = (async () => {
    const { client } = await connectToDatabase();
    const cursor = client.watch([]) as ChangeStream;
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
          // One reconnect attempt
          openPromise = null;
          sharedCursor = null;
          try {
            await openStream();
          } catch {
            // Fall through — stream stays closed; polling not activated here since
            // replica-set was already confirmed. Subscribers receive no further events.
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
      .find({ campaignId, createdAt: { $gt: since } })
      .toArray() as Array<Record<string, unknown>>;

    for (const doc of docs) {
      if (doc['campaignId'] !== campaignId) continue;
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
    // Register handler
    if (!registry.has(campaignId)) {
      registry.set(campaignId, new Set());
    }
    registry.get(campaignId)!.add(onEvent);
    subscriberCount++;

    // Lazy open — concurrent calls share the same promise
    const streamPromise = openStream();

    return () => {
      registry.get(campaignId)?.delete(onEvent);
      subscriberCount--;
      if (subscriberCount <= 0) {
        subscriberCount = 0;
        // Close after the stream resolves (handles in-flight case)
        streamPromise.then(() => closeStream()).catch(() => closeStream());
      }
    };
  } else {
    // Polling path
    const sinceRef = { value: Date.now() };
    const intervalId = setInterval(() => pollFn(campaignId, onEvent, sinceRef), 2000);
    (intervalId as unknown as { unref?: () => void }).unref?.();

    return () => {
      clearInterval(intervalId);
    };
  }
}
