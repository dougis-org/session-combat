import { NetworkDetector } from "./NetworkDetector";
import { SESSION_COMBAT_PREFIX } from "./LocalStore";

export interface SyncOperation {
  id: string;
  entity: string;
  action: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  nextRetryAt: number;
}

type NewOperation = Omit<
  SyncOperation,
  "id" | "createdAt" | "attempts" | "nextRetryAt"
>;
type SyncFn = (operation: SyncOperation) => Promise<void>;

const SYNC_QUEUE_KEY = `${SESSION_COMBAT_PREFIX}syncQueue`;

const isBrowser = (): boolean => typeof window !== "undefined";

const now = (): number => Date.now();

const readQueue = (): SyncOperation[] => {
  if (!isBrowser()) {
    return [];
  }

  const raw = localStorage.getItem(SYNC_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as SyncOperation[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

const writeQueue = (queue: SyncOperation[]): void => {
  if (!isBrowser()) {
    return;
  }

  if (queue.length === 0) {
    localStorage.removeItem(SYNC_QUEUE_KEY);
    return;
  }

  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
};

const calculateRetryDelay = (attempts: number): number =>
  Math.min(1000 * 2 ** attempts, 30000);

const toFailedOperation = (operation: SyncOperation): SyncOperation => {
  const nextAttempts = operation.attempts + 1;
  return {
    ...operation,
    attempts: nextAttempts,
    nextRetryAt: now() + calculateRetryDelay(nextAttempts),
  };
};

let autoFlushSyncFn: SyncFn | null = null;
let networkSubscribed = false;
let flushInProgress = false;

const subscribeToNetwork = (): void => {
  if (!isBrowser() || networkSubscribed) {
    return;
  }

  NetworkDetector.subscribe((online) => {
    if (!online || !autoFlushSyncFn) {
      return;
    }

    void SyncQueue.flush(autoFlushSyncFn);
  });
  networkSubscribed = true;
};

export const SyncQueue = {
  enqueue(operation: NewOperation): SyncOperation | null {
    if (!isBrowser()) {
      return null;
    }

    subscribeToNetwork();

    const fullOperation: SyncOperation = {
      ...operation,
      id: `${now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
      nextRetryAt: now(),
    };

    const queue = readQueue();
    queue.push(fullOperation);
    writeQueue(queue);

    return fullOperation;
  },

  getAll(): SyncOperation[] {
    if (!isBrowser()) {
      return [];
    }

    subscribeToNetwork();
    return readQueue();
  },

  remove(id: string): void {
    if (!isBrowser()) {
      return;
    }

    subscribeToNetwork();
    const queue = readQueue().filter((operation) => operation.id !== id);
    writeQueue(queue);
  },

  clear(): void {
    if (!isBrowser()) {
      return;
    }

    subscribeToNetwork();
    localStorage.removeItem(SYNC_QUEUE_KEY);
  },

  markFailed(id: string): void {
    if (!isBrowser()) {
      return;
    }

    subscribeToNetwork();
    const queue = readQueue().map((operation) => {
      if (operation.id !== id) {
        return operation;
      }

      return toFailedOperation(operation);
    });

    writeQueue(queue);
  },

  async flush(syncFn: SyncFn): Promise<void> {
    if (!isBrowser() || flushInProgress) {
      return;
    }

    subscribeToNetwork();
    autoFlushSyncFn = syncFn;
    flushInProgress = true;

    try {
      const queue = readQueue();
      const currentTime = now();
      const retained: SyncOperation[] = [];

      for (const operation of queue) {
        if (operation.nextRetryAt > currentTime) {
          retained.push(operation);
          continue;
        }

        try {
          await syncFn(operation);
        } catch {
          retained.push(toFailedOperation(operation));
        }
      }

      writeQueue(retained);
    } finally {
      flushInProgress = false;
    }
  },
};

export { SYNC_QUEUE_KEY };
