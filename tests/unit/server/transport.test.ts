import type { CampaignMember } from '@/lib/types';

// --- Mock infrastructure ---

let mockWatch: jest.Mock;
let mockCursorClose: jest.Mock;
let mockToArray: jest.Mock; // campaigns collection
let mockMessagesToArray: jest.Mock;
let mockRollsToArray: jest.Mock;
let mockGetDatabase: jest.Mock;
let mockListMembers: jest.Mock;

async function* makeCursorIterator(this: { pendingEvents?: Array<unknown>; shouldInvalidate?: boolean }) {
  // hang (stream stays open — tests override watch to return custom cursors)
  await new Promise(() => {});
}

// Returns a cursor stub used for the detection probe (closed immediately).
function makeProbeCursor() {
  return { close: jest.fn().mockResolvedValue(undefined) };
}

// Returns a full cursor stub used for the real change stream.
function makeStreamCursor() {
  return { close: mockCursorClose, [Symbol.asyncIterator]: makeCursorIterator };
}

// A cursor whose async iterator can be fed documents on demand via push(), simulating
// a live MongoDB change-stream cursor that independently observes writes made by any process.
function createPushableCursor() {
  const queue: unknown[] = [];
  let resolveNext: ((v: IteratorResult<unknown>) => void) | null = null;
  const close = jest.fn().mockResolvedValue(undefined);
  return {
    push(doc: unknown) {
      if (resolveNext) {
        const r = resolveNext;
        resolveNext = null;
        r({ value: doc, done: false });
      } else {
        queue.push(doc);
      }
    },
    cursor: {
      close,
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<unknown>> {
            if (queue.length > 0) {
              return Promise.resolve({ value: queue.shift(), done: false });
            }
            return new Promise<IteratorResult<unknown>>(resolve => { resolveNext = resolve; });
          },
        };
      },
    },
  };
}

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(async () => ({
    client: {
      db: () => ({
        watch: (...args: unknown[]) => mockWatch(...args),
        collection: () => ({
          watch: (...args: unknown[]) => mockWatch(...args),
        }),
      }),
    },
  })),
  getDatabase: jest.fn((...args: unknown[]) => mockGetDatabase(...args)),
}));

jest.mock('@/lib/storage', () => ({
  storage: {
    listMembersForCampaign: (...args: unknown[]) => mockListMembers(...args),
  },
}));

function resetMocks() {
  mockCursorClose = jest.fn().mockResolvedValue(undefined);
  mockToArray = jest.fn().mockResolvedValue([]);
  mockMessagesToArray = jest.fn().mockResolvedValue([]);
  mockRollsToArray = jest.fn().mockResolvedValue([]);
  mockListMembers = jest.fn().mockResolvedValue([]);
  mockGetDatabase = jest.fn(async () => ({
    collection: (name: string) => ({
      find: (...args: unknown[]) => ({
        toArray: () => {
          if (name === 'campaignMessages') return mockMessagesToArray(...args);
          if (name === 'campaignRolls') return mockRollsToArray(...args);
          return mockToArray(...args);
        },
      }),
    }),
  }));
  // First call is the detection probe (closed immediately), subsequent calls are real cursors.
  mockWatch = jest.fn()
    .mockImplementationOnce(() => makeProbeCursor())
    .mockImplementation(() => makeStreamCursor());
}

