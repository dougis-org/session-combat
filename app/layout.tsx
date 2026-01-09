/**
 * Root layout - initializes SyncService
 */
'use client';

import { useEffect } from 'react';
import { initializeSyncService } from '@/lib/sync/SyncService';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize sync service on app mount
    const intervalMs = parseInt(process.env.NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL || '30000', 10);
    initializeSyncService({ intervalMs });
    console.debug('[App] SyncService initialized');
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
