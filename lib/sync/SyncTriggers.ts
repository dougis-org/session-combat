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

  // Store the latest onSync callback in a ref to avoid stale closures
  const onSyncRef = React.useRef(onSync);

  React.useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  const handler = (event: Event) => {
    if (event.type === 'visibilitychange') {
      if (document.visibilityState === 'visible') {
        console.debug('[SyncTriggers] Page visible; triggering sync');
        onSyncRef.current();
      }
    }
  };

  // Setup visibility change listener
  React.useEffect(() => {
    document.addEventListener('visibilitychange', handler);
    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handler is stable within component lifecycle

  // Setup periodic sync timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.debug('[SyncTriggers] Timer triggered sync');
        onSyncRef.current();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]); // Only restart timer if interval changes
}
