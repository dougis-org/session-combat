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
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { isUserAdmin } from '@/lib/permissions';
import { storage } from '@/lib/storage';
import { GLOBAL_USER_ID } from '@/lib/constants';
import {
  validateMonsterUploadDocument,
  transformMonsterData,
} from '@/lib/validation/monsterUpload';
import type { MonsterTemplate } from '@/lib/types';
import { readMonstersBody } from './shared';

function keyOf(monster: { name?: unknown; source?: unknown }): string {
  return `${String(monster.name ?? '')}|${String(monster.source ?? '')}`;
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

  if (body.scope === 'global') {
    const isAdmin = (await isUserAdmin(auth.userId)) === true;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only administrators can import monsters to the Global library.' },
        { status: 403 },
      );
    }
  }

  const isGlobal = body.scope === 'global';
  const targetUserId = isGlobal ? GLOBAL_USER_ID : auth.userId;

  const rows = body.monsters as { name?: unknown; source?: unknown }[];

  // Step 3 — in-file dedupe (first occurrence wins).
  const seen = new Set<string>();
  const skippedDuplicates: string[] = [];
  const unique: typeof rows = [];
  for (const row of rows) {
    const k = keyOf(row);
    if (seen.has(k)) {
      skippedDuplicates.push(String(row.name ?? ''));
      continue;
    }
    seen.add(k);
    unique.push(row);
  }

  // Step 4 — DB dedupe against the target library.
  const existingKeys = await storage.findExistingMonsterKeys(
    unique.map((r) => ({ name: String(r.name ?? ''), source: String(r.source ?? '') })),
    targetUserId,
  );
  const survivors = unique.filter((row) => {
    if (existingKeys.has(keyOf(row))) {
      skippedDuplicates.push(String(row.name ?? ''));
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
});
