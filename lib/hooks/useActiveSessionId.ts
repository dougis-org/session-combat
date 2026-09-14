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
    // The parsed SSE payload crosses a network boundary (see
    // useCampaignStream's JSON.parse) with only a type-level cast, not
    // runtime validation — guard the whole envelope before reading into it.
    if (!e || typeof e !== 'object' || e.type !== 'session') return;
    if (!e.data || typeof e.data !== 'object') return;
    // Defense in depth: the subscription is already scoped to this
    // campaignId server-side, but don't trust a payload for a different
    // campaign (e.g. a stale handler still attached during a campaignId
    // transition) to update this hook's state.
    if (e.campaignId !== campaignId) return;
    const id = e.data.activeSessionId;
    // Same validation as the fetch path: a non-null/undefined value must be
    // a string. A malformed event is discarded (state left as-is) rather
    // than trusted, since the stream payload crosses a network boundary.
    if (id !== null && id !== undefined && typeof id !== 'string') {
      console.error(`useActiveSessionIdCore: malformed activeSessionId in session stream event for campaign ${campaignId}`, id);
      return;
    }
    receivedAuthoritativeRef.current = true;
    setActiveSessionIdState(id ?? null);
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
