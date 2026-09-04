/**
 * Ingestion phase for the monster import modal.
 * POST /api/monsters/upload
 *
 * Body: a monsters array (or `{ monsters: [...] }`) plus an optional
 * `scope: 'personal' | 'global'`. Flow (no multi-document transactions):
 *   1. Re-validate the whole document (authority).
 *   2. Enforce admin for `scope: 'global'`.
 *   3. Collapse in-file name+source duplicates (first wins).
 *   4. Skip name+source duplicates that already exist in the target library.
 *   5. Bulk-insert the survivors in one operation.
 *   6. On any ingestion error, delete every row inserted for this batch and
 *      report the load as reverted.
 *
 * Every step after body-parsing runs inside one try/catch: `withAuth` does not
 * catch handler exceptions, and an uncaught throw here would fall through to
 * Next.js's default (non-JSON) error page — which the client's `res.json()`
 * call can't parse. Any unexpected failure instead becomes a structured
 * `{ reverted: true, errors }` 500, matching the shape the modal already knows
 * how to render.
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { isUserAdmin } from '@/lib/permissions';
import { storage } from '@/lib/storage';
import { GLOBAL_USER_ID } from '@/lib/constants';
import {
  validateMonsterUploadDocument,
  monstersArraySchema,
  transformMonsterData,
  type ParsedMonster,
} from '@/lib/validation/monsterUpload';
import type { MonsterTemplate } from '@/lib/types';
import { readMonstersBody, type ImportScope } from './shared';

function keyOf(monster: ParsedMonster): string {
  return `${monster.name}|${monster.source ?? ''}`;
}

function genericFailure(detail: unknown, context: Record<string, unknown>) {
  console.error('Monster import: ingestion failed unexpectedly', {
    detail,
    ...context,
  });
  return NextResponse.json(
    {
      reverted: true,
      errors: [{ message: 'The import failed and was rolled back. Some monsters may need manual cleanup.' }],
      orphanedMonsterIds: [],
    },
    { status: 500 },
  );
}

/** Parse the already-validated monsters array. `validation.valid` guarantees
 * `monstersArraySchema` accepts it, but the two validators are independent
 * code paths — treat a mismatch as an internal bug, not a silent throw. */
function parseCanonicalRows(monsters: unknown[]): ParsedMonster[] | null {
  const result = monstersArraySchema.safeParse(monsters);
  if (!result.success) {
    console.error(
      'Monster import: validateMonsterUploadDocument accepted a document that monstersArraySchema rejected',
      { issues: result.error.issues },
    );
    return null;
  }
  return result.data;
}

async function ingest(
  monsters: unknown[],
  scope: ImportScope,
  auth: { userId: string },
) {
  if (scope === 'global') {
    const isAdmin = (await isUserAdmin(auth.userId)) === true;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can import monsters to the Global library.' },
        { status: 403 },
      );
    }
  }

  const isGlobal = scope === 'global';
  const targetUserId = isGlobal ? GLOBAL_USER_ID : auth.userId;

  // Parse once through the canonical schema so dedupe keys are computed from
  // the same trimmed/defaulted values that get stored — not the raw,
  // pre-parse input.
  const rows = parseCanonicalRows(monsters);
  if (!rows) {
    return genericFailure('canonical re-parse mismatch', { userId: auth.userId });
  }

  // Step 3 — in-file dedupe (first occurrence wins).
  const seen = new Set<string>();
  const skippedDuplicates: string[] = [];
  const unique: ParsedMonster[] = [];
  for (const row of rows) {
    const k = keyOf(row);
    if (seen.has(k)) {
      skippedDuplicates.push(row.name);
      continue;
    }
    seen.add(k);
    unique.push(row);
  }

  // Step 4 — DB dedupe against the target library.
  const existingKeys = await storage.findExistingMonsterKeys(
    unique.map((r) => ({ name: r.name, source: r.source ?? '' })),
    targetUserId,
  );
  const survivors = unique.filter((row) => {
    if (existingKeys.has(keyOf(row))) {
      skippedDuplicates.push(row.name);
      return false;
    }
    return true;
  });

  if (survivors.length === 0) {
    return NextResponse.json(
      { inserted: [], skippedDuplicates, reverted: false },
      { status: 200 },
    );
  }

  // Step 5 — transform + bulk insert.
  const templates: MonsterTemplate[] = survivors.map((row) =>
    transformMonsterData(row, { userId: targetUserId, isGlobal }),
  );
  const generatedIds = templates.map((t) => t.id);

  try {
    await storage.saveManyMonsterTemplates(templates);
  } catch (error) {
    // Step 6 — compensating delete of everything this batch generated.
    let orphanedMonsterIds: string[] = [];
    try {
      await storage.deleteMonsterTemplatesByIds(generatedIds, targetUserId);
    } catch (cleanupError) {
      orphanedMonsterIds = generatedIds;
      console.error('Monster import: compensating delete failed', {
        cleanupError,
        orphanedMonsterIds,
      });
    }
    console.error('Monster import: ingestion failed, batch reverted', {
      error,
      count: templates.length,
      orphanedMonsterIds,
    });
    return NextResponse.json(
      {
        reverted: true,
        errors: [{ message: 'The import failed and was rolled back. Some monsters may need manual cleanup.' }],
        orphanedMonsterIds,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      inserted: templates.map((t) => t.name),
      skippedDuplicates,
      reverted: false,
    },
    { status: 200 },
  );
}

export const POST = withAuth(async (request, auth) => {
  const body = await readMonstersBody(request);
  if (!body.ok) return body.response;

  const validation = validateMonsterUploadDocument(body.monsters);
  if (!validation.valid) {
    return NextResponse.json(
      { valid: false, errors: validation.errors },
      { status: 400 },
    );
  }

  try {
    return await ingest(body.monsters, body.scope, auth);
  } catch (error) {
    return genericFailure(error, { userId: auth.userId, scope: body.scope });
  }
});
