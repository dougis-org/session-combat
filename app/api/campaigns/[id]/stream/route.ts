import { NextRequest } from 'next/server';
import { withStreamAndParams } from '@/lib/middleware';
import { assertCampaignAccess } from '@/lib/utils/campaign';
import { subscribe } from '@/lib/server/transport';
import type { CampaignStreamEvent } from '@/lib/types';

const _parsed = parseInt(process.env.HEARTBEAT_INTERVAL_MS ?? '25000', 10);
const HEARTBEAT_INTERVAL_MS = Number.isFinite(_parsed) && _parsed > 0 ? _parsed : 25000;

const encoder = new TextEncoder();

function formatSSE(event: CampaignStreamEvent): Uint8Array {
  return encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
}

export const GET = withStreamAndParams<{ id: string }>(
  async (request: NextRequest, auth, params) => {
    const { id } = params;

    const access = await assertCampaignAccess(id, auth.userId);
    if (access instanceof Response) return access;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Flush response headers immediately before async setup
        controller.enqueue(encoder.encode(': connected\n\n'));

        const td = await subscribe(id, (event) => {
          controller.enqueue(formatSSE(event));
        });

        if (request.signal.aborted) {
          td();
          return;
        }

        const heartbeatId = setInterval(() => {
          controller.enqueue(
            formatSSE({ type: 'heartbeat', campaignId: id, data: { ts: Date.now() } })
          );
        }, HEARTBEAT_INTERVAL_MS);
        (heartbeatId as unknown as { unref?: () => void }).unref?.();

        request.signal.addEventListener('abort', () => {
          td();
          clearInterval(heartbeatId);
          try { controller.close(); } catch { /* already closed */ }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
);
