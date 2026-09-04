import { NextRequest, NextResponse } from 'next/server';

/** Documented maximum import file size. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ImportScope = 'personal' | 'global';

export type BodyResult =
  | { ok: true; monsters: unknown[]; scope: ImportScope }
  | { ok: false; response: NextResponse };

/**
 * Enforce the 5 MB cap, parse the JSON body, and normalize it to a bare
 * monsters array (accepts a top-level array or `{ monsters: [...] }`).
 */
export async function readMonstersBody(request: NextRequest): Promise<BodyResult> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Import file is too large. The maximum size is 5 MB.' },
        { status: 413 },
      ),
    };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Could not read the request body.' },
        { status: 400 },
      ),
    };
  }

  const byteLength =
    typeof Buffer !== 'undefined'
      ? Buffer.byteLength(raw, 'utf8')
      : new TextEncoder().encode(raw).length;
  if (byteLength > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Import file is too large. The maximum size is 5 MB.' },
        { status: 413 },
      ),
    };
  }

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