// Poll cycles now chain several sequential awaits (campaigns + messages + rolls + members
// lookup); flush enough microtask ticks for fake timers to settle fully.
async function flushMicrotasks(times = 10) {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

function member(userId: string, role: 'dm' | 'player' = 'player'): CampaignMember {
  return {
    id: `m-${userId}`,
    campaignId: 'camp-1',
    userId,
    role,
    status: 'active',
    history: [],
  };
}

// Reload transport module before each test to reset module-level singletons.
let transport: typeof import('@/lib/server/transport');

beforeEach(async () => {
  resetMocks();
  jest.resetModules();
  transport = await import('@/lib/server/transport');
});

afterEach(() => {
  jest.useRealTimers();
});

// --- T3-1: First subscribe (Atlas) opens exactly one cursor ---

it('T3-1: first subscribe opens exactly one cursor', async () => {
  const teardown = await transport.subscribe('c1', 'user-c1', jest.fn());
  await new Promise(r => setTimeout(r, 10));
  // watch called twice: once for probe (detection), once for real stream
  expect(mockWatch).toHaveBeenCalledTimes(2);
  teardown();
});

// --- T3-2: Second subscribe reuses existing cursor ---

it('T3-2: second subscribe reuses cursor (watch call count stays 2)', async () => {
  const td1 = await transport.subscribe('c1', 'user-c1', jest.fn());
  const td2 = await transport.subscribe('c2', 'user-c2', jest.fn());
  await new Promise(r => setTimeout(r, 10));
  // probe (1) + real stream (1) = 2; second subscribe reuses openPromise
  expect(mockWatch).toHaveBeenCalledTimes(2);
  td1();
  td2();
});

// --- T3-3: Concurrent subscribes during lazy open result in one cursor ---

it('T3-3: concurrent subscribes during lazy open result in one cursor', async () => {
  const p1 = transport.subscribe('c1', 'user-c1', jest.fn());
  const p2 = transport.subscribe('c2', 'user-c2', jest.fn());

  const [td1, td2] = await Promise.all([p1, p2]);
  await new Promise(r => setTimeout(r, 10));

  // detectReplicaSet is deduped — one probe call; openStream is deduped — one real cursor call
  expect(mockWatch).toHaveBeenCalledTimes(2);
  td1();
  td2();
});

// --- T3-4: Teardown removes handler from registry ---

it('T3-4: teardown removes handler from registry', async () => {
  const handler = jest.fn();

  // Make the cursor yield one event then hang
  async function* yieldThenHang() {
    yield { fullDocument: { campaignId: 'c1' } };
    await new Promise(() => {});
  }
  const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldThenHang };
  mockWatch = jest.fn()
    .mockImplementationOnce(() => makeProbeCursor())
    .mockImplementationOnce(() => realCursor);

  const teardown = await transport.subscribe('c1', 'user-c1', handler);
  // Tear down before the event is processed
  teardown();

  // Allow iteration to run — event should NOT reach the removed handler
  await new Promise(r => setTimeout(r, 30));
  expect(handler).not.toHaveBeenCalled();
});

// --- T3-5: Last subscriber teardown closes cursor ---

it('T3-5: last subscriber teardown closes cursor', async () => {
  const td = await transport.subscribe('c1', 'user-c1', jest.fn());
  await new Promise(r => setTimeout(r, 10)); // let openStream settle
  td();
  await new Promise(r => setTimeout(r, 10));
  expect(mockCursorClose).toHaveBeenCalledTimes(1);
});

// --- T3-6: Last subscriber drops while open is in flight ---

it('T3-6: last subscriber drops while open is in flight', async () => {
  const teardown = await transport.subscribe('c1', 'user-c1', jest.fn());
  teardown(); // fires while openStream may still be in-flight
  await new Promise(r => setTimeout(r, 20));
  // Cursor should be closed via the streamPromise.then(() => closeStream()) chain
  expect(mockCursorClose).toHaveBeenCalledTimes(1);
});

// --- T3-7: Change stream event routes to correct campaign handlers only ---

it('T3-7: event with campaignId A routes only to A handlers', async () => {
  const handlerA = jest.fn();
  const handlerB = jest.fn();

  // Make the real cursor yield one event for campaign A then hang
  async function* yieldOnce() {
    yield { fullDocument: { campaignId: 'A', type: 'heartbeat' } };
    await new Promise(() => {}); // hang
  }
  const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
  mockWatch = jest.fn()
    .mockImplementationOnce(() => makeProbeCursor())
    .mockImplementationOnce(() => realCursor);

  const tdA = await transport.subscribe('A', 'user-A', handlerA);
  const tdB = await transport.subscribe('B', 'user-B', handlerB);

  // Allow async iteration loop to process the event
  await new Promise(r => setTimeout(r, 30));

  expect(handlerA).toHaveBeenCalledTimes(1);
  expect(handlerB).not.toHaveBeenCalled();
  tdA();
  tdB();
});

// --- T3-8: Non-replica-set detection selects polling path ---

it('T3-8: non-replica-set detection selects polling path', async () => {
  jest.useFakeTimers();
  // Make the probe throw with a non-replica-set error
  mockWatch = jest.fn().mockImplementationOnce(() => {
    throw new Error('not running with --replSet');
  });

  const teardown = await transport.subscribe('c1', 'user-c1', jest.fn());

  // Only the probe was called, not the real stream watch
  expect(mockWatch).toHaveBeenCalledTimes(1);
  teardown();
});

// --- T3-9: Detection result is cached across subscribes ---

