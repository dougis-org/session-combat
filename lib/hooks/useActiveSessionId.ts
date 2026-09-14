'use client';

import { useEffect, useRef, useState } from 'react';
import { useCampaignStream } from '@/lib/hooks/useCampaignStream';
import type { CampaignStreamEvent } from '@/lib/types';

export interface UseActiveSessionIdCoreResult {
  activeSessionId: string | null | undefined; // undefined = not yet loaded
  setActiveSessionId: (id: string | null) => void;
  handleStreamEvent: (e: CampaignStreamEvent) => void; // no-ops for non-'session' events
}

// Non-subscribing core: fetch + race-safe state + setter + a handler the
// caller feeds from ITS OWN useCampaignStream subscription. Opens no
// subscription of its own — see useActiveSessionId below for consumers with
// no other reason to hold a subscription.
export function useActiveSessionIdCore(campaignId: string): UseActiveSessionIdCoreResult {
  const [activeSessionId, setActiveSessionIdState] = useState<string | null | undefined>(undefined);
  const receivedAuthoritativeRef = useRef(false);

  // Reset synchronously during render when campaignId changes (mirrors
  // useCampaignStream's prevCampaignId pattern) rather than via setState in
  // an effect, which would trigger an extra cascading render.
  const [prevCampaignId, setPrevCampaignId] = useState(campaignId);
  if (campaignId !== prevCampaignId) {
    setPrevCampaignId(campaignId);
    setActiveSessionIdState(undefined);
  }

  useEffect(() => {
    let cancelled = false;
    receivedAuthoritativeRef.current = false;

    async function load() {
      try {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`);
        if (!res.ok) {
          console.error(`useActiveSessionIdCore: /api/campaigns/${campaignId} returned ${res.status}`);
          return;
        }
        const data = await res.json();
        const fetchedId = data?.activeSessionId;
        // Matches SessionControl.reconcileFromCampaign's existing validation
        // of this same field: a non-null/undefined value must be a string.
        if (fetchedId !== null && fetchedId !== undefined && typeof fetchedId !== 'string') {
          console.error(`useActiveSessionIdCore: malformed activeSessionId in /api/campaigns/${campaignId} response`, fetchedId);
          return;
        }
        // A stream event or optimistic set that arrived while this fetch was
        // in flight is authoritative for the transition it represents; this
        // fetch's result is now stale and must not override it.
        if (!cancelled && !receivedAuthoritativeRef.current) {
          setActiveSessionIdState(fetchedId ?? null);
        }
      } catch (err) {
        console.error(`useActiveSessionIdCore: failed to fetch/parse campaign ${campaignId}`, err);
      }
    }

    void load();

    return () => { cancelled = true; };
  }, [campaignId]);

  function setActiveSessionId(id: string | null) {
    receivedAuthoritativeRef.current = true;
    setActiveSessionIdState(id);
  }

  function handleStreamEvent(e: CampaignStreamEvent) {
    if (e.type !== 'session') return;
    receivedAuthoritativeRef.current = true;
    setActiveSessionIdState(e.data.activeSessionId);
  }

  return { activeSessionId, setActiveSessionId, handleStreamEvent };
}

// Self-subscribing wrapper for consumers with no other reason to open a
// useCampaignStream connection: wires handleStreamEvent to its own
// subscription. Consumers that already hold a useCampaignStream subscription
// for another reason (e.g. CampaignChat/useChatFeed) should use the core
// directly and feed it events from their existing subscription instead, to
// avoid opening a redundant second connection.
export function useActiveSessionId(campaignId: string): {
  activeSessionId: string | null | undefined;
  setActiveSessionId: (id: string | null) => void;
} {
  const core = useActiveSessionIdCore(campaignId);
  useCampaignStream(campaignId, core.handleStreamEvent);
  return core;
}
