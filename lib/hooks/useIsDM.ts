'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import type { MemberRole, MemberStatus } from '@/lib/types';

interface CurrentMember {
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
        // Use the current-member endpoint (not the full /members list) so this
        // hook doesn't duplicate CampaignChat's full-roster fetch just to learn
        // the caller's own role/status.
        const res = await fetch(`/api/campaigns/${campaignId}/members/me`);
        if (!res.ok) {
          if (res.status !== 404) {
            console.error(`useIsDM: /members/me returned ${res.status} for campaign ${campaignId}`);
          }
          if (!cancelled) setIsDM(false);
          return;
        }
        const currentMember: CurrentMember = await res.json();
        if (!cancelled) {
          setIsDM(currentMember?.role === 'dm' && currentMember?.status === 'active');
        }
      } catch (err) {
        console.error(`useIsDM: failed to fetch/parse current member for campaign ${campaignId}`, err);
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
