import { SyncQueue } from '../../../lib/sync/SyncQueue';

describe('SyncQueue generateId integration', () => {
  let q: SyncQueue;

  beforeEach(async () => {
    localStorage.clear();
    q = new SyncQueue();
    await q.clear();
  });

  it('enqueues items with _id starting with sync-', async () => {
    await q.enqueue({ type: 'POST', resource: 'encounters', payload: { id: 'x' } });
    const pending = q.getPending();
    expect(pending.length).toBe(1);
    expect(typeof pending[0]._id).toBe('string');
    expect(pending[0]._id.startsWith('sync-')).toBe(true);
  });

  it('generates unique ids for multiple enqueues', async () => {
    await q.enqueue({ type: 'POST', resource: 'encounters', payload: { id: 'a' } });
    await q.enqueue({ type: 'POST', resource: 'encounters', payload: { id: 'b' } });
    const ids = q.getPending().map(p => p._id);
    expect(new Set(ids).size).toBe(2);
  });
});
