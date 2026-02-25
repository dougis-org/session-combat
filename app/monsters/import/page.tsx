'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';

function MonsterImportContent() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file');
      return;
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      setError('File is too large. Please upload a JSON file under 5 MB.');
      return;
    }

    try {
      setLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);

      const response = await fetch('/api/monsters/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Handle partial success (HTTP 207 Multi-Status)
      if (response.status === 207) {
        const successCount = typeof result.successCount === 'number' ? result.successCount : 0;
        const totalCount = typeof result.totalCount === 'number' ? result.totalCount : successCount;
        const details = result.failures || result.error;
        let message = `Successfully imported ${successCount} of ${totalCount} monsters.`;
        if (details) message += ` Some monsters could not be imported: ${details}`;
        setError(message);
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import monsters');
      }

      router.push('/monsters');
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import monsters');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Import Monsters</h1>
          <Link href="/monsters" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded">
            Back to Monsters
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-900 border border-red-700 rounded text-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Upload Monster JSON File</h2>
          <p className="text-gray-400 text-sm mb-6">
            Upload a JSON file containing monster data. The file should have a &quot;monsters&quot; array.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="monster-file" className="block text-sm font-medium mb-2">
                Select JSON File
              </label>
              <input
                id="monster-file"
                type="file"
                accept=".json,application/json"
                ref={fileInputRef}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-semibold"
            >
              {loading ? 'Importing...' : 'Import Monsters'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function MonsterImportPage() {
  return (
    <ProtectedRoute>
      <MonsterImportContent />
    </ProtectedRoute>
  );
}
