'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { MemberRole, MemberStatus } from '@/lib/types';

interface MemberSummary {
  userId: string;
  role: MemberRole;
  status: MemberStatus;
}

export function useIsDM(campaignId: string): { isDM: boolean; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.userId ?? null;
  const [isDM, setIsDM] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Wait for auth to settle before fetching members: avoids an initial fetch
    // with no user followed by a second fetch once the user id becomes known.
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!userId) {
      setIsDM(false);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/members`);
        if (!res.ok) {
          console.error(`useIsDM: /members returned ${res.status} for campaign ${campaignId}`);
          if (!cancelled) setIsDM(false);
          return;
        }
        const data = await res.json();
        const members: MemberSummary[] = data.members ?? [];
        const currentMember = members.find(m => m.userId === userId);
        if (!cancelled) {
          setIsDM(currentMember?.role === 'dm' && currentMember?.status === 'active');
        }
      } catch (err) {
        console.error(`useIsDM: failed to fetch/parse members for campaign ${campaignId}`, err);
        if (!cancelled) setIsDM(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [campaignId, userId, authLoading]);

  return { isDM, loading };
}
