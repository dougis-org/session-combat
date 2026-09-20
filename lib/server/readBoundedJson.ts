import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Result of reading and parsing a request body under a byte cap. Mirrors
 * `readBoundedText` in `app/api/monsters/upload/shared.ts` — the proven
 * streaming-abort model this helper generalizes for JSON-only endpoints.
 */
export type BoundedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: 'oversize' | 'invalid-json' | 'error' };

/**
 * Read a request body up to `maxBytes` and parse it as JSON.
 *
 * A `Content-Length` header above `maxBytes` short-circuits without reading
 * the stream at all. Otherwise the body is streamed via `getReader()` and
 * the read is aborted (`reader.cancel()`) the moment cumulative bytes exceed
 * `maxBytes`, so the body is never buffered past the cap regardless of the
 * sender's actual payload size. A missing body or unparseable JSON resolves
 * to `reason: 'invalid-json'`; `reason: 'error'` is reserved for an
 * unexpected failure while reading the stream itself.
 */
export async function readBoundedJson(
  request: NextRequest,
  maxBytes: number,
): Promise<BoundedJsonResult> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, reason: 'oversize' };
  }

  // A request sent with no body at all (e.g. `fetch(url, { method: 'POST' })`)
  // has `request.body === null` in the Next.js runtime — this is an ordinary
  // malformed client request, not a server fault, so it maps to the same
  // `invalid-json` (400) outcome as an empty/unparseable body rather than
  // `error` (500).
  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, reason: 'invalid-json' };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader
            .cancel()
            .catch((cancelError) =>
              console.warn('readBoundedJson: reader.cancel() failed', cancelError),
            );
          return { ok: false, reason: 'oversize' };
        }
        chunks.push(value);
      }
    }
  } catch (error) {
    console.error('readBoundedJson: stream read failed', error);
    return { ok: false, reason: 'error' };
  }

  const text = Buffer.concat(chunks).toString('utf8');

  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
}

/**
 * Maps a failed `readBoundedJson` result to the standard error response for
 * each failure reason, shared across every route that calls `readBoundedJson`.
 */
export function boundedJsonErrorResponse(reason: 'oversize' | 'invalid-json' | 'error'): NextResponse {
  if (reason === 'oversize') {
    return NextResponse.json({ error: 'Request body is too large' }, { status: 413 });
  }
  if (reason === 'invalid-json') {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
