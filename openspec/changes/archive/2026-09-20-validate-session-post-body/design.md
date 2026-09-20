## Context

- Relevant architecture: Next.js route handlers under `app/api/campaigns/[id]/`, wrapped by `withAuthAndParams`. Validation-at-the-boundary precedent already exists for `POST /api/campaigns/[id]/rolls` (`app/api/campaigns/[id]/rolls/route.ts`), using `lib/server/readBoundedJson.ts` + a route-scoped zod schema in `lib/validation/rollSubmission.ts`.
- Dependencies: `zod` (already a project dependency, used by `lib/validation/rollSubmission.ts`, `lib/validation/rollQuery.ts`, `lib/validation/monsterUploadSchema.ts`); `lib/server/readBoundedJson.ts` (generic, no existing route-specific coupling).
- Interfaces/contracts touched: `POST /api/campaigns/[id]/sessions` request-body contract (adds validation, no response-shape change on success); `POST`/`GET /api/campaigns/[id]/rolls` internal error-formatting code path (refactored to a shared helper, no external contract change — response shape is preserved byte-for-byte).

## Goals / Non-Goals

### Goals

- Reject malformed `datePlayed`, oversized `title`/`summary`, and malformed/oversized `events` with a 400 response before any data reaches `storage.saveSessionLog`.
- Reuse the existing `readBoundedJson` + zod `safeParse` pattern from the `rolls` route rather than inventing a new validation style.
- Eliminate the now-three-times-duplicated zod-error-to-400-response logic by extracting one shared helper, applied to both `rolls` and `sessions` routes.
- Leave the `getNextSessionNumber` / `SESSION_NUMBER_UNAVAILABLE` branch, and the `sessionNumber`/`milestone`/`newLevel` resolution logic around it, behaviorally untouched.

### Non-Goals

- Validating `datePlayed` semantic range (not-too-far-future/past).
- Migrating or re-validating existing `SessionLog` documents.
- Auditing every other API route for similar ad-hoc validation beyond the `rolls`/`sessions` duplication this change directly creates.

## Decisions

### Decision 1: Schema scope excludes `sessionNumber`, `milestone`, `newLevel`

