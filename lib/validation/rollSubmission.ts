import { z } from 'zod';

/**
 * Bounded validator for the `POST /api/campaigns/[id]/rolls` payload. This is
 * the single shared definition of a well-formed roll submission — usable
 * server-side now and, per issue #712, importable client-side later. Keep
 * this module's imports limited to `zod` and `@/lib/utils/dice` (no `next/*`,
 * no storage) so it stays safe to run in the browser.
 *
 * Each bound below is a resource-exhaustion backstop, not a correctness
 * check: values are derived from the legitimate maxima in `lib/utils/dice.ts`
 * with explicit headroom so normal play is never rejected. See design.md
 * Decision 2 for the full rationale.
 */

/** Largest face in `SUPPORTED_SIDES` (the d% percentile die) — exact ceiling for a single die result, no headroom needed. */
export const MAX_DIE_VALUE = 100;

/** Exact ceiling: MAX_PER_DIE (20) * DIE_SIDES.length (6) = 120, the real pool-builder maximum. No rounding up — tight bounds are a deliberate requester decision (design.md Decision 2). */
export const MAX_DICE_IN_ROLL = 120;

/** Exact ceiling: MAX_DICE_IN_ROLL (120) * MAX_DIE_VALUE (100) + MAX_MODIFIER (999) = 12_999, rounded up slightly to a round number. Absolute-value bound so negative totals (penalties) pass. */
export const MAX_TOTAL_MAGNITUDE = 13_000;

/** A fully-expanded max pool formula (e.g. "20d4+20d6+20d8+20d10+20d12+20d20+999") is ~36 chars; 64 is tight headroom, not loose padding. */
export const MAX_FORMULA_LENGTH = 64;

/** Explicit requester decision (issue #577). */
export const MAX_LABEL_LENGTH = 128;

/** Single-source-of-truth schema for a roll-submission payload. Extra keys are ignored (no `.strict()`), matching today's route behavior of destructuring only known fields. */
export const rollSubmissionSchema = z.object({
  formula: z.string().trim().min(1).max(MAX_FORMULA_LENGTH),
  rolls: z.array(z.number().int().min(1).max(MAX_DIE_VALUE)).max(MAX_DICE_IN_ROLL),
  total: z.number().finite().min(-MAX_TOTAL_MAGNITUDE).max(MAX_TOTAL_MAGNITUDE),
  label: z.string().max(MAX_LABEL_LENGTH).optional(),
  visibility: z.object({
    scope: z.enum(['group', 'dm-only']),
  }),
});

export type RollSubmission = z.infer<typeof rollSubmissionSchema>;
