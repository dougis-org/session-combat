'use client';

import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [adminToolsExpanded, setAdminToolsExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
    <div className="bg-gray-900 text-white h-full w-full">
      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        {/* Header with User Info and Logout */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo.svg" alt="D&D Combat Tracker" className="w-16 h-16" />
              <h1 className="text-4xl font-bold">D&D Session Combat Tracker</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-gray-300">
                Welcome, <span className="font-semibold text-blue-400">{user.email}</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded font-semibold transition-colors"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <Link href="/encounters" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Encounters</h2>
            <p className="text-gray-400">Manage encounters and monsters</p>
          </Link>

          <Link href="/monsters" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Monster Library</h2>
            <p className="text-gray-400">Create a library of reusable monsters</p>
          </Link>

          <Link href="/characters" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Characters</h2>
            <p className="text-gray-400">Manage your characters and stats</p>
          </Link>

          <Link href="/parties" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Parties</h2>
            <p className="text-gray-400">Group characters into parties</p>
          </Link>

          <Link href="/combat" className="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 transition">
            <h2 className="text-2xl font-semibold mb-2">Combat Tracker</h2>
            <p className="text-gray-400">Run combat sessions with initiative tracking</p>
          </Link>
        </div>

        {/* Collapsible Admin Tools Section */}
        {user?.isAdmin && (
          <div className="mt-auto pt-8 border-t border-gray-700">
            <button
              onClick={() => setAdminToolsExpanded(!adminToolsExpanded)}
              className="flex items-center justify-between w-full px-4 py-3 bg-blue-950 hover:bg-blue-900 border border-blue-800 rounded-lg transition-colors"
            >
              <span className="text-lg font-semibold text-blue-300">Admin Tools</span>
              <span className={`text-blue-300 transform transition-transform ${adminToolsExpanded ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {adminToolsExpanded && (
              <div className="mt-3 bg-blue-950 border border-blue-800 rounded-lg p-4 space-y-3">
                <p className="text-sm text-blue-200">Import SRD monsters into the global catalog</p>
                <button
                  onClick={handleImportMonsters}
                  disabled={importing}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold transition-colors"
                >
                  {importing ? 'Importing...' : 'Import SRD Monsters'}
                </button>
                
                {importMessage && (
                  <div className={`p-3 rounded text-sm ${
                    importMessage.type === 'success'
                      ? 'bg-green-900 text-green-200'
                      : 'bg-red-900 text-red-200'
                  }`}>
                    {importMessage.text}
                  </div>
                )}

                {/* Import Results Breakdown */}
                {importResult && importMessage?.type === 'success' && (
                  <div className="bg-blue-900 bg-opacity-50 rounded p-3">
                    <h4 className="text-sm font-semibold text-blue-200 mb-2">Import Breakdown by Type:</h4>
                    <div className="space-y-1 text-xs text-blue-100 max-h-48 overflow-y-auto">
                      {allTypes.map(type => (
                        <div key={type} className="flex justify-between">
                          <span className="capitalize">{type}:</span>
                          <span>
                            Imported: <span className="text-green-300 font-semibold">{importResult.countByType[type] || 0}</span>
                            {', '}
                            Skipped: <span className={importResult.skippedByType?.[type] ? 'text-yellow-300 font-semibold' : 'text-green-300'}>{importResult.skippedByType?.[type] || 0}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Totals */}
                    <div className="border-t border-blue-700 mt-3 pt-2">
                      <div className="flex justify-between font-semibold text-blue-200">
                        <span>Total:</span>
                        <span>
                          Imported: <span className="text-green-300">{importResult.count}</span>
                          {', '}
                          Skipped: <span className={importResult.skipped ? 'text-yellow-300' : 'text-green-300'}>{importResult.skipped}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tagline */}
        <div className="text-center text-gray-400 mt-6">
          <p>A simple combat tracker for D&D sessions</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
