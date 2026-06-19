"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CampaignStreamEvent } from '@/lib/types';

type Status = 'connecting' | 'open' | 'error';

// Local constant avoids reading EventSource.CLOSED, which requires a real EventSource global
const CLOSED = 2;

export function useCampaignStream(
  campaignId: string,
  onEvent: (e: CampaignStreamEvent) => void,
): { status: Status } {
  const [status, setStatus] = useState<Status>('connecting');
  // Reset status synchronously during render when campaignId changes (avoids stale 'open' flash)
  const [prevCampaignId, setPrevCampaignId] = useState(campaignId);
  if (campaignId !== prevCampaignId) {
    setPrevCampaignId(campaignId);
    setStatus('connecting');
  }
  // Store onEvent in a ref to avoid stale closures without triggering reconnect (Decision 1)
  const onEventRef = useRef(onEvent);
  useLayoutEffect(() => { onEventRef.current = onEvent; });

  useEffect(() => {
    let torn = false;
    let delay = 1_000;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let currentEs: InstanceType<typeof globalThis.EventSource> | null = null;

    function connect() {
      if (torn) return;

      const es = new globalThis.EventSource(`/api/campaigns/${encodeURIComponent(campaignId)}/stream`);
      currentEs = es;

      setStatus('connecting');

      es.onopen = () => {
        if (torn) { es.close(); return; }
        setStatus('open');
        delay = 1_000;
      };

      const handler = (e: MessageEvent) => {
        if (torn) return;
        let parsed: CampaignStreamEvent;
        try {
          parsed = JSON.parse(e.data) as CampaignStreamEvent;
        } catch {
          return; // ignore malformed payload
        }
        onEventRef.current(parsed);
      };

      es.addEventListener('heartbeat', handler);
      es.addEventListener('change', handler);
      es.addEventListener('message', handler);

      es.onerror = () => {
        if (torn) { es.close(); return; }
        if (es.readyState === CLOSED) {
          // HTTP-level failure — close and schedule explicit reconnect with backoff (Decision 4)
          setStatus('error');
          es.close();
          const nextDelay = delay;
          delay = Math.min(delay * 2, 30_000);
          timerId = setTimeout(() => {
            timerId = null;
            connect();
          }, nextDelay);
        } else {
          // Browser is managing a reconnect (transient network drop) — reflect connecting state
          setStatus('connecting');
        }
      };
    }

    connect();

    return () => {
      torn = true;
      currentEs?.close();
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };
  }, [campaignId]);

  return { status };
}
