'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProtectedRoute } from '@/lib/components/ProtectedRoute';
import { ErrorBanner, LoadingState } from '@/lib/components/ui';
import { useToast, Toast } from '@/lib/components/Toast';

interface Invitation {
  id: string;
  campaignId: string;
  campaignName: string;
  invitedBy: string;
  invitedAt: string;
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function InvitationsContent() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch('/api/me/invitations');
      if (!res.ok) throw new Error('Failed to load invitations');
      const data = (await res.json()) as { invitations: Invitation[] };
      setInvitations(data.invitations);
    } catch {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);

  async function handleRespond(campaignId: string, campaignName: string, action: 'accept' | 'decline') {
    setActionError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/members/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error(`Failed to ${action} invitation`);
      setInvitations((prev) => prev.filter((inv) => inv.campaignId !== campaignId));
      if (action === 'accept') {
        showToast(`Joined "${campaignName}"!`, 'success');
      } else {
        showToast(`Declined "${campaignName}"`, 'success');
      }
      void fetchInvitations();
    } catch {
      setActionError(`Failed to ${action} invitation`);
    }
  }

  if (loading) return <LoadingState label="Loading invitations..." />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Pending Invitations</h1>
      <ErrorBanner message={actionError} />
      {invitations.length === 0 ? (
        <p className="text-center text-gray-400">No pending invitations</p>
      ) : (
        <ul className="space-y-4">
          {invitations.map((inv) => (
            <li key={inv.id} className="bg-gray-800 rounded-lg p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-white">{inv.campaignName}</p>
                <p className="text-sm text-gray-400">Invited by: {inv.invitedBy}</p>
                <p className="text-sm text-gray-500">{relativeTime(inv.invitedAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => void handleRespond(inv.campaignId, inv.campaignName, 'accept')}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
                >
                  Accept
                </button>
                <button
                  onClick={() => void handleRespond(inv.campaignId, inv.campaignName, 'decline')}
                  className="border border-gray-500 hover:border-red-500 text-gray-300 hover:text-red-400 text-sm px-3 py-1 rounded"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Toast toast={toast} />
    </div>
  );
}

export default function InvitationsPage() {
  return (
    <ProtectedRoute>
      <InvitationsContent />
    </ProtectedRoute>
  );
}
