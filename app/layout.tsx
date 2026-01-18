/**
 * Root layout - initializes SyncService
 */
'use client';

import './globals.css';
import { useEffect } from 'react';
import { initializeSyncService } from '@/lib/sync/SyncService';
import type { SyncOperation } from '@/lib/sync/SyncQueue';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize sync service on app mount
    const intervalMs = parseInt(process.env.NEXT_PUBLIC_OFFLINE_SYNC_INTERVAL || '30000', 10);

    // Fetch function for syncing operations to the server
    const fetchFn = async (op: SyncOperation) => {
      const { type, resource, payload } = op;

      const options: RequestInit = {
        method: type,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Include body for POST and PUT operations
      if (type === 'POST' || type === 'PUT') {
        options.body = JSON.stringify(payload);
      }

      // Ensure resource is a valid URL/path; prefix with '/api/' when needed
      const endpoint =
        resource.startsWith('http://') ||
        resource.startsWith('https://') ||
        resource.startsWith('/')
          ? resource
          : `/api/${resource}`;

      const response = await fetch(endpoint, options);

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }
    };

    initializeSyncService({ intervalMs, fetchFn });
    console.debug('[App] SyncService initialized');
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
