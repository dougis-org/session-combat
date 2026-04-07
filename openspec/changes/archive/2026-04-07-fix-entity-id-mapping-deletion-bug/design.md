## Context

- Relevant architecture: `lib/storage.ts` is the single data-access layer for all MongoDB operations. Every API route calls `storage.load*()` to hydrate entities from the DB, then passes entity IDs to `storage.delete*()`. The mismatch between what `load*` returns and what `delete*` queries is entirely contained in this file.
- Dependencies: MongoDB driver (native `deleteOne`/`updateOne`); Next.js API routes at `app/api/parties/[id]/route.ts`, `app/api/encounters/[id]/route.ts`, `app/api/monsters/[id]/route.ts`, `app/api/monsters/global/[id]/route.ts`.
- Interfaces/contracts touched: The public `id` field of `Party`, `Encounter`, and `MonsterTemplate` objects returned from `load*` functions. After the fix, these will consistently be UUID strings instead of ObjectId strings. All callers (API routes and the UI) already treat `id` as an opaque string, so no callers need changes.

## Goals / Non-Goals

### Goals

- Make `loadParties`, `loadEncounters`, `loadMonsterTemplates`, and `loadGlobalMonsterTemplates` return entities whose `id` is the UUID stored in the document's `id` field (falling back to `_id.toString()` only when `id` is absent)
- Ensure `deleteOne({ id, userId })` in all delete storage functions matches documents correctly
- Strengthen E2E deletion test assertions to guard against future "API returns 200 but does nothing" regressions

### Non-Goals

