"use client";

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CampaignStreamEvent } from '@/lib/types';

type Status = 'connecting' | 'open' | 'error';

// Use a local constant so tests don't need a real EventSource global for static values
const CLOSED = 2;

export function useCampaignStream(
  campaignId: string,
  onEvent: (e: CampaignStreamEvent) => void,
): { status: Status } {
  const [status, setStatus] = useState<Status>('connecting');
  // Store onEvent in a ref to avoid stale closures without triggering reconnect (Decision 3)
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

      if (!torn) setStatus('connecting');

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

      es.onerror = () => {
        if (torn) { es.close(); return; }
        // Only handle HTTP-level failures (CLOSED); browser manages CONNECTING retries (Decision 4)
        if (es.readyState === CLOSED) {
          setStatus('error');
          es.close();
          const nextDelay = delay;
          delay = Math.min(delay * 2, 30_000);
          timerId = setTimeout(() => {
            timerId = null;
            connect();
          }, nextDelay);
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
