## GitHub Issues

- #562

## Why

- Problem statement: `POST /api/campaigns/[id]/sessions` (`app/api/campaigns/[id]/sessions/route.ts:24`) reads `datePlayed`, `title`, `summary`, `events`, `milestone`, `newLevel` from the request body with only ad-hoc `typeof`/`Array.isArray` checks. `datePlayed` is passed straight to `new Date(datePlayed)` with no rejection of unparseable input; `events` array elements are never validated against the `SessionEvent` shape; `title`/`summary` have no length bound.
- Why now: flagged by the Verity quality gate while implementing `fix-get-next-session-number-fallback`; confirmed via `git blame` to be pre-existing and unrelated to that change, so it was deferred here rather than fixed inline.
- Business/user impact: a malformed or malicious payload (invalid date string, oversized text, malformed event objects) is currently persisted as-is via `storage.saveSessionLog`, corrupting session-log data and giving no useful 400 feedback to the client. No known exploit reported; this is a hardening/data-integrity fix, not an active-incident response.

## Problem Space

- Current behavior: route destructures `body` from `request.json()` with no size bound, applies inline `typeof`/`Array.isArray` guards per field, defaults invalid values to `undefined`/`[]` rather than rejecting the request, and always returns 201 unless `datePlayed` is falsy.
- Desired behavior: reject the request with 400 and a specific message when `datePlayed` doesn't parse to a valid date, `title`/`summary` exceed bounds, or any `events` element doesn't match the `SessionEvent` shape — mirroring the `rollSubmissionSchema` / `rolls/route.ts` pattern already established for `POST /api/campaigns/[id]/rolls`.
- Constraints:
  - Must not touch the `getNextSessionNumber` / `SESSION_NUMBER_UNAVAILABLE` (503) branch — out of scope per the issue and already covered by its own tests.
  - Must not change `SessionLog` / `SessionEvent` / `SessionLogInput` types in `lib/types.ts` — validation is additive at the route boundary, not a data-model change.
  - Existing valid payloads (as produced by `app/campaigns/[id]/sessions/page.tsx` and the combat-event auto-capture path) must continue to succeed unchanged.
- Assumptions:
  - No existing UI-side length constraint to align to — confirmed by inspection of `app/campaigns/[id]/sessions/page.tsx:237-299` (no `maxLength` on title/summary/custom-event inputs). Bounds below are new server-side ceilings, not codifications of existing limits.
  - `events` array in the current UI form only ever produces `type: 'custom'` entries with a `description`; the fuller `SessionEvent` shape (`encounterId`, `rounds`, `completedAt`, etc.) is populated by the combat-event auto-capture path (`openspec/specs/session-journal-integration/session-journal-integration.md`). The schema must accept the full `SessionEvent` shape, not just the manual-form subset.
- Edge cases considered:
  - `datePlayed` as a syntactically valid but semantically odd date (e.g. far future/past) — not rejected; only unparseable strings are rejected. Range validation is not requested by the issue and is treated as a non-goal.
  - `events` omitted entirely — treated as `[]`, matching current behavior.
  - `milestone`/`newLevel` — unchanged; issue does not flag these, and they are already narrowly typed (`boolean`, positive integer) in the current handler.
  - Body larger than any reasonable session log (e.g. multi-MB payload) — closed by reusing `readBoundedJson` with a new size constant, consistent with the `rolls` route's existing precedent.

## Scope

### In Scope

- New `lib/validation/sessionLog.ts` module: a zod schema (`sessionLogSubmissionSchema` or similar) covering `datePlayed`, `title`, `summary`, `events` (each element validated against the `SessionEvent` shape), `sessionNumber`, `milestone`, `newLevel`.
- Extract a shared `zodErrorResponse(error: ZodError)` helper (exact home TBD in design.md) that converts a zod validation failure into the existing `{ error: "<field>: <message>" }` / 400 response shape, and apply it to both the new `sessions` route code and the two existing duplicated inline blocks in `app/api/campaigns/[id]/rolls/route.ts` (POST and GET).
- Reuse `lib/server/readBoundedJson.ts` in `sessions/route.ts` with a new `SESSION_BODY_MAX_BYTES` constant, replacing the current unbounded `request.json()` call.
- Rewrite the body-parsing/validation portion of `POST /api/campaigns/[id]/sessions` to use `readBoundedJson` + `sessionLogSubmissionSchema.safeParse` + `zodErrorResponse`, leaving the `getNextSessionNumber` fallback branch and everything after it untouched.
- Unit tests for the new schema module and updated route behavior (400 cases for invalid `datePlayed`, oversized `title`/`summary`, malformed `events`, oversized `events` array, oversized body); regression tests confirming existing valid payloads still succeed.