it('T3-9: replica-set detection is called only once across two subscribes', async () => {
  const td1 = await transport.subscribe('c1', 'user-c1', jest.fn());
  const td2 = await transport.subscribe('c2', 'user-c2', jest.fn());
  await new Promise(r => setTimeout(r, 10));

  // probe called once (detection is cached after first subscribe), stream cursor called once
  expect(mockWatch).toHaveBeenCalledTimes(2);
  td1();
  td2();
});

// --- T3-10: Polling emits events since last timestamp ---

it('T3-10: polling emits new events since last timestamp', async () => {
  jest.useFakeTimers();
  mockWatch = jest.fn().mockImplementationOnce(() => {
    throw new Error('not running with --replSet');
  });

  const now = Date.now();
  jest.setSystemTime(now);

  const doc = { campaignId: 'c1', type: 'heartbeat', createdAt: new Date(now + 1000) };
  mockToArray = jest.fn().mockResolvedValue([doc]);

  const handler = jest.fn();
  const teardown = await transport.subscribe('c1', 'user-c1', handler);

  // Trigger poll
  jest.advanceTimersByTime(2001);
  // Flush: getDatabase() → toArray() resolution → handler call
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  teardown();

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'change', campaignId: 'c1' })
  );
});

// --- T3-11: Polling skips documents for other campaigns ---

it('T3-11: polling skips documents for other campaigns', async () => {
  jest.useFakeTimers();
  mockWatch = jest.fn().mockImplementationOnce(() => {
    throw new Error('not running with --replSet');
  });

  const doc = { campaignId: 'B', type: 'heartbeat', createdAt: new Date() };
  mockToArray = jest.fn().mockResolvedValue([doc]);

  const handler = jest.fn();
  const teardown = await transport.subscribe('A', 'user-A', handler);

  jest.advanceTimersByTime(2001);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  teardown();

  expect(handler).not.toHaveBeenCalled();
});

// --- T3-12: Polling teardown clears interval ---

it('T3-12: polling teardown clears interval', async () => {
  jest.useFakeTimers();
  mockWatch = jest.fn().mockImplementationOnce(() => {
    throw new Error('not running with --replSet');
  });
  const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

  const teardown = await transport.subscribe('c1', 'user-c1', jest.fn());
  teardown();

  expect(clearIntervalSpy).toHaveBeenCalled();
  clearIntervalSpy.mockRestore();
});

// --- T3-13: Cursor invalidation triggers one reconnect attempt ---

it('T3-13: cursor invalidation triggers one reconnect attempt', async () => {
  const closeFn = jest.fn().mockResolvedValue(undefined);
  let streamCallCount = 0;

  mockWatch = jest.fn().mockImplementation((_, opts: Record<string, unknown> | undefined) => {
    // Probe call (detection): options include maxAwaitTimeMS
    if (opts && 'maxAwaitTimeMS' in opts) {
      return { close: jest.fn().mockResolvedValue(undefined) };
    }
    // Real stream call
    const currentCall = ++streamCallCount;
    async function* cursorIter() {
      if (currentCall === 1) {
        throw Object.assign(new Error('ChangeStreamInvalidated'), {
          name: 'ChangeStreamInvalidatedError',
        });
      }
      await new Promise(() => {}); // second cursor hangs open
    }
    return { close: closeFn, [Symbol.asyncIterator]: cursorIter };
  });

  const td = await transport.subscribe('c1', 'user-c1', jest.fn());
  // Allow iteration to run (throws on first cursor) and reconnect
  await new Promise(r => setTimeout(r, 50));

  // probe (1) + first real stream that invalidates (1) + reconnect stream (1) = 3
  expect(mockWatch).toHaveBeenCalledTimes(3);
  td();
});

// --- T3-14: Poll DB error is caught, interval continues ---

