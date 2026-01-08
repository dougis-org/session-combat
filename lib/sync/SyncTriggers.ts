/**
 * SyncTriggers - Manages sync triggers based on page visibility and timers
 */

import React from 'react';

export interface SyncTriggerConfig {
  intervalMs?: number; // Default sync interval in milliseconds
}

/**
 * React hook that triggers sync on page visibility changes and timers
 */
export function useSyncTriggers(onSync: () => void, config?: SyncTriggerConfig) {
  const { intervalMs = 30000 } = config || {}; // Default 30 seconds

  const handler = (event: Event) => {
    if (event.type === 'visibilitychange') {
      if (document.visibilityState === 'visible') {
        console.debug('[SyncTriggers] Page visible; triggering sync');
        onSync();
      }
    }
  };

  // Setup visibility change listener
  React.useEffect(() => {
    document.addEventListener('visibilitychange', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }, [onSync]);

  // Setup periodic sync timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.debug('[SyncTriggers] Timer triggered sync');
        onSync();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [onSync, intervalMs]);
}