- Changing the ID strategy (UUID vs ObjectId)
- Modifying `saveParty` dual-query logic (#125)
- Fixing the admin global template userId bug (#126)
- Modifying `loadCharacters` (already correct)

## Decisions

### Decision 1: Fix the ordering at the loader, not the delete function

- Chosen: Change `id: _id?.toString() || id` → `id: id || _id?.toString()` in each broken loader
- Alternatives considered:
  - Fix `deleteParty`/`deleteEncounter`/`deleteMonsterTemplate` to query by `_id` (ObjectId) instead of `id` — would require passing and parsing ObjectId strings in delete functions, adding complexity and diverging from the existing pattern
  - Normalise IDs at the API route boundary instead of in storage — spreads the fix across 4+ route files instead of 4 lines in one file
- Rationale: The loader is the single point where the DB document is projected into the app domain. Fixing it there keeps all callers correct by default. The `loadCharacters` function already establishes this as the canonical pattern with its comment "prefer explicit id field, fallback to _id".
- Trade-offs: Requires confidence that all documents have a `id` UUID field. The fallback `|| _id?.toString()` handles any that don't, making this safe regardless.

### Decision 2: Add a response-body assertion to the E2E deletion test

- Chosen: In `tests/e2e/parties.spec.ts`, verify the DELETE response body contains `{ message: 'Party deleted successfully' }` (or similar) AND that `deletedCount` is implicitly nonzero by confirming the party is gone. The existing `toHaveCount(0)` check at line 167 is correct but can be paired with an explicit check that the UI list updates (no optimistic removal), confirming the server actually deleted the record.
- Alternatives considered: Unit-test `storage.deleteParty` directly against a real MongoDB test instance — valid but out of scope for this change
- Rationale: The existing test should already fail with the bug (it asserts the party is gone), which confirms it is a good regression guard. Adding no new assertions is acceptable if the existing test proves sufficient after the fix.
- Trade-offs: E2E tests are slower than unit tests; acceptable given this is a critical user-facing operation.

## Proposal to Design Mapping

- Proposal element: Fix `id` mapping order in `loadParties` (line 114)
  - Design decision: Decision 1 (fix at the loader)
  - Validation approach: E2E party deletion test passes; party is absent from list after delete
- Proposal element: Fix `id` mapping order in `loadEncounters` (line 30)
  - Design decision: Decision 1
  - Validation approach: Manual smoke test; no E2E deletion test for encounters currently exists (out of scope to add)
- Proposal element: Fix `id` mapping order in `loadMonsterTemplates` (line 133)
  - Design decision: Decision 1
  - Validation approach: Manual smoke test for user-owned monster template deletion
- Proposal element: Fix `id` mapping order in `loadGlobalMonsterTemplates` (line 152)
  - Design decision: Decision 1
  - Validation approach: Fix applied for consistency; full validation of admin delete blocked by #126 (out of scope)
- Proposal element: Strengthen E2E deletion assertions
  - Design decision: Decision 2
  - Validation approach: Run `parties.spec.ts` before fix (should fail), run after fix (should pass)

## Functional Requirements Mapping

- Requirement: Deleting a party removes it from the database and from the UI list
  - Design element: `loadParties` fix (Decision 1) + existing E2E test
  - Acceptance criteria reference: `specs/party-deletion/spec.md`
  - Testability notes: E2E test in `tests/e2e/parties.spec.ts` "Party deletion" describe block
- Requirement: Deleting an encounter removes it from the database
  - Design element: `loadEncounters` fix (Decision 1)
  - Acceptance criteria reference: `specs/encounter-deletion/spec.md`
  - Testability notes: No existing E2E deletion test for encounters; manual verification acceptable for this change
- Requirement: Deleting a user monster template removes it from the database
  - Design element: `loadMonsterTemplates` fix (Decision 1)
  - Acceptance criteria reference: `specs/monster-template-deletion/spec.md`
  - Testability notes: Manual verification; no E2E deletion test currently
- Requirement: The fix must not regress existing create/read/edit flows
  - Design element: All four loader fixes preserve the `|| _id?.toString()` fallback
  - Acceptance criteria reference: Existing passing tests continue to pass
  - Testability notes: Full E2E suite run after implementation

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Delete operations must be idempotent and not silently fail
  - Design element: Correct `id` field in `deleteOne` query
  - Acceptance criteria reference: `specs/party-deletion/spec.md` — AC: API returns 200 only when `deletedCount >= 1`
  - Testability notes: Currently the API does not check `deletedCount`; this is noted but adding that check is out of scope (a separate hardening opportunity)
- Requirement category: operability
  - Requirement: Change is safe to deploy with zero downtime; no migration required
  - Design element: Fix is backward-compatible; `|| _id?.toString()` fallback handles any documents missing `id`
  - Testability notes: No migration step; deploy and verify

## Risks / Trade-offs

- Risk/trade-off: Documents missing the `id` UUID field exist in production
  - Impact: Fallback returns `_id.toString()`, same as current broken behavior for those specific documents — no regression
  - Mitigation: Tracked in #125; safe to ship before audit completes
- Risk/trade-off: Tests were passing before (with the bug) due to test-environment differences
  - Impact: If tests run against a mock DB that doesn't store `id` fields, the fix may appear correct without the test actually exercising the real code path
  - Mitigation: Confirm E2E tests run against real MongoDB in CI; the test suite uses `registerUser`/`createParty` helpers against the actual stack

## Rollback / Mitigation

- Rollback trigger: Party/encounter/monster template UI stops showing records after the fix (would indicate `id` field is genuinely absent in production documents)
- Rollback steps: Revert the four-line change in `lib/storage.ts`; no DB changes to undo
- Data migration considerations: None — no data is modified by this change
- Verification after rollback: Confirm records load correctly; re-open #123 and file data-audit issue to check document schema

## Operational Blocking Policy

- If CI checks fail: Do not merge; investigate and fix before proceeding
- If security checks fail: Block merge; escalate to repo owner
- If required reviews are blocked/stale: Ping reviewer after 48 hours; escalate to repo owner after 96 hours
- Escalation path and timeout: Repo owner (dougis) is sole approver; no timeout beyond above

## Open Questions

No open questions. All design decisions are fully resolved.