it('T3-14: poll DB error is caught and logged; interval continues', async () => {
  jest.useFakeTimers();
  mockWatch = jest.fn().mockImplementationOnce(() => {
    throw new Error('not running with --replSet');
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  // First poll: DB throws
  mockGetDatabase = jest.fn()
    .mockRejectedValueOnce(new Error('DB unavailable'))
    .mockResolvedValue({
      collection: () => ({
        find: (...args: unknown[]) => ({ toArray: () => mockToArray(...args) }),
      }),
    });

  const handler = jest.fn();
  const teardown = await transport.subscribe('c1', 'user-c1', handler);

  // First poll fires: should log error
  jest.advanceTimersByTime(2001);
  await Promise.resolve();
  await Promise.resolve();

  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('poll'), expect.any(Error));

  // Second poll fires: no crash, handler not called (mockToArray returns [])
  jest.advanceTimersByTime(2001);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  teardown();
  consoleSpy.mockRestore();
});

// ============================================================================
// T2 — Broaden the Atlas change-stream path (db-level watch, ns.coll routing)
// ============================================================================

describe('T2 — db-level watch and collection routing', () => {
  it('opens a single database-level watch cursor (not one per collection)', async () => {
    const teardown = await transport.subscribe('c1', 'user-c1', jest.fn());
    await new Promise(r => setTimeout(r, 10));
    // Same call-count contract as before: probe (1) + single shared real cursor (1) = 2.
    expect(mockWatch).toHaveBeenCalledTimes(2);
    teardown();
  });

  it('a change document from an unrelated collection is ignored (db-level watch is unfiltered at the Mongo level)', async () => {
    // Documents from a collection outside {campaigns, campaignMessages, campaignRolls}
    // must never be broadcast as a `change` event, even if they happen to carry an
    // `id`/`campaignId` field matching a subscribed campaign — otherwise a db-level
    // watch() (which observes every collection) would leak unrelated document data.
    async function* yieldOnce() {
      yield { ns: { coll: 'users' }, fullDocument: { id: 'A', email: 'someone@example.com' } };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handler = jest.fn();
    const td = await transport.subscribe('A', 'user-A', handler);
    await new Promise(r => setTimeout(r, 30));

    expect(handler).not.toHaveBeenCalled();
    td();
  });

  it('a campaignRolls change document is routed as a roll event to the right campaign', async () => {
    mockListMembers = jest.fn().mockResolvedValue([member('player-1')]);
    const rollDoc = {
      id: 'roll-1', campaignId: 'A', rollerId: 'player-1', rollerName: 'P1',
      formula: '1d20', rolls: [15], total: 15, visibility: { scope: 'group' }, createdAt: new Date(),
    };

    async function* yieldOnce() {
      yield { ns: { coll: 'campaignRolls' }, fullDocument: rollDoc };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handlerA = jest.fn();
    const handlerB = jest.fn();
    const tdA = await transport.subscribe('A', 'player-1', handlerA);
    const tdB = await transport.subscribe('B', 'player-1', handlerB);

    await new Promise(r => setTimeout(r, 30));

    expect(handlerA).toHaveBeenCalledWith(expect.objectContaining({ type: 'roll', campaignId: 'A', data: rollDoc }));
    expect(handlerB).not.toHaveBeenCalled();
    tdA(); tdB();
  });

  it('a campaignMessages change document is routed as a message event', async () => {
    mockListMembers = jest.fn().mockResolvedValue([member('player-1')]);
    const msgDoc = {
      id: 'msg-1', campaignId: 'A', senderId: 'player-1', senderName: 'P1',
      text: 'hi', visibility: { scope: 'group' }, createdAt: new Date(),
    };

    async function* yieldOnce() {
      yield { ns: { coll: 'campaignMessages' }, fullDocument: msgDoc };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handler = jest.fn();
    const td = await transport.subscribe('A', 'player-1', handler);
    await new Promise(r => setTimeout(r, 30));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'message', campaignId: 'A', data: msgDoc }));
    td();
  });

  describe('two-instance simulation (Atlas / change-stream)', () => {
    it('registry maps are independent across two isolated transport module instances', () => {
      let transportA: typeof import('@/lib/server/transport');
      let transportB: typeof import('@/lib/server/transport');
      jest.isolateModules(() => {
        transportA = require('@/lib/server/transport');
      });
      jest.isolateModules(() => {
        transportB = require('@/lib/server/transport');
      });
      expect(transportA!).not.toBe(transportB!);
    });

    it('session event written "by instance A" is delivered to instance B\'s subscriber without A calling B directly', async () => {
      const cursors: ReturnType<typeof createPushableCursor>[] = [];
      mockWatch = jest.fn().mockImplementation((_arg: unknown, opts: Record<string, unknown> | undefined) => {
        if (opts && 'maxAwaitTimeMS' in opts) return makeProbeCursor();
        const c = createPushableCursor();
        cursors.push(c);
        return c.cursor;
      });

      let transportA: typeof import('@/lib/server/transport');
      let transportB: typeof import('@/lib/server/transport');
      jest.isolateModules(() => { transportA = require('@/lib/server/transport'); });
      jest.isolateModules(() => { transportB = require('@/lib/server/transport'); });

      const handlerB = jest.fn();
      await transportA!.subscribe('camp-1', 'dm-1', jest.fn());
      await transportB!.subscribe('camp-1', 'player-1', handlerB);
      await new Promise(r => setTimeout(r, 10));

      expect(cursors.length).toBe(2); // one shared cursor per instance

      // Instance A's write is observed independently by both cursors (simulating a
      // real shared MongoDB change stream), not routed through transportB directly.
      const writeDoc = {
        ns: { coll: 'campaigns' },
        fullDocument: { id: 'camp-1', activeSessionId: 'session-9' },
        updateDescription: { updatedFields: { activeSessionId: 'session-9' } },
      };
      cursors.forEach(c => c.push(writeDoc));
      await new Promise(r => setTimeout(r, 20));

      expect(handlerB).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-9' } });
    });

    it('roll insert "by instance A" is delivered to instance B\'s subscriber', async () => {
      mockListMembers = jest.fn().mockResolvedValue([member('player-1')]);
      const cursors: ReturnType<typeof createPushableCursor>[] = [];
      mockWatch = jest.fn().mockImplementation((_arg: unknown, opts: Record<string, unknown> | undefined) => {
        if (opts && 'maxAwaitTimeMS' in opts) return makeProbeCursor();
        const c = createPushableCursor();
        cursors.push(c);
        return c.cursor;
      });

      let transportA: typeof import('@/lib/server/transport');
      let transportB: typeof import('@/lib/server/transport');
      jest.isolateModules(() => { transportA = require('@/lib/server/transport'); });
      jest.isolateModules(() => { transportB = require('@/lib/server/transport'); });

      const handlerB = jest.fn();
      await transportA!.subscribe('camp-1', 'dm-1', jest.fn());
      await transportB!.subscribe('camp-1', 'player-1', handlerB);
      await new Promise(r => setTimeout(r, 10));

      const rollDoc = {
        id: 'roll-9', campaignId: 'camp-1', rollerId: 'dm-1', rollerName: 'DM',
        formula: '1d20', rolls: [12], total: 12, visibility: { scope: 'group' }, createdAt: new Date(),
      };
      cursors.forEach(c => c.push({ ns: { coll: 'campaignRolls' }, fullDocument: rollDoc }));
      await new Promise(r => setTimeout(r, 20));

      expect(handlerB).toHaveBeenCalledWith(expect.objectContaining({ type: 'roll', campaignId: 'camp-1', data: rollDoc }));
    });

    it('message insert "by instance A" is delivered to instance B\'s subscriber', async () => {
      mockListMembers = jest.fn().mockResolvedValue([member('player-1')]);
      const cursors: ReturnType<typeof createPushableCursor>[] = [];
      mockWatch = jest.fn().mockImplementation((_arg: unknown, opts: Record<string, unknown> | undefined) => {
        if (opts && 'maxAwaitTimeMS' in opts) return makeProbeCursor();
        const c = createPushableCursor();
        cursors.push(c);
        return c.cursor;
      });

      let transportA: typeof import('@/lib/server/transport');
      let transportB: typeof import('@/lib/server/transport');
      jest.isolateModules(() => { transportA = require('@/lib/server/transport'); });
      jest.isolateModules(() => { transportB = require('@/lib/server/transport'); });

      const handlerB = jest.fn();
      await transportA!.subscribe('camp-1', 'dm-1', jest.fn());
      await transportB!.subscribe('camp-1', 'player-1', handlerB);
      await new Promise(r => setTimeout(r, 10));

      const msgDoc = {
        id: 'msg-9', campaignId: 'camp-1', senderId: 'dm-1', senderName: 'DM',
        text: 'hello from A', visibility: { scope: 'group' }, createdAt: new Date(),
      };
      cursors.forEach(c => c.push({ ns: { coll: 'campaignMessages' }, fullDocument: msgDoc }));
      await new Promise(r => setTimeout(r, 20));

      expect(handlerB).toHaveBeenCalledWith(expect.objectContaining({ type: 'message', campaignId: 'camp-1', data: msgDoc }));
    });
  });
});

// ============================================================================
// T3 — Broaden the polling path
// ============================================================================

describe('T3 — polling observes messages and rolls', () => {
  it('polling subscriber receives a message event for a new campaignMessages doc', async () => {
    jest.useFakeTimers();
    mockWatch = jest.fn().mockImplementationOnce(() => {
      throw new Error('not running with --replSet');
    });
    mockListMembers = jest.fn().mockResolvedValue([member('user-c1')]);

    const now = Date.now();
    jest.setSystemTime(now);
    const msgDoc = {
      id: 'msg-1', campaignId: 'c1', senderId: 'user-c1', senderName: 'U1',
      text: 'hi', visibility: { scope: 'group' }, createdAt: new Date(now + 1000),
    };
    mockMessagesToArray = jest.fn().mockResolvedValue([msgDoc]);

    const handler = jest.fn();
    const teardown = await transport.subscribe('c1', 'user-c1', handler);

    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    teardown();

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'message', campaignId: 'c1', data: msgDoc }));
  });

  it('polling subscriber receives a roll event for a new campaignRolls doc', async () => {
    jest.useFakeTimers();
    mockWatch = jest.fn().mockImplementationOnce(() => {
      throw new Error('not running with --replSet');
    });
    mockListMembers = jest.fn().mockResolvedValue([member('user-c1')]);

    const now = Date.now();
    jest.setSystemTime(now);
    const rollDoc = {
      id: 'roll-1', campaignId: 'c1', rollerId: 'user-c1', rollerName: 'U1',
      formula: '1d20', rolls: [7], total: 7, visibility: { scope: 'group' }, createdAt: new Date(now + 1000),
    };
    mockRollsToArray = jest.fn().mockResolvedValue([rollDoc]);

    const handler = jest.fn();
    const teardown = await transport.subscribe('c1', 'user-c1', handler);

    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    teardown();

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'roll', campaignId: 'c1', data: rollDoc }));
  });

  it('two-instance polling: a write "by instance A" is observed by instance B\'s next poll cycle', async () => {
    jest.useFakeTimers();
    mockWatch = jest.fn().mockImplementation(() => {
      throw new Error('not running with --replSet');
    });
    mockListMembers = jest.fn().mockResolvedValue([member('player-1')]);

    const now = Date.now();
    jest.setSystemTime(now);

    let transportA: typeof import('@/lib/server/transport');
    let transportB: typeof import('@/lib/server/transport');
    jest.isolateModules(() => { transportA = require('@/lib/server/transport'); });
    jest.isolateModules(() => { transportB = require('@/lib/server/transport'); });

    const handlerB = jest.fn();
    await transportA!.subscribe('camp-1', 'dm-1', jest.fn());
    const teardownB = await transportB!.subscribe('camp-1', 'player-1', handlerB);

    // Simulate "instance A wrote a roll" by making it show up in the shared underlying store
    // that both instances' polls query against.
    const rollDoc = {
      id: 'roll-shared', campaignId: 'camp-1', rollerId: 'dm-1', rollerName: 'DM',
      formula: '1d20', rolls: [3], total: 3, visibility: { scope: 'group' }, createdAt: new Date(now + 500),
    };
    mockRollsToArray = jest.fn().mockResolvedValue([rollDoc]);

    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    teardownB();

    expect(handlerB).toHaveBeenCalledWith(expect.objectContaining({ type: 'roll', campaignId: 'camp-1', data: rollDoc }));
  });
});