- Chosen: `sessionLogSubmissionSchema` (new, in `lib/validation/sessionLog.ts`) validates only `datePlayed`, `title`, `summary`, `events`. It does **not** parse `sessionNumber`, `milestone`, or `newLevel`; the route continues to destructure and branch on those fields exactly as today, immediately after the new validation step.
- Alternatives considered: including all seven original fields in one schema (matches the proposal's initial wording more literally).
- Rationale: `sessionNumber`'s current inline check (`typeof sessionNumber === 'number' && Number.isInteger(...) && sessionNumber >= 0`) is not a rejection — an invalid/missing value silently falls through to `storage.getNextSessionNumber(...)`, i.e. the `getNextSessionNumber` branch the issue explicitly excludes. Folding `sessionNumber` into a `safeParse`-or-400 schema would turn that fallback trigger into a validation error, changing excluded-scope behavior. `milestone`/`newLevel` are already narrowly checked (`=== true`, `typeof newLevel === 'number' && Number.isInteger && > 0`) and not named in the issue body's "notably missing" list.
- Trade-offs: the route keeps two validation styles side by side (zod for the new fields, inline checks for the old three) rather than one uniform schema. This is intentional — it keeps the excluded branch's behavior provably unchanged, at the cost of stylistic uniformity that can be revisited in a future, separately-scoped change.

### Decision 2: Field bounds

- Chosen:
  - `title`: `z.string().trim().max(200).optional()`
  - `summary`: `z.string().max(10_000).optional()`
  - `events`: `z.array(sessionEventSchema).max(200).optional()`, defaulting to `[]` when absent (matches current `Array.isArray(events) ? events : []` behavior)
  - each event's `description`: `z.string().trim().min(1).max(2_000)`
  - `datePlayed`: `z.coerce.date()` (required) — zod's date coercion runs `new Date(input)` and raises an `invalid_date` issue when the result is `NaN`, which is exactly the gap the issue reports.
- Alternatives considered: deriving bounds from an existing UI constraint (as `rollSubmission.ts` derives `MAX_LABEL_LENGTH` etc. from `lib/utils/dice.ts` constants). Confirmed by inspection (`app/campaigns/[id]/sessions/page.tsx:237-299`) that no `maxLength` exists on the title/summary/custom-event inputs — there is nothing to derive from.
- Rationale: bounds are set as resource-exhaustion backstops with generous headroom over realistic session-log content (a title is a one-line label; a summary is multi-paragraph session prose; 200 events comfortably covers a long session's auto-captured + manual events; a per-event description is shorter free text than the overall summary) — same philosophy as `rollSubmission.ts`'s documented bound comments. Not intended to reject any real, human-written session log.
- Trade-offs: an existing stored `SessionLog` with a `summary` longer than 10,000 characters (if any) would fail to re-save (edit/update flow) after this change, even though it was valid when written. No migration is performed (Non-Goal); this is accepted as a low-likelihood edge case given typical session-note length.

### Decision 3: `sessionEventSchema` shape

- Chosen: mirrors `SessionEvent` (`lib/types.ts:689-700`) field-for-field:
  ```
  type: z.enum(['npc_joined', 'npc_left', 'combat_completed', 'custom'])
  description: z.string().trim().min(1).max(2_000)
  characterId: z.string().optional()
  characterName: z.string().optional()
  timestamp: z.coerce.date().optional()
  encounterId: z.string().optional()
  encounterDescription: z.string().optional()
  rounds: z.number().int().nonnegative().optional()
  completedAt: z.coerce.date().optional()
  campaignId: z.string().optional()
  ```
- Alternatives considered: a loose `z.object({ type: z.string(), description: z.string() }).passthrough()` that only checks the two fields the manual UI form populates.
- Rationale: the combat-event auto-capture path (`openspec/specs/session-journal-integration/session-journal-integration.md`) populates the fuller field set (`encounterId`, `rounds`, `completedAt`, etc.); a loose schema would let malformed values through on exactly the fields the manual form never exercises, defeating the point of the fix. Full-shape validation is checked against the `SessionEvent` interface directly so the two stay in lockstep.
- Trade-offs: schema must be kept in sync if `SessionEvent` gains fields later; no compile-time enforcement of this (zod schemas are not derived from TS interfaces). Accepted — same risk already exists for `rollSubmissionSchema` vs. its consumers.

### Decision 4: Shared `zodErrorResponse` helper location and signature

- Chosen: `lib/server/zodErrorResponse.ts`, exporting `zodErrorResponse(error: z.ZodError, fallbackMessage: string): NextResponse` — returns `NextResponse.json({ error: "<field>: <message>" | fallbackMessage }, { status: 400 })`, matching the existing inline logic in `rolls/route.ts:30-35` (POST) and `:97-101` (GET) exactly, including the "no path → no field prefix" behavior and the `?? 'Invalid roll payload'`-style fallback (parameterized instead of hardcoded).
- Alternatives considered: a method on a shared "validation" class; inlining the extraction directly into `lib/validation/core.ts` (which currently holds only non-zod hand-rolled validators, not zod-aware code).
- Rationale: `lib/server/` already holds `readBoundedJson.ts` — a small, framework-adjacent (imports `NextResponse`) server helper — making it the natural home for another `NextResponse`-returning helper. Keeping it out of `lib/validation/` preserves that directory's existing constraint (per `rollSubmission.ts`'s own doc comment) of staying `next/*`-free and safe to import client-side.
- Trade-offs: none material — this is a pure extraction of identical logic to one call site, applied at three now-existing call sites (`rolls` POST, `rolls` GET, `sessions` POST).

## Proposal to Design Mapping

- Proposal element: "New `lib/validation/sessionLog.ts` module ... covering `datePlayed`, `title`, `summary`, `events` ... `sessionNumber`, `milestone`, `newLevel`"
  - Design decision: Decision 1 (scope excludes `sessionNumber`/`milestone`/`newLevel`) + Decision 2/3 (bounds and event shape for the four fields actually covered)
  - Validation approach: unit tests on `sessionLogSubmissionSchema` directly (valid/invalid cases per field); route-level tests confirming `sessionNumber` fallback behavior is unchanged.
- Proposal element: "Extract a shared `zodErrorResponse` helper ... apply it to both the new `sessions` route code and the two existing duplicated inline blocks in `rolls/route.ts`"
  - Design decision: Decision 4
  - Validation approach: existing `tests/unit/api/campaigns/[id]/rolls.route.test.ts` must continue to pass unmodified (proves byte-identical extraction); new `tests/unit/lib/server/zodErrorResponse.test.ts` covers the helper directly.
- Proposal element: "Reuse `lib/server/readBoundedJson.ts` in `sessions/route.ts` with a new `SESSION_BODY_MAX_BYTES` constant"
  - Design decision: mirrors `rolls/route.ts`'s `ROLL_BODY_MAX_BYTES` (16 KiB) pattern; session logs carry more free text (`summary` up to 10,000 chars vs. roll's ~2 KiB payload), so `SESSION_BODY_MAX_BYTES` is set to `64 * 1024` (64 KiB) — comfortably above the worst case of max-bounded `title` + `summary` + 200 events × max `description`, with headroom.
  - Validation approach: test an oversized-body request returns 413, mirroring `rolls.route.test.ts`'s equivalent case.
- Proposal element: "Rewrite the body-parsing/validation portion of `POST /api/campaigns/[id]/sessions` ... leaving the `getNextSessionNumber` fallback branch and everything after it untouched"
  - Design decision: Decision 1
  - Validation approach: diff review confirms no line inside/after the `getNextSessionNumber` try/catch changes; existing tests covering `SESSION_NUMBER_UNAVAILABLE` (503) continue to pass unmodified.

