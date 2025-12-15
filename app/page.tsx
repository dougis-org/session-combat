'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';

function HomeContent() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
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

        <div className="mt-12 text-center text-gray-400">
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
