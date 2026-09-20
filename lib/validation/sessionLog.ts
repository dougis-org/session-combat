import { z } from 'zod';

/**
 * Bounded validator for the `POST /api/campaigns/[id]/sessions` payload.
 * Keep this module's imports limited to `zod` (no `next/*`, no storage) so
 * it stays safe to run in the browser, matching `rollSubmission.ts`'s
 * conventions.
 *
 * Only `datePlayed`, `title`, `summary`, and `events` are covered here —
 * `sessionNumber`/`milestone`/`newLevel` are intentionally out of scope, see
 * design.md Decision 1.
 *
 * Each bound below is a resource-exhaustion backstop with generous headroom
 * over realistic session-log content, not a codification of an existing UI
 * constraint (none exists) — see design.md Decision 2.
 */

/** A title is a one-line label. */
export const MAX_TITLE_LENGTH = 200;

/** A summary is multi-paragraph session prose. */
export const MAX_SUMMARY_LENGTH = 10_000;

/** Comfortably covers a long session's auto-captured + manual events. */
export const MAX_EVENTS = 200;

/** An event description is shorter free text than the overall summary. */
export const MAX_EVENT_DESCRIPTION_LENGTH = 2_000;

/** Identifiers (characterId, encounterId, campaignId) are opaque IDs, not free text. */
export const MAX_ID_LENGTH = 100;

/** A character name is a one-line label, same order of magnitude as a title. */
export const MAX_CHARACTER_NAME_LENGTH = 200;

/**
 * The longest legitimate ISO representation this schema accepts is a
 * full UTC timestamp with milliseconds (e.g. "2026-02-28T12:34:56.789Z",
 * 24 chars) — the round-trip check below always normalizes through
 * `Date.prototype.toISOString()`, so offset-suffixed input (e.g. "+14:00")
 * never round-trips and is rejected too. 40 leaves headroom over that
 * longest accepted form without letting an oversized string reach the
 * regex/`Date` parsing below.
 */
const MAX_ISO_DATE_LENGTH = 40;

/**
 * Requires an explicit string date representation and validates it round-trips
 * to the same calendar date/instant it names — rejecting both non-string JSON
 * values (`z.coerce.date()` would silently accept a number or boolean as a
 * "valid" date) and impossible calendar dates that `Date` silently rolls over
 * (e.g. "2026-02-30" -> March 2).
 */
function isoDateSchema(message = 'must be a valid date') {
  return z
    .string()
    .max(MAX_ISO_DATE_LENGTH, { message })
    .transform((value, ctx) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
        return z.NEVER;
      }
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
      const roundTrip = isDateOnly ? date.toISOString().slice(0, 10) : date.toISOString();
      if (roundTrip !== value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
        return z.NEVER;
      }
      return date;
    });
}

/** Mirrors `SessionEvent` in `lib/types.ts` field-for-field. */
export const sessionEventSchema = z.object({
  type: z.enum(['npc_joined', 'npc_left', 'combat_completed', 'custom']),
  description: z.string().trim().min(1).max(MAX_EVENT_DESCRIPTION_LENGTH),
  characterId: z.string().max(MAX_ID_LENGTH).optional(),
  characterName: z.string().max(MAX_CHARACTER_NAME_LENGTH).optional(),
  timestamp: isoDateSchema('timestamp must be a valid date').optional(),
  encounterId: z.string().max(MAX_ID_LENGTH).optional(),
  encounterDescription: z.string().max(MAX_EVENT_DESCRIPTION_LENGTH).optional(),
  rounds: z.number().int().nonnegative().optional(),
  completedAt: isoDateSchema('completedAt must be a valid date').optional(),
  campaignId: z.string().max(MAX_ID_LENGTH).optional(),
});

/**
 * `sessionNumber`/`milestone`/`newLevel` are intentionally validated here as
 * best-effort preprocessed fields rather than strict types: per design.md
 * Decision 1, an invalid/missing `sessionNumber` must fall through to the
 * route's `getNextSessionNumber` fallback rather than reject the request, so
 * a malformed value is coerced to `undefined` instead of failing `safeParse`.
 */
export const sessionLogSubmissionSchema = z.object({
  datePlayed: isoDateSchema('datePlayed must be a valid date'),
  title: z.string().trim().max(MAX_TITLE_LENGTH).optional(),
  summary: z.string().max(MAX_SUMMARY_LENGTH).optional(),
  events: z.array(sessionEventSchema).max(MAX_EVENTS).optional().default([]),
  sessionNumber: z.preprocess(
    (v) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : undefined),
    z.number().int().nonnegative().optional(),
  ),
  milestone: z.preprocess((v) => v === true, z.boolean()),
  newLevel: z.preprocess(
    (v) => (typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : undefined),
    z.number().int().positive().optional(),
  ),
});

export type SessionLogSubmission = z.infer<typeof sessionLogSubmissionSchema>;