### Out of Scope

- The `getNextSessionNumber` / `SESSION_NUMBER_UNAVAILABLE` (503) code path — explicitly excluded per the issue's scope note.
- `PATCH`/`PUT`/`DELETE` handlers for session logs, if any exist elsewhere — this change touches only the `POST` handler.
- Changes to `SessionLog`, `SessionEvent`, or `SessionLogInput` type definitions in `lib/types.ts`.
- UI-side form changes (e.g. adding `maxLength` to the title/summary inputs) — server-side validation is the fix; client-side UX polish is a separate concern.
- Broader validation-helper consolidation beyond the specific `zodErrorResponse` duplication identified between `rolls` and `sessions` routes (e.g. auditing every other route for similar ad-hoc validation) — flagged as a possible follow-up, not undertaken here.

## What Changes

- Add `lib/validation/sessionLog.ts` (new file) with the zod schema and inferred type, following the `rollSubmission.ts` style (documented bound rationale, `zod`-only imports, no `next/*`/storage imports).
- Add a shared zod-error-to-400-response helper and update `app/api/campaigns/[id]/rolls/route.ts` to use it in place of its two existing inline blocks (pure refactor, no behavior change there).
- Modify `app/api/campaigns/[id]/sessions/route.ts`: replace `request.json()` + inline field checks with `readBoundedJson` + `sessionLogSubmissionSchema.safeParse` + shared error helper, ahead of the untouched `getNextSessionNumber` branch.
- Add/extend unit tests under `tests/unit/lib/validation/sessionLog.test.ts` and `tests/unit/api/campaigns/[id]/sessions.route.test.ts` (or existing equivalents).

## Risks

- Risk: New length/array-size bounds reject a currently-valid but unusually large payload from an existing campaign's session-log data (e.g. a very long summary written before this change).
  - Impact: Editing/re-saving that session log would newly fail with 400 where it previously succeeded.
  - Mitigation: Bounds are chosen with generous headroom (10,000 chars for `summary`, 200 for `title`, 200 array elements / 2,000 chars per event description) — see design.md for the derivation. This only affects new writes; existing stored data is not touched or migrated.
- Risk: Extracting `zodErrorResponse` and rewiring `rolls/route.ts` to use it introduces a regression in the roll-submission endpoint, which is unrelated to issue #562.
  - Impact: Roll submission (`POST /api/campaigns/[id]/rolls`) breaks or changes its error-response format.
  - Mitigation: The helper's behavior must be verified byte-for-byte equivalent to the current inline logic via the existing `rolls.route.test.ts` suite (no test changes expected there beyond confirming pass), plus the new `zodErrorResponse` unit tests.
- Risk: `SessionEvent`'s `type` enum (`'npc_joined' | 'npc_left' | 'combat_completed' | 'custom'`) or optional-field set drifts from what the auto-capture path actually sends, causing valid auto-captured events to be rejected.
  - Impact: Combat-event auto-capture (`combat-event-auto-capture` change) silently fails to save events going forward.
  - Mitigation: Schema is derived directly from the `SessionEvent` interface in `lib/types.ts:689-700`; design.md will cross-check field-by-field, and tests will include a fixture matching the auto-capture path's actual event shape.

## Open Questions

- Question: none blocking. This proposal was developed through an `/opsx:explore` session against issue #562 in which the user confirmed: (1) start with the suggested bounds and validate them against UI constraints — done, no UI constraint exists, so bounds are new; (2) add a max bound to the `events` array — accepted; (3) reuse `readBoundedJson`/centralize error-response handling wherever possible, accepting that this may require extracting a shared helper — accepted, scoped above to the `rolls`/`sessions` duplication specifically.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Rate-limiting or abuse prevention beyond body-size/field bounds (already out of scope for the underlying issue).
- Retroactively validating or migrating existing `SessionLog` documents already stored in the database.
- A general-purpose "every API route should use zod" initiative — this change fixes the specific route flagged in #562 and refactors the one concrete duplication it creates with the existing `rolls` route.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
