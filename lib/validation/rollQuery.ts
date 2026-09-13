import { z } from 'zod';

/**
 * Bounded validator for `GET /api/campaigns/[id]/rolls` query parameters.
 * Mirrors the pre-existing inline checks in the route (same defaults and
 * bounds), just expressed as a single schema so query input is validated
 * before any storage/membership lookup, matching the shared-schema pattern
 * already used for the POST body (`lib/validation/rollSubmission.ts`).
 */

/** Generous bound on session id length — ids are UUID-shaped in practice. */
export const MAX_SESSION_ID_LENGTH = 128;

/** Default page size when `limit` is absent or invalid. */
const DEFAULT_LIMIT = 50;

/** Hard ceiling on page size, regardless of what the caller requests. */
const MAX_LIMIT = 100;

export const listRollsQuerySchema = z.object({
  sessionId: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : ''),
    z.string().min(1, 'sessionId is required').max(MAX_SESSION_ID_LENGTH),
  ),
  limit: z.preprocess((v) => {
    // Only a complete non-negative-integer string counts — reject "200abc",
    // "3.5", "1e5", etc. rather than letting `parseInt` silently truncate them.
    if (typeof v !== 'string' || !/^\d+$/.test(v)) return DEFAULT_LIMIT;
    const raw = parseInt(v, 10);
    return raw < 1 ? DEFAULT_LIMIT : Math.min(raw, MAX_LIMIT);
  }, z.number().int().min(1).max(MAX_LIMIT)),
  before: z.preprocess(
    (v) => (typeof v === 'string' && v !== '' ? v : undefined),
    z.string().optional(),
  ).transform((v, ctx) => {
    if (v === undefined) return undefined;
    const date = new Date(v);
    // Require the canonical ISO-8601 UTC form and reject anything that
    // doesn't round-trip exactly (e.g. an impossible calendar date like
    // "2026-02-30" that `Date` silently rolls over into March).
    if (Number.isNaN(date.getTime()) || date.toISOString() !== v) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid before cursor' });
      return z.NEVER;
    }
    return date;
  }),
});

export type ListRollsQuery = z.infer<typeof listRollsQuerySchema>;
