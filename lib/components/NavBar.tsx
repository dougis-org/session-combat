'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export function NavBar() {
  const { isAuthenticated, loading, logout } = useAuth();

  return (
    <nav className="flex-shrink-0 bg-gray-950 border-b border-gray-800 px-4 py-2">
      <div className="container mx-auto flex gap-4 items-center">
        <Link href="/campaigns" className="text-white font-semibold hover:text-blue-400 transition-colors">
          Campaigns
        </Link>
        <Link href="/encounters" className="text-gray-400 hover:text-white transition-colors text-sm">
          Encounters
        </Link>
        <Link href="/parties" className="text-gray-400 hover:text-white transition-colors text-sm">
          Parties
        </Link>
        <Link href="/characters" className="text-gray-400 hover:text-white transition-colors text-sm">
          Characters
        </Link>
        <Link href="/monsters" className="text-gray-400 hover:text-white transition-colors text-sm">
          Monsters
        </Link>
        <Link href="/combat" className="text-gray-400 hover:text-white transition-colors text-sm">
          Combat
        </Link>
        {isAuthenticated && !loading && (
          <button
            data-testid="logout-button"
            onClick={() => void logout()}
            className="ml-auto text-gray-400 hover:text-white transition-colors text-sm"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
