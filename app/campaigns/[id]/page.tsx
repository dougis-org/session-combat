'use client';

import { useState, useEffect, useCallback } from 'react';
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

const ROLE_STYLE: Record<MemberRole, { bg: string; label: string }> = {
  dm: { bg: 'bg-blue-700 text-blue-100', label: 'DM' },
  player: { bg: 'bg-gray-600 text-gray-200', label: 'Player' },
};

const STATUS_STYLE: Record<MemberStatus, { bg: string; label: string }> = {
  active: { bg: 'bg-green-700 text-green-100', label: 'Active' },
  invited: { bg: 'bg-yellow-700 text-yellow-100', label: 'Invited' },
  removed: { bg: 'bg-gray-600 text-gray-300', label: 'Removed' },
  declined: { bg: 'bg-gray-600 text-gray-300', label: 'Declined' },
};

function Badge({ style }: { style: { bg: string; label: string } }) {
  return <span className={`${style.bg} text-xs px-2 py-0.5 rounded`}>{style.label}</span>;
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
        <Badge style={ROLE_STYLE[member.role]} />
        <Badge style={STATUS_STYLE[member.status]} />
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

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      }
    }, query.trim() ? 300 : 0);
    return () => clearTimeout(timer);
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
    if (!confirm('Are you sure you want to remove this member?')) return;
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