## Functional Requirements Mapping

- Requirement: reject `datePlayed` that does not parse to a valid date
  - Design element: Decision 2, `datePlayed: z.coerce.date()`
  - Acceptance criteria reference: specs — Scenario "Reject unparseable datePlayed"
  - Testability notes: unit test posting `datePlayed: 'not-a-date'` expects 400 with a `datePlayed`-scoped message.
- Requirement: reject oversized `title`/`summary`
  - Design element: Decision 2 bounds
  - Acceptance criteria reference: specs — Scenario "Reject oversized title/summary"
  - Testability notes: unit tests posting strings one character over each bound expect 400; at-bound strings succeed.
- Requirement: reject malformed `events` elements
  - Design element: Decision 3, `sessionEventSchema`
  - Acceptance criteria reference: specs — Scenario "Reject malformed event"
  - Testability notes: unit tests for missing `description`, invalid `type` enum value, non-array `events`.
- Requirement: reject oversized `events` array
  - Design element: Decision 2, `.max(200)`
  - Acceptance criteria reference: specs — Scenario "Reject oversized events array"
  - Testability notes: unit test posting 201 events expects 400; 200 succeeds.
- Requirement: `sessionNumber`/`milestone`/`newLevel`/`getNextSessionNumber` fallback behavior unchanged
  - Design element: Decision 1
  - Acceptance criteria reference: specs — Scenario "sessionNumber fallback still resolves on invalid/missing sessionNumber" (regression, not new behavior)
  - Testability notes: existing tests covering this path re-run unmodified; no new assertions needed beyond confirming they still pass.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: bound the request body size before JSON parsing, consistent with `rolls` route
  - Design element: `readBoundedJson` reuse, `SESSION_BODY_MAX_BYTES`
  - Acceptance criteria reference: specs — Scenario "Reject oversized request body"
  - Testability notes: unit test with a body exceeding `SESSION_BODY_MAX_BYTES` expects 413.
- Requirement category: reliability
  - Requirement: error responses are deterministic and field-scoped (not a generic 500) for all new validation failures
  - Design element: Decision 4, `zodErrorResponse`
  - Acceptance criteria reference: specs — all "Reject ..." scenarios assert 400 + message shape
  - Testability notes: covered by the same tests as the functional requirements above; no separate test needed.

## Risks / Trade-offs

- Risk/trade-off: two validation styles (zod for new fields, inline checks for `sessionNumber`/`milestone`/`newLevel`) coexist in one route handler.
  - Impact: slightly less uniform code; a future reader must know why the split exists.
  - Mitigation: Decision 1's rationale is recorded here and should be referenced in a code comment at the split point in `sessions/route.ts`.
- Risk/trade-off: extracting `zodErrorResponse` touches `rolls/route.ts`, a file outside this change's nominal target.
  - Impact: any regression there is unrelated to #562 but caused by this change.
  - Mitigation: covered by Decision 4's validation approach — existing `rolls.route.test.ts` must pass unmodified as a hard gate before this change is considered done.

## Rollback / Mitigation

- Rollback trigger: post-deploy discovery that legitimate session-log writes (manual or auto-captured) are being rejected by the new bounds/schema, or that `rolls` route behavior regressed.
- Rollback steps: revert the PR (single change, no data migration performed, so a straight `git revert` is safe); no feature flag is introduced since this is a validation-only hardening change with no user-facing toggle.
- Data migration considerations: none — no existing `SessionLog` documents are read, rewritten, or migrated by this change; only new/edited writes pass through the new validation.
- Verification after rollback: confirm `POST /api/campaigns/[id]/sessions` and `POST /api/campaigns/[id]/rolls` both return to pre-change behavior via their respective route test suites.

## Operational Blocking Policy

- If CI checks fail: fix the failing check before proceeding; do not merge with a failing suite. Given the change is validation-only and test-covered, a CI failure indicates either a bound is wrong (adjust per Decision 2) or the `zodErrorResponse` extraction broke `rolls` route behavior (fix per Decision 4's equivalence requirement) — not a reason to bypass.
- If security checks fail (e.g. Verity gate re-flags this file): treat as a real finding and fix; do not waive without a human-approved, cited reason per this repo's CLAUDE.md quality-gate policy.
- If required reviews are blocked/stale: follow the repo's standard PR process; no special exception for this change.
- Escalation path and timeout: no change-specific timeout; follow standard repo review cadence. This is a small, self-contained hardening change with no external dependency to wait on.

## Open Questions

- None. All ambiguity from the originating `/opsx:explore` session (bound values, `events` array max, `readBoundedJson`/error-helper reuse) was resolved by the requester before this proposal was authored.
