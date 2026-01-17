/**
 * SyncTriggers (DEPRECATED)
 *
 * This module previously exposed a React hook for triggering syncs on page
 * visibility and timers. That logic has been consolidated into `SyncService`.
 * The hook remains to avoid breaking imports but is a no-op and issues a
 * deprecation warning.
 */

import React from 'react';

export interface SyncTriggerConfig {
  intervalMs?: number;
}

export function useSyncTriggers(_onSync: () => void, _config?: SyncTriggerConfig) {
  React.useEffect(() => {
    console.warn('[SyncTriggers] useSyncTriggers is deprecated. SyncService now handles visibility and timer triggers.');
  }, []);
}