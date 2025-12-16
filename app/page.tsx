'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';

function HomeContent() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleImportMonsters = async () => {
    try {
      setImporting(true);
      setImportMessage(null);
      
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

  return (
    <div className="bg-gray-900 text-white h-full w-full">
      <div className="container mx-auto px-4 py-8 h-full flex flex-col">
        {/* Header with User Info and Logout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">D&D Session Combat Tracker</h1>
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

        {/* Admin Import Section */}
        {user?.isAdmin && (
          <div className="mb-8 bg-blue-950 border border-blue-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-blue-300 mb-1">Admin Tools</h3>
                <p className="text-sm text-blue-200">Import SRD monsters into the global catalog</p>
              </div>
              <button
                onClick={handleImportMonsters}
                disabled={importing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded font-semibold transition-colors"
              >
                {importing ? 'Importing...' : 'Import SRD Monsters'}
              </button>
            </div>
            {importMessage && (
              <div className={`mt-3 p-2 rounded text-sm ${
                importMessage.type === 'success'
                  ? 'bg-green-900 text-green-200'
                  : 'bg-red-900 text-red-200'
              }`}>
                {importMessage.text}
              </div>
            )}
          </div>
        )}
        
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

        <div className="mt-auto text-center text-gray-400">
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
