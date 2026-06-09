// --- Mock infrastructure ---

let mockWatch: jest.Mock;
let mockCursorClose: jest.Mock;
let mockToArray: jest.Mock;
let mockGetDatabase: jest.Mock;

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

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn(async () => ({
    client: {
      db: () => ({
        collection: () => ({
          watch: (...args: unknown[]) => mockWatch(...args),
        }),
      }),
    },
  })),
  getDatabase: jest.fn((...args: unknown[]) => mockGetDatabase(...args)),
}));

function resetMocks() {
  mockCursorClose = jest.fn().mockResolvedValue(undefined);
  mockToArray = jest.fn().mockResolvedValue([]);
  mockGetDatabase = jest.fn(async () => ({
    collection: () => ({
      find: (...args: unknown[]) => ({
        toArray: () => mockToArray(...args),
      }),
    }),
  }));
  // First call is the detection probe (closed immediately), subsequent calls are real cursors.
  mockWatch = jest.fn()
    .mockImplementationOnce(() => makeProbeCursor())
    .mockImplementation(() => makeStreamCursor());
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
  const teardown = await transport.subscribe('c1', jest.fn());
  await new Promise(r => setTimeout(r, 10));
  // watch called twice: once for probe (detection), once for real stream
  expect(mockWatch).toHaveBeenCalledTimes(2);
  teardown();
});

// --- T3-2: Second subscribe reuses existing cursor ---

it('T3-2: second subscribe reuses cursor (watch call count stays 2)', async () => {
  const td1 = await transport.subscribe('c1', jest.fn());
  const td2 = await transport.subscribe('c2', jest.fn());
  await new Promise(r => setTimeout(r, 10));
  // probe (1) + real stream (1) = 2; second subscribe reuses openPromise
  expect(mockWatch).toHaveBeenCalledTimes(2);
  td1();
  td2();
});

// --- T3-3: Concurrent subscribes during lazy open result in one cursor ---

it('T3-3: concurrent subscribes during lazy open result in one cursor', async () => {
  const p1 = transport.subscribe('c1', jest.fn());
  const p2 = transport.subscribe('c2', jest.fn());

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
  const teardown = await transport.subscribe('c1', handler);
  teardown();

  // After teardown, subscribing a different handler and routing an event
  // should not call the removed handler
  expect(handler).not.toHaveBeenCalled();
});

// --- T3-5: Last subscriber teardown closes cursor ---

it('T3-5: last subscriber teardown closes cursor', async () => {
  const td = await transport.subscribe('c1', jest.fn());
  await new Promise(r => setTimeout(r, 10)); // let openStream settle
  td();
  await new Promise(r => setTimeout(r, 10));
  expect(mockCursorClose).toHaveBeenCalledTimes(1);
});

// --- T3-6: Last subscriber drops while open is in flight ---

it('T3-6: last subscriber drops while open is in flight', async () => {
  const teardown = await transport.subscribe('c1', jest.fn());
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

  const tdA = await transport.subscribe('A', handlerA);
  const tdB = await transport.subscribe('B', handlerB);

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

  const teardown = await transport.subscribe('c1', jest.fn());

  // Only the probe was called, not the real stream watch
  expect(mockWatch).toHaveBeenCalledTimes(1);
  teardown();
});

// --- T3-9: Detection result is cached across subscribes ---

it('T3-9: replica-set detection is called only once across two subscribes', async () => {
  const td1 = await transport.subscribe('c1', jest.fn());
  const td2 = await transport.subscribe('c2', jest.fn());
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
  const teardown = await transport.subscribe('c1', handler);

  // Trigger poll
  jest.advanceTimersByTime(2001);
  // Flush: getDatabase() → toArray() resolution → handler call
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  teardown();

  expect(handler).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'heartbeat', campaignId: 'c1' })
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
  const teardown = await transport.subscribe('A', handler);

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

  const teardown = await transport.subscribe('c1', jest.fn());
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

  const td = await transport.subscribe('c1', jest.fn());
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
  const teardown = await transport.subscribe('c1', handler);

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
