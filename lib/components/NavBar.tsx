'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export function NavBar() {
  const { isAuthenticated, loading, logout } = useAuth();
  const [invitationCount, setInvitationCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || loading) return;
    let active = true;
    fetch('/api/me/invitations')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { invitations?: unknown[] }) => {
        if (active) setInvitationCount(data.invitations?.length ?? 0);
      })
      .catch(() => {
        if (active) setInvitationCount(0);
      });
    return () => { active = false; };
  }, [isAuthenticated, loading]);

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
        {isAuthenticated && !loading && invitationCount > 0 && (
          <Link href="/invitations" className="text-yellow-400 hover:text-yellow-300 transition-colors text-sm">
            Invitations ({invitationCount})
          </Link>
        )}
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
