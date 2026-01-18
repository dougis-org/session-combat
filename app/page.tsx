'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';

interface ImportResult {
  count: number;
  skipped: number;
  countByType: Record<string, number>;
  skippedByType?: Record<string, number>;
}

function HomeContent() {
  const { user, logout, loading } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [adminToolsExpanded, setAdminToolsExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleImportMonsters = async () => {
    try {
      setImporting(true);
      setImportMessage(null);
      setImportResult(null);
      
      const response = await fetch('/api/monsters/global', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      const message = data.skipped 
        ? `Successfully imported ${data.count} monsters (${data.skipped} skipped due to bad data)`
        : `Successfully imported ${data.count} monsters`;

      setImportResult({
        count: data.count,
        skipped: data.skipped,
        countByType: data.countByType,
        skippedByType: data.skippedByType,
      });

      setImportMessage({
        type: 'success',
        text: message,
      });
    } catch (error) {
      setImportMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setImporting(false);
    }
  };

  // Get all unique types from imported and skipped
  const allTypes = importResult
    ? Array.from(new Set([
        ...Object.keys(importResult.countByType),
        ...(importResult.skippedByType ? Object.keys(importResult.skippedByType) : []),
      ])).sort()
    : [];

  return (
    <main>
      <h1>Session Combat</h1>
      <p>Offline-first combat application</p>
    </main>
  );
}
