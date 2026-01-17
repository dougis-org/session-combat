/**
 * SyncService - Background service that manages sync queue processing
 * 
 * Runs periodically and when network transitions from offline to online.
 * Processes pending operations with exponential backoff.
 */

import { getSyncQueue } from './SyncQueue';

export class SyncService {
  private syncQueue = getSyncQueue();
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: number = 0;

  constructor(
    private syncIntervalMs: number = 30000,
    private fetchFn?: (op: any) => Promise<void>
  ) {
    // Use shared queue instance
    this.setupNetworkListener();
    this.setupVisibilityListener();
    this.startSyncLoop();
  }

  /**
   * Start the background sync loop
   */
  private startSyncLoop(): void {
    if (this.syncInterval) {
      return; // Already running
    }

    this.syncInterval = setInterval(async () => {
      if (this.isOnline && !this.isSyncing) {
        await this.sync();
      }
    }, this.syncIntervalMs);

    console.debug('[SyncService] Sync loop started');
  }

  /**
   * Stop the background sync loop
   */
  stopSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.debug('[SyncService] Sync loop stopped');
    }
  }

  /**
   * Perform synchronization
   */
  async sync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    try {
      const queueSize = this.syncQueue.getSize();
      if (queueSize > 0) {
        console.debug(`[SyncService] Starting sync (${queueSize} pending operations)`);
        
        const processed = await this.syncQueue.process(this.getDefaultFetch());
        this.lastSyncTime = Date.now();
        console.debug(`[SyncService] Sync complete (${processed} operations processed)`);
      }
    } catch (error) {
      console.error('[SyncService] Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get queue status
   */
  getStatus(): { isOnline: boolean; isSyncing: boolean; pendingCount: number } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.syncQueue.getSize()
    };
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  // ========== Private methods ==========

  private setupNetworkListener(): void {
    const handleOnline = async () => {
      this.isOnline = true;
      console.debug('[SyncService] Network online detected; starting sync');
      await this.sync();
    };

    const handleOffline = () => {
      this.isOnline = false;
      console.debug('[SyncService] Network offline detected; pausing sync');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  private getDefaultFetch() {
    return this.fetchFn || (async (op: any) => {
      // Default implementation - would be overridden in real usage
      throw new Error('Fetch function not provided to SyncService');
    });
  }

  private setupVisibilityListener(): void {
    const handler = () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        console.debug('[SyncService] Page visible; triggering sync');
        // Fire-and-forget
        void this.sync();
      }
    };

    document.addEventListener('visibilitychange', handler);
  }

  // Allow updating fetchFn after initialization (useful for tests)
  setFetchFn(fn: (op: any) => Promise<void>) {
    this.fetchFn = fn;
  }
}

// Singleton instance
let instance: SyncService | null = null;

export function initializeSyncService(options?: {
  intervalMs?: number;
  fetchFn?: (op: any) => Promise<void>;
}): SyncService {
  if (!instance) {
    instance = new SyncService(
      options?.intervalMs || 30000,
      options?.fetchFn
    );
  }
  return instance;
}

export function getSyncService(): SyncService | null {
  return instance;
}
