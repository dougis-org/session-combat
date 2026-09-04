import { NextRequest, NextResponse } from 'next/server';

/** Documented maximum import file size. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ImportScope = 'personal' | 'global';

export type BodyResult =
  | { ok: true; monsters: unknown[]; scope: ImportScope }
  | { ok: false; response: NextResponse };

const oversizeResponse = () =>
  NextResponse.json(
    { error: 'Import file is too large. The maximum size is 5 MB.' },
    { status: 413 },
  );

/**
 * Read the request body up to `maxBytes`, aborting the read as soon as that
 * many bytes have arrived — the body is never buffered past the cap, so an
 * over-large or Content-Length-lying request cannot exhaust memory.
 *
 * If the runtime provides no readable stream at all, the request is rejected
 * outright rather than falling back to a full `request.text()` read: an
 * unbounded fallback would reopen exactly the memory-exhaustion gap this
 * function exists to close.
 */
type BoundedReadResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'oversize' | 'error' };

async function readBoundedText(
  request: NextRequest,
  maxBytes: number,
): Promise<BoundedReadResult> {
  const reader = request.body?.getReader();
  if (!reader) {
    console.error('readBoundedText: request has no readable body stream');
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
              console.warn('readBoundedText: reader.cancel() failed', cancelError),
            );
          return { ok: false, reason: 'oversize' };
        }
        chunks.push(value);
      }
    }
  } catch (error) {
    console.error('readBoundedText: stream read failed', error);
    return { ok: false, reason: 'error' };
  }

  return { ok: true, text: Buffer.concat(chunks).toString('utf8') };
}

/**
 * Enforce the 5 MB cap while reading, parse the JSON body, and normalize it
 * to a bare monsters array (accepts a top-level array or `{ monsters: [...] }`).
 */
export async function readMonstersBody(request: NextRequest): Promise<BodyResult> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    return { ok: false, response: oversizeResponse() };
  }

  const read = await readBoundedText(request, MAX_UPLOAD_BYTES);
  if (!read.ok) {
    return read.reason === 'oversize'
      ? { ok: false, response: oversizeResponse() }
      : {
          ok: false,
          response: NextResponse.json(
            { error: 'Could not read the request body.' },
            { status: 400 },
          ),
        };
  }
  const raw = read.text;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Invalid JSON. Please ensure the file contains valid JSON.' },
        { status: 400 },
      ),
    };
  }

  const monsters = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { monsters?: unknown }).monsters)
      ? ((parsed as { monsters: unknown[] }).monsters)
      : null;

  if (!monsters) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          valid: false,
          errors: [
            {
              message:
                'Upload document must be an array of monsters or contain a "monsters" array',
            },
          ],
        },
        { status: 400 },
      ),
    };
  }

  const scopeRaw =
    parsed && typeof parsed === 'object'
      ? (parsed as { scope?: unknown }).scope
      : undefined;
  const scope: ImportScope = scopeRaw === 'global' ? 'global' : 'personal';

  return { ok: true, monsters, scope };
}
