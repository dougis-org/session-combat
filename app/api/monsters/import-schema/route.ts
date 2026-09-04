/**
 * Structure document for the monster import modal.
 * GET /api/monsters/import-schema
 *
 * Returns the field list (with required flags), a JSON Schema, and a
 * fully-populated one-monster example — all derived from the single Zod upload
 * schema so they cannot drift from validation.
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
  } catch {
    jsonSchema = null;
  }

  return NextResponse.json({
    fields: describeMonsterUploadSchema(),
    example: buildMonsterImportExample(),
    jsonSchema,
  });
});
