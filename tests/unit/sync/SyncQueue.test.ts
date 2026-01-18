import { SyncQueue } from '../../../lib/sync/SyncQueue';
import testCases from '../data/sync-queue-test-cases.json';
import {
  buildOp,
  enqueueOp,
  enqueueMany,
  readStoredQueue,
  QUEUE_KEY
} from './helpers/syncQueue.helpers';

describe('SyncQueue', () => {
  let syncQueue: SyncQueue;

  beforeEach(() => {
    localStorage.clear();
    syncQueue = new SyncQueue();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('enqueue', () => {
    it('should add operation to queue', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      await enqueueOp(syncQueue, op);

      const queued = await syncQueue.dequeue();
      expect(queued).toBeDefined();
      expect(queued?.resource).toBe(op.resource);
    });

    it('should persist queue to localStorage', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      await enqueueOp(syncQueue, op);

      const stored = readStoredQueue();
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toBeGreaterThan(0);
    });

    it('should handle multiple enqueues in sequence', async () => {
      const cases = testCases.enqueueCases.slice(0, 2).map(c => c.operation as any);
      await enqueueMany(syncQueue, cases);

      const parsed = readStoredQueue();
      expect(parsed.length).toBe(2);
    });
  });

  describe('dequeue', () => {
    it('should return oldest pending operation', async () => {
      const cases = testCases.enqueueCases.slice(0, 2).map(c => c.operation as any);
      await enqueueMany(syncQueue, cases);

      const first = await syncQueue.dequeue();
      expect(first?.resource).toBe(cases[0].resource);
    });

    it('should return null if queue is empty', async () => {
      const op = await syncQueue.dequeue();
      expect(op).toBeNull();
    });
  });

  describe('markSuccess', () => {
    it('should remove operation from queue', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      await enqueueOp(syncQueue, op);

      const queued = await syncQueue.dequeue();
      expect(queued).toBeDefined();

      await syncQueue.markSuccess(queued!._id);

      const remaining = await syncQueue.dequeue();
      expect(remaining).toBeNull();
    });
  });

  describe('markFailure', () => {
    it('should increment retry count', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      await enqueueOp(syncQueue, op);

      const queued = await syncQueue.dequeue();
      expect(queued?.retries).toBe(0);

      await syncQueue.markFailure(queued!._id);

      const updated = await syncQueue.getOperation(queued!._id);
      expect(updated?.retries).toBe(1);
    });

    it('should set correct next retry time based on backoff', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      await enqueueOp(syncQueue, op);

      const queued = await syncQueue.dequeue();
      const beforeFailure = Date.now();
      await syncQueue.markFailure(queued!._id);
      const afterFailure = Date.now();

      const updated = await syncQueue.getOperation(queued!._id);
      expect(updated?.nextRetry).toBeGreaterThanOrEqual(beforeFailure + 1000);
      expect(updated?.nextRetry).toBeLessThanOrEqual(afterFailure + 1000);
    });
  });

  describe('getRetryBackoffMs', () => {
    testCases.retryBackoffCases.forEach(testCase => {
      it(`should return ${testCase.expectedBackoffMs}ms for retry count ${testCase.retryCount}`, () => {
        const backoff = syncQueue.getRetryBackoffMs(testCase.retryCount);
        expect(backoff).toBe(testCase.expectedBackoffMs);
      });
    });

    it('should cap backoff at 30 seconds', () => {
      const backoff = syncQueue.getRetryBackoffMs(100);
      expect(backoff).toBe(30000);
    });
  });

  describe('clear', () => {
    it('should wipe entire queue', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      await enqueueOp(syncQueue, op);

      await syncQueue.clear();

      const remaining = await syncQueue.dequeue();
      expect(remaining).toBeNull();

      const stored = localStorage.getItem(QUEUE_KEY);
      expect(stored).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should load queue from localStorage on initialization', async () => {
      const op = testCases.enqueueCases[0].operation as any;

      const queue1 = new SyncQueue();
      await enqueueOp(queue1, op);

      // Create new instance (simulates page reload)
      const queue2 = new SyncQueue();
      const loaded = await queue2.dequeue();
      expect(loaded).toBeDefined();
      expect(loaded?.resource).toBe(op.resource);
    });
  });
});
