/**
 * Validation phase for the monster import modal.
 * POST /api/monsters/upload/validate
 *
 * Validates the whole document and returns the import count + monster names.
 * Performs NO writes. Also returns `isAdmin` so the modal can decide whether to
 * offer the Personal/Global scope choice (the authoritative admin check still
 * happens on ingest).
 */

import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { isUserAdmin } from '@/lib/permissions';
import { validateMonsterUploadDocument } from '@/lib/validation/monsterUpload';
import { readMonstersBody } from '../shared';

export const POST = withAuth(async (request, auth) => {
  const body = await readMonstersBody(request);
  if (!body.ok) return body.response;

  // withAuth does not catch handler exceptions, so an uncaught throw here
  // would fall through to Next.js's default (non-JSON) error page — which the
  // modal's `res.json()` call can't parse. Keep this defensive even though
  // isUserAdmin/validateMonsterUploadDocument do not currently throw.
  try {
    const validation = validateMonsterUploadDocument(body.monsters);
    const isAdmin = (await isUserAdmin(auth.userId)) === true;

    if (!validation.valid) {
      return NextResponse.json(
        { valid: false, errors: validation.errors, isAdmin },
        { status: 400 },
      );
    }

    const names = body.monsters.map((m) =>
      String((m as { name?: unknown }).name ?? ''),
    );

    return NextResponse.json(
      { valid: true, count: names.length, names, isAdmin },
      { status: 200 },
    );
  } catch (error) {
    console.error('Monster import: validation phase failed unexpectedly', {
      error,
      userId: auth.userId,
    });
    return NextResponse.json(
      {
        valid: false,
        errors: [{ message: 'Could not validate the import file. Please try again.' }],
        isAdmin: false,
      },
      { status: 500 },
    );
  }
});