// ============================================================================
// T4 — Session event derivation from activeSessionId
// ============================================================================

describe('T4 — session event derivation', () => {
  it('change-stream: unrelated field change does not emit a spurious session event', async () => {
    async function* yieldTwice() {
      yield {
        ns: { coll: 'campaigns' },
        fullDocument: { id: 'camp-1', activeSessionId: 'session-1' },
        updateDescription: { updatedFields: { activeSessionId: 'session-1' } },
      };
      yield {
        ns: { coll: 'campaigns' },
        fullDocument: { id: 'camp-1', activeSessionId: 'session-1', name: 'renamed' },
        updateDescription: { updatedFields: { name: 'renamed' } },
      };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldTwice };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handler = jest.fn();
    const td = await transport.subscribe('camp-1', 'user-1', handler);
    await new Promise(r => setTimeout(r, 30));

    const sessionCalls = handler.mock.calls.filter(([e]) => e.type === 'session');
    expect(sessionCalls).toHaveLength(1); // only the first (seeding) write emits
    td();
  });

  it('change-stream: activeSessionId change emits a session event', async () => {
    async function* yieldOnce() {
      yield {
        ns: { coll: 'campaigns' },
        fullDocument: { id: 'camp-1', activeSessionId: 'session-2' },
        updateDescription: { updatedFields: { activeSessionId: 'session-2' } },
      };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handler = jest.fn();
    const td = await transport.subscribe('camp-1', 'user-1', handler);
    await new Promise(r => setTimeout(r, 30));

    expect(handler).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-2' } });
    td();
  });

  it('polling: activeSessionId change emits a session event', async () => {
    jest.useFakeTimers();
    mockWatch = jest.fn().mockImplementationOnce(() => {
      throw new Error('not running with --replSet');
    });

    const now = Date.now();
    jest.setSystemTime(now);
    mockToArray = jest.fn().mockResolvedValue([
      { id: 'camp-1', activeSessionId: 'session-2', updatedAt: new Date(now + 1000) },
    ]);

    const handler = jest.fn();
    const teardown = await transport.subscribe('camp-1', 'user-1', handler);

    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    teardown();

    expect(handler).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-2' } });
  });

  it('per-campaign session state is cleaned up when the last subscriber tears down', async () => {
    async function* yieldOnce() {
      yield {
        ns: { coll: 'campaigns' },
        fullDocument: { id: 'camp-1', activeSessionId: 'session-1' },
        updateDescription: { updatedFields: { activeSessionId: 'session-1' } },
      };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handler1 = jest.fn();
    const td1 = await transport.subscribe('camp-1', 'user-1', handler1);
    await new Promise(r => setTimeout(r, 20));
    expect(handler1).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-1' } });
    td1(); // last subscriber for camp-1 tears down — state should be cleared

    // Re-subscribe: a fresh cursor observing the SAME activeSessionId should emit again,
    // proving no stale "already-seen" state leaked across the subscription lifecycle.
    async function* yieldOnceAgain() {
      yield {
        ns: { coll: 'campaigns' },
        fullDocument: { id: 'camp-1', activeSessionId: 'session-1' },
        updateDescription: { updatedFields: { activeSessionId: 'session-1' } },
      };
      await new Promise(() => {});
    }
    const realCursor2 = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnceAgain };
    mockWatch = jest.fn().mockImplementationOnce(() => realCursor2);

    const handler2 = jest.fn();
    const td2 = await transport.subscribe('camp-1', 'user-2', handler2);
    await new Promise(r => setTimeout(r, 20));
    expect(handler2).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-1' } });
    td2();
  });

  it('polling: two independent subscribers to the same campaign each receive the session event (no shared-state suppression)', async () => {
    // Regression: session-derivation state must be tracked per-subscription in polling
    // mode, not shared per-campaignId — otherwise whichever subscription's poll cycle
    // happens to run first "consumes" the transition and the other subscriber's poll,
    // observing the identical document, would incorrectly see no change and never emit.
    jest.useFakeTimers();
    mockWatch = jest.fn().mockImplementation(() => {
      throw new Error('not running with --replSet');
    });

    const now = Date.now();
    jest.setSystemTime(now);
    mockToArray = jest.fn().mockResolvedValue([
      { id: 'camp-1', activeSessionId: 'session-1', updatedAt: new Date(now + 1000) },
    ]);

    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const teardown1 = await transport.subscribe('camp-1', 'user-1', handler1);
    const teardown2 = await transport.subscribe('camp-1', 'user-2', handler2);

    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    expect(handler1).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-1' } });
    expect(handler2).toHaveBeenCalledWith({ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-1' } });

    // Non-terminal teardown: one of two subscribers for camp-1 disconnects. The
    // surviving subscriber's poll cycle should keep running unaffected.
    teardown1();

    handler2.mockClear();
    // Same activeSessionId observed again — no new session event for the surviving
    // subscriber, since its own per-subscription state already recorded 'session-1'.
    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    const sessionCalls = handler2.mock.calls.filter(([e]) => e.type === 'session');
    expect(sessionCalls).toHaveLength(0);

    teardown2();
  });
});

// ============================================================================
// T5 — Visibility replication in the Mongo-observed path
// ============================================================================

describe('T5 — visibility enforcement in change-stream/poll delivery', () => {
  it('change-stream: dm-only roll is withheld from a non-DM subscriber', async () => {
    mockListMembers = jest.fn().mockResolvedValue([member('player-1', 'player'), member('dm-1', 'dm')]);
    const rollDoc = {
      id: 'roll-dm', campaignId: 'camp-1', rollerId: 'dm-1', rollerName: 'DM',
      formula: '1d20', rolls: [1], total: 1, visibility: { scope: 'dm-only' }, createdAt: new Date(),
    };
    async function* yieldOnce() {
      yield { ns: { coll: 'campaignRolls' }, fullDocument: rollDoc };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handlerPlayer = jest.fn();
    const handlerDm = jest.fn();
    const td1 = await transport.subscribe('camp-1', 'player-1', handlerPlayer);
    const td2 = await transport.subscribe('camp-1', 'dm-1', handlerDm);
    await new Promise(r => setTimeout(r, 30));

    expect(handlerPlayer).not.toHaveBeenCalled();
    expect(handlerDm).toHaveBeenCalledWith(expect.objectContaining({ type: 'roll', data: rollDoc }));
    td1(); td2();
  });

  it('change-stream: dm-only message is withheld from a non-DM subscriber unless addressed to them', async () => {
    mockListMembers = jest.fn().mockResolvedValue([member('player-1', 'player'), member('dm-1', 'dm')]);
    const msgDoc = {
      id: 'msg-dm', campaignId: 'camp-1', senderId: 'dm-1', senderName: 'DM',
      text: 'secret', visibility: { scope: 'dm-only' }, createdAt: new Date(),
    };
    async function* yieldOnce() {
      yield { ns: { coll: 'campaignMessages' }, fullDocument: msgDoc };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const handlerPlayer = jest.fn();
    const handlerDm = jest.fn();
    const td1 = await transport.subscribe('camp-1', 'player-1', handlerPlayer);
    const td2 = await transport.subscribe('camp-1', 'dm-1', handlerDm);
    await new Promise(r => setTimeout(r, 30));

    expect(handlerPlayer).not.toHaveBeenCalled();
    expect(handlerDm).toHaveBeenCalledWith(expect.objectContaining({ type: 'message', data: msgDoc }));
    td1(); td2();
  });

  it('polling: dm-only roll is withheld from a non-DM subscriber', async () => {
    jest.useFakeTimers();
    mockWatch = jest.fn().mockImplementation(() => {
      throw new Error('not running with --replSet');
    });
    mockListMembers = jest.fn().mockResolvedValue([member('player-1', 'player')]);

    const now = Date.now();
    jest.setSystemTime(now);
    const rollDoc = {
      id: 'roll-dm', campaignId: 'camp-1', rollerId: 'dm-1', rollerName: 'DM',
      formula: '1d20', rolls: [1], total: 1, visibility: { scope: 'dm-only' }, createdAt: new Date(now + 1000),
    };
    mockRollsToArray = jest.fn().mockResolvedValue([rollDoc]);

    const handler = jest.fn();
    const teardown = await transport.subscribe('camp-1', 'player-1', handler);

    jest.advanceTimersByTime(2001);
    await flushMicrotasks();

    teardown();

    expect(handler).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'roll' }));
  });

  it('listMembersForCampaign is memoized per change/poll batch when filtering multiple subscribers', async () => {
    mockListMembers = jest.fn().mockResolvedValue([member('player-1'), member('player-2')]);
    const rollDoc = {
      id: 'roll-batch', campaignId: 'camp-1', rollerId: 'player-1', rollerName: 'P1',
      formula: '1d20', rolls: [5], total: 5, visibility: { scope: 'group' }, createdAt: new Date(),
    };
    async function* yieldOnce() {
      yield { ns: { coll: 'campaignRolls' }, fullDocument: rollDoc };
      await new Promise(() => {});
    }
    const realCursor = { close: jest.fn().mockResolvedValue(undefined), [Symbol.asyncIterator]: yieldOnce };
    mockWatch = jest.fn()
      .mockImplementationOnce(() => makeProbeCursor())
      .mockImplementationOnce(() => realCursor);

    const td1 = await transport.subscribe('camp-1', 'player-1', jest.fn());
    const td2 = await transport.subscribe('camp-1', 'player-2', jest.fn());
    await new Promise(r => setTimeout(r, 30));

    expect(mockListMembers).toHaveBeenCalledTimes(1);
    td1(); td2();
  });
});

// ============================================================================
// T6 — Same-instance fast path preserved
// ============================================================================

describe('T6 — fast path', () => {
  it('emitFiltered invokes the same-instance subscriber synchronously', async () => {
    const handler = jest.fn();
    const td = await transport.subscribe('camp-1', 'player-1', handler);

    transport.emitFiltered('camp-1', { type: 'roll', campaignId: 'camp-1', data: {} as never }, () => true);

    // No await/timer advance — must already have fired.
    expect(handler).toHaveBeenCalledTimes(1);
    td();
  });
});
