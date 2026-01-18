import { SyncQueue } from '../../../../lib/sync/SyncQueue';
import type { SyncOperation } from '../../../../lib/sync/SyncQueue';

export const QUEUE_KEY = 'sessionCombat:v1:syncQueue';

export function buildOp(op: Partial<SyncOperation> = {}): { type: string; resource: string; payload: any } {
  return {
    type: (op.type as any) || 'POST',
    resource: op.resource || 'encounters',
    payload: op.payload || { id: `enc-${Date.now()}` }
  };
}

export async function enqueueOp(queue: SyncQueue, op: { type: string; resource: string; payload: any }) {
  await queue.enqueue({ type: op.type as any, resource: op.resource, payload: op.payload });
}

export async function enqueueMany(queue: SyncQueue, ops: Array<{ type: string; resource: string; payload: any }>) {
  for (const op of ops) {
    await enqueueOp(queue, op);
  }
}

export function readStoredQueue(): any[] {
  const data = localStorage.getItem(QUEUE_KEY);
  return data ? JSON.parse(data) : [];
}
