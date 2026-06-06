'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState, textInputClass } from '@/lib/components/ui';
import { useAuth } from '@/lib/hooks/useAuth';
import type { MemberRole, MemberStatus } from '@/lib/types';

interface EnrichedMember {
  id: string;
  userId: string;
  username: string;
  role: MemberRole;
  status: MemberStatus;
}

interface SearchResult {
  id: string;
  username: string;
}

function RoleBadge({ role }: { role: MemberRole }) {
  if (role === 'dm') {
    return <span className="bg-blue-700 text-blue-100 text-xs px-2 py-0.5 rounded">DM</span>;
  }
  return <span className="bg-gray-600 text-gray-200 text-xs px-2 py-0.5 rounded">Player</span>;
}

function StatusBadge({ status }: { status: MemberStatus }) {
  switch (status) {
    case 'active':
      return <span className="bg-green-700 text-green-100 text-xs px-2 py-0.5 rounded">Active</span>;
    case 'invited':
      return <span className="bg-yellow-700 text-yellow-100 text-xs px-2 py-0.5 rounded">Invited</span>;
    case 'removed':
      return <span className="bg-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded">Removed</span>;
    case 'declined':
      return <span className="bg-gray-600 text-gray-300 text-xs px-2 py-0.5 rounded">Declined</span>;
  }
}

function MemberRow({
  member,
  isDM,
  currentUserId,
  onRemove,
}: {
  member: EnrichedMember;
  isDM: boolean;
  currentUserId: string;
  onRemove: (userId: string) => void;
}) {
  const isOwnRow = member.userId === currentUserId;
  const canRemove = isDM && !isOwnRow && (member.status === 'active' || member.status === 'invited');

  return (
    <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="font-medium">{member.username}</span>
        <RoleBadge role={member.role} />
        <StatusBadge status={member.status} />
      </div>
      {canRemove && (
        <button
          onClick={() => onRemove(member.userId)}
          className="bg-red-700 hover:bg-red-600 px-3 py-1 rounded text-xs ml-2"
        >
          Remove
        </button>
      )}
    </div>
  );
}

function InviteSection({
  campaignId,
  onInvited,
}: {
  campaignId: string;
  onInvited: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        // ignore
      }
    }, 300);
  }, [query]);

  const handleInvite = async (userId: string) => {
    setInviteError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.status === 409) {
        const data = await res.json();
        setInviteError(data.error ?? 'Member already exists');
        return;
      }
      if (!res.ok) {
        setInviteError('Failed to invite member');
        return;
      }
      setQuery('');
      setResults([]);
      onInvited();
    } catch {
      setInviteError('Failed to invite member');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Invite a Player</h2>
      {inviteError && (
        <div className="text-red-400 text-sm mb-2">{inviteError}</div>
      )}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search username..."
        className={textInputClass()}
      />
      {results.length > 0 && (
        <ul className="mt-2 space-y-1">
          {results.map(r => (
            <li key={r.id} className="flex items-center justify-between bg-gray-700 rounded px-3 py-2">
              <span>{r.username}</span>
              <button
                onClick={() => handleInvite(r.id)}
                className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded text-xs"
              >
                Invite
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CampaignMembersContent({ campaignId }: { campaignId: string }) {
  const { user } = useAuth();
  const [campaignName, setCampaignName] = useState<string>('');
  const [members, setMembers] = useState<EnrichedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [campaignRes, membersRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/campaigns/${campaignId}/members`),
      ]);
      if (!campaignRes.ok || !membersRes.ok) {
        setError('Failed to load campaign data');
        return;
      }
      const [campaignData, membersData] = await Promise.all([
        campaignRes.json(),
        membersRes.json(),
      ]);
      setCampaignName(campaignData.name ?? '');
      setMembers(membersData.members ?? []);
    } catch {
      setError('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentUserId = user?.userId ?? '';
  const currentMember = members.find(m => m.userId === currentUserId);
  const isDM = currentMember?.role === 'dm' && currentMember?.status === 'active';

  const handleRemove = async (targetUserId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/members/${targetUserId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        setError('Failed to remove member');
        return;
      }
      await fetchData();
    } catch {
      setError('Failed to remove member');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{campaignName || 'Campaign Members'}</h1>
          <Link href="/campaigns" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
            Back to Campaigns
          </Link>
        </div>

        <ErrorBanner message={error} />

        {loading ? (
          <LoadingState label="Loading members..." />
        ) : (
          <>
            <div className="space-y-2">
              {members.map(member => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isDM={isDM}
                  currentUserId={currentUserId}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {isDM && (
              <InviteSection campaignId={campaignId} onInvited={fetchData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CampaignMembersPage() {
  const params = useParams();
  const campaignId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <ProtectedRoute>
      <CampaignMembersContent campaignId={campaignId as string} />
    </ProtectedRoute>
  );
}
