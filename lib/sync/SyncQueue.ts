/**
 * SyncQueue - Manages pending API operations for offline-first sync
 * 
 * Persists to localStorage and retries with exponential backoff
 * when network becomes available.
 */

export interface SyncOperation {
  _id: string;
  type: 'POST' | 'PUT' | 'DELETE';
  resource: string;
  payload: any;
  retries: number;
  nextRetry: number;
  createdAt: number;
}

export class SyncQueue {
  private readonly QUEUE_KEY = 'sessionCombat:v1:syncQueue';
  private queue: SyncOperation[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Add operation to queue
   */
  async enqueue(op: Omit<SyncOperation, '_id' | 'retries' | 'nextRetry' | 'createdAt'>): Promise<void> {
    const operation: SyncOperation = {
      _id: this.generateId(),
      ...op,
      retries: 0,
      nextRetry: Date.now(),
      createdAt: Date.now()
    };

    this.queue.push(operation);
    this.saveToStorage();
    console.debug(`[SyncQueue] Enqueued: ${op.type} ${op.resource}`);
  }

  /**
   * Get next pending operation (FIFO)
   */
  async dequeue(): Promise<SyncOperation | null> {
    const now = Date.now();

    // Find first operation that's ready to retry
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].nextRetry <= now) {
        return this.queue[i];
      }
    }

    return null;
  }

  /**
   * Get a specific operation by ID (for testing/debugging)
   */
  async getOperation(operationId: string): Promise<SyncOperation | null> {
    return this.queue.find(op => op._id === operationId) || null;
  }

  /**
   * Mark operation as successfully synced
   */
  async markSuccess(operationId: string): Promise<void> {
    this.queue = this.queue.filter(op => op._id !== operationId);
    this.saveToStorage();
    console.debug(`[SyncQueue] Marked success: ${operationId}`);
  }

  /**
   * Mark operation as failed and schedule retry
   */
  async markFailure(operationId: string): Promise<void> {
    const op = this.queue.find(o => o._id === operationId);
    if (op) {
      op.retries++;
      op.nextRetry = Date.now() + this.getRetryBackoffMs(op.retries - 1);
      this.saveToStorage();
      console.debug(
        `[SyncQueue] Marked failure (retry ${op.retries}): ${operationId}, ` +
        `next retry in ${op.nextRetry - Date.now()}ms`
      );
    }
  }

  /**
   * Calculate exponential backoff: 1s, 2s, 4s, ..., capped at 30s
   */
  getRetryBackoffMs(retryCount: number): number {
    const base = 1000; // 1 second
    const maxBackoff = 30000; // 30 seconds
    const backoff = base * Math.pow(2, retryCount);
    return Math.min(backoff, maxBackoff);
  }

  /**
   * Clear entire queue
   */
  async clear(): Promise<void> {
    this.queue = [];
    localStorage.removeItem(this.QUEUE_KEY);
    console.debug('[SyncQueue] Cleared queue');
  }

  /**
   * Get current queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Get all pending operations
   */
  getPending(): SyncOperation[] {
    return [...this.queue];
  }

  /**
   * Process queue with provided fetch function
   */
  async process(fetchFn: (op: SyncOperation) => Promise<void>): Promise<number> {
    let processed = 0;
    let op = await this.dequeue();

    while (op) {
      try {
        await fetchFn(op);
        await this.markSuccess(op._id);
        processed++;
      } catch (error) {
        console.warn(`[SyncQueue] Sync failed for operation ${op._id}:`, error);
        await this.markFailure(op._id);
        // Don't process further; will retry later
        break;
      }

      op = await this.dequeue();
    }

    return processed;
  }

  // ========== Private methods ==========

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.QUEUE_KEY);
      if (data) {
        this.queue = JSON.parse(data);
      }
    } catch (error) {
      console.warn('[SyncQueue] Failed to load queue from storage:', error);
      this.queue = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.warn('[SyncQueue] Failed to save queue to storage:', error);
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('[SyncQueue] localStorage quota exceeded');
      }
    }
  }

  private generateId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Singleton instance
let instance: SyncQueue;

export function getSyncQueue(): SyncQueue {
  if (!instance) {
    instance = new SyncQueue();
  }
  return instance;
}
