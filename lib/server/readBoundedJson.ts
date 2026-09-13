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
 * sender's actual payload size.
 */
export async function readBoundedJson(
  request: NextRequest,
  maxBytes: number,
): Promise<BoundedJsonResult> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, reason: 'oversize' };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    console.error('readBoundedJson: request has no readable body stream');
    return { ok: false, reason: 'error' };
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
