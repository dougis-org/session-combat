/**
 * Structure document for monster import tooling.
 * GET /api/monsters/import-schema
 *
 * Returns `fields` (hand-written descriptors kept in sync with
 * `rawMonsterSchema` by convention — see `describeMonsterUploadSchema`),
 * `example` (a hand-written one-monster example that validates against the
 * same schema, asserted by a unit test), and `jsonSchema` (mechanically
 * derived from `rawMonsterSchema` via `z.toJSONSchema`, so it cannot drift).
 * The import modal renders its own field table and download link directly
 * from `lib/validation/monsterUpload` rather than calling this route; it
 * exists as a stable, documented endpoint for other/future callers (and is
 * covered by an integration test).
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/middleware';
import {
  describeMonsterUploadSchema,
  buildMonsterImportExample,
  rawMonsterSchema,
} from '@/lib/validation/monsterUpload';

export const GET = withAuth(async () => {
  let jsonSchema: unknown = null;
  try {
    jsonSchema = z.toJSONSchema(rawMonsterSchema, { io: 'input' });
  } catch (error) {
    console.error('GET /api/monsters/import-schema: z.toJSONSchema failed', error);
    jsonSchema = null;
  }

  return NextResponse.json({
    fields: describeMonsterUploadSchema(),
    example: buildMonsterImportExample(),
    jsonSchema,
  });
});
