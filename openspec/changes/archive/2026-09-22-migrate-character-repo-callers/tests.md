---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-character-repo-callers` change. All work should follow a strict TDD (Test-Driven Development) process. Because T1–T6 are pure import/call-site renames with no behavior change, "failing test first" here means: write/adjust the 401/404 regression assertions and the `characterRepo` mock against the *current* (pre-migration) code first — where applicable they should already pass against `storage`-backed behavior — then perform the import swap and confirm the same assertions still pass unchanged. The meaningful "red" state for T7's new assertions is verified by temporarily reverting the import swap locally (or checking the assertion fails against a broken mock) before confirming green against the real migration.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1 — `app/api/characters/route.ts`

- [ ] Test case: existing GET/POST functional tests continue passing after the import swap (no new test needed; regression guard on Decision 2's "no argument change" claim) — maps to task T1, scenario "Pure character route imports characterRepo directly"
- [ ] Test case: test file's `storage` mock for this route is updated/replaced with a `characterRepo` mock (`loadCharacters`, `saveCharacter`) so existing assertions exercise the new import path, not a stale mock of the old one — maps to task T1

### T2 — `app/api/characters/[id]/route.ts`

- [ ] Test case: GET returns 401 when unauthenticated — maps to task T2 and T7, spec scenario NFAC "No change to existing error handling"
- [ ] Test case: GET returns 404 (not another user's character) when `auth.userId` does not own the requested character `id` — maps to task T2 and T7, spec scenario "Pure character route imports characterRepo directly"
- [ ] Test case: PUT/PATCH (update) returns 401 when unauthenticated — maps to task T2 and T7
- [ ] Test case: PUT/PATCH returns 404 for a character not owned by `auth.userId` — maps to task T2 and T7
- [ ] Test case: DELETE returns 401 when unauthenticated — maps to task T2 and T7
- [ ] Test case: DELETE returns 404 for a character not owned by `auth.userId` (and does not delete another user's character) — maps to task T2 and T7
- [ ] Test case: existing functional tests (successful GET/PUT/DELETE) continue passing after the import swap — maps to task T2

### T3 — `app/api/characters/import/route.ts`

- [ ] Test case: POST returns 401 when unauthenticated — maps to task T3 and T7
- [ ] Test case: existing import-flow functional tests continue passing after the import swap (dedupe-against-existing-characters logic, which reads via `loadCharacters`, is unaffected) — maps to task T3

### T4 — `app/api/campaigns/[id]/characters/[cid]/route.ts`

- [ ] Test case: existing tests for `storage.getMember`-gated ownership (non-member returns 403/404 per current behavior) continue passing unmodified, proving the retained `storage` import still works — maps to task T4, spec scenario "Mixed route keeps storage import alongside characterRepo import"
- [ ] Test case: DELETE (unshare) returns 401 when unauthenticated — maps to task T4 and T7
- [ ] Test case: the `loadCharacterById` call site is verified (via mock assertion or integration test) to be invoked through the `characterRepo` import, not `storage` — maps to task T4

### T5 — `app/api/campaigns/[id]/characters/route.ts`

- [ ] Test case: existing tests for `storage.getMember`/`addShare`/`listSharesForCampaign`/`buildSharedCharacterEntries` continue passing unmodified, proving the retained `storage` import still works — maps to task T5, spec scenario "Mixed route keeps storage import alongside characterRepo import"
- [ ] Test case: POST (share) returns 401 when unauthenticated — maps to task T5 and T7
- [ ] Test case: POST (share) returns 404 when the target `characterId` (looked up via `loadCharacterById`) is not owned by `auth.userId` — maps to task T5 and T7
- [ ] Test case: the `loadCharacterById` call site is verified to be invoked through the `characterRepo` import, not `storage` — maps to task T5

### T6 — `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`

- [ ] Test case: existing tests for `storage.getMember` (both call sites), `storage.loadPartiesByCampaign`, `storage.saveParty` continue passing unmodified, proving the retained `storage` import still works — maps to task T6, spec scenario "Mixed route keeps storage import alongside characterRepo import"
- [ ] Test case: the route's handler returns 401 when unauthenticated — maps to task T6 and T7
- [ ] Test case: the `loadCharacters(memberId)` call site is verified to be invoked through the `characterRepo` import, not `storage` — maps to task T6

### T7 — Regression tests (cross-cutting)

- [ ] Test case: for each of the six routes, a single grep/lint-style check (or manual diff review during Pre-Commit Code Review) confirms no `storage.<characterMethod>` calls remain for the migrated methods in that file — maps to task T7, design.md Decision 2
- [ ] Test case: for the three mixed routes (T4–T6), confirm the `storage` import statement is still present and still used by at least one non-character call — maps to task T7, spec scenario "Mixed route keeps storage import alongside characterRepo import"
- [ ] Test case: `npm run typecheck` passes with zero errors after all six files are edited (catches any missed import or signature mismatch) — maps to tasks T1–T6, Validation section of tasks.md
