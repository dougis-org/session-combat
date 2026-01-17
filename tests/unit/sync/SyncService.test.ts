import { initializeSyncService, getSyncService } from '../../../lib/sync/SyncService';
import { getSyncQueue } from '../../../lib/sync/SyncQueue';

describe('SyncService', () => {
  beforeEach(async () => {
    localStorage.clear();
    const queue = getSyncQueue();
    await queue.clear();

    // Initialize service once for tests
    initializeSyncService({ intervalMs: 100000 });
  });

  afterEach(() => {
    const svc = getSyncService();
    if (svc) svc.stopSyncLoop();
  });

  it('uses provided fetchFn to process queue', async () => {
    const calls: any[] = [];
    const fetchFn = async (op: any) => {
      calls.push(op);
    };

    const queue = getSyncQueue();
    await queue.enqueue({ type: 'POST', resource: 'encounters', payload: { id: 'enc-001' } });

    const svc = getSyncService();
    expect(svc).toBeTruthy();
    svc!.setFetchFn(fetchFn);

    await svc!.sync();

    expect(calls.length).toBe(1);
    expect(queue.getSize()).toBe(0);
  });

  it('triggers sync when page becomes visible', async () => {
    const calls: any[] = [];
    const fetchFn = async (op: any) => {
      calls.push(op);
    };

    const queue = getSyncQueue();
    await queue.enqueue({ type: 'POST', resource: 'encounters', payload: { id: 'enc-002' } });

    const svc = getSyncService();
    svc!.setFetchFn(fetchFn);

    // simulate visibility change
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));

    // allow microtask queue to run
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(calls.length).toBe(1);
    expect(queue.getSize()).toBe(0);
  });
});
