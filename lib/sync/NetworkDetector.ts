/**
 * NetworkDetector - React hook for detecting online/offline status
 * 
 * Listens to window online/offline events and provides current status
 * via navigator.onLine check.
 */

import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
}

/**
 * React hook that tracks network online/offline status
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(() => {
    // Initialize from navigator.onLine
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Default to online if SSR
  });

  useEffect(() => {
    // Verify current status on mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.debug('[NetworkDetector] Online detected');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.debug('[NetworkDetector] Offline detected');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
