'use client';

import { useState, useEffect, useCallback } from 'react';
import { CampaignContext } from '@/lib/types';
import { fetchCampaignContext } from '@/lib/utils/campaignContext';

export function useCampaignContext(campaignId: string): {
  context: CampaignContext | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [context, setContext] = useState<CampaignContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ctx = await fetchCampaignContext(campaignId);
      setContext(ctx);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign context');
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    void load();
  }, [load, tick]);

  return { context, loading, error, refresh };
}
