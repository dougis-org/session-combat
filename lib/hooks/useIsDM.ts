'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

interface MemberSummary {
  userId: string;
  role: string;
  status: string;
}

export function useIsDM(campaignId: string): { isDM: boolean; loading: boolean } {
  const { user } = useAuth();
  const [isDM, setIsDM] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns/${campaignId}/members`);
        if (!res.ok) {
          if (!cancelled) setIsDM(false);
          return;
        }
        const data = await res.json();
        const members: MemberSummary[] = data.members ?? [];
        const currentMember = members.find(m => m.userId === user?.userId);
        if (!cancelled) {
          setIsDM(currentMember?.role === 'dm' && currentMember?.status === 'active');
        }
      } catch {
        if (!cancelled) setIsDM(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [campaignId, user?.userId]);

  return { isDM, loading };
}
