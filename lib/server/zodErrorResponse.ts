import { NextResponse } from 'next/server';
import type { z } from 'zod';

/**
 * Convert a zod validation failure into the standard 400 error response
 * shape used across API routes: `{ error: "<field>: <message>" }` when the
 * first issue has a path, `{ error: fallbackMessage }` otherwise.
 */
export function zodErrorResponse(error: z.ZodError, fallbackMessage: string): NextResponse {
  const firstIssue = error.issues[0];
  const message = firstIssue?.path?.length
    ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
    : fallbackMessage;
  return NextResponse.json({ error: message }, { status: 400 });
}
