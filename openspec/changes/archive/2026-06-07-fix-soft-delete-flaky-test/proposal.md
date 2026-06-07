## GitHub Issues

- #386

## Why

- **Problem statement:** The `Character Soft Delete API Integration > DELETE /api/characters/{id} > should return 404 when accessing deleted character detail` test intermittently fails in CI with `Expected: 404, Received: 200`. Three distinct defects contribute: a concurrency gap in database initialization, a silent failure in the delete operation, and missing assertions in the test.
- **Why now:** The failure was first observed in PR #385 (a docs-only branch), meaning it can block unrelated PRs. Leaving it unresolved degrades CI signal and erodes confidence in the integration test suite.
- **Business/user impact:** Intermittent CI failures force manual re-triggers, slow down delivery, and mask real regressions when they happen to co-occur with the flake.

## Problem Space

- **Current behavior:**
  1. `connectToDatabase()` in `lib/db.ts` has no concurrency guard. Multiple simultaneous requests (common with parallel test workers at server startup) all pass the `cachedClient && cachedDb` check and each call `initializeDatabase()`. The second call drops and recreates the `characters_active` MongoDB view, creating a window where the view does not exist. During this window `loadCharacters` falls back to a direct collection query.
  2. `deleteCharacter()` in `lib/storage.ts` calls `updateOne({ id, userId }, { $set: { deletedAt: new Date() } })` but never checks `matchedCount`. If the update matches 0 documents for any reason, the function returns void, the DELETE endpoint returns HTTP 200, and the character is never actually soft-deleted.
  3. The 404 test does not assert the status of the POST (create) or DELETE responses. If either silently fails, the test continues with incorrect state and produces a confusing assertion failure.
- **Desired behavior:**
  1. `connectToDatabase()` serialises concurrent callers so `initializeDatabase()` runs exactly once per process lifetime.
  2. `deleteCharacter()` throws if no document was matched, causing the DELETE endpoint to return 500 instead of a misleading 200.
  3. The 404 test asserts POST returns 201 and DELETE returns 200 before checking the final GET.
- **Constraints:** Changes must not alter the external API contract (HTTP status codes for happy paths) or break existing tests.
- **Assumptions:**
  - The `characters_active` view is always correct once created; the only problem is the drop/recreate race.
  - The MongoDB instance used in integration tests is standalone (no replica set), so read-your-own-writes is guaranteed once a write is acknowledged.
- **Edge cases considered:**
  - A character that does not exist (already deleted or wrong ID): `deleteCharacter` will now throw, which is the correct signal to callers.
  - Concurrent DELETE requests for the same character: the second call will match 0 documents and now throws. The DELETE endpoint should return 404 for that case. This is handled by the existing ownership check in the route before `deleteCharacter` is called, so the behaviour is unchanged for valid concurrency scenarios.

## Scope

### In Scope

- `lib/db.ts`: add a module-level promise mutex to `connectToDatabase`
- `lib/storage.ts`: add `matchedCount` guard to `deleteCharacter`
- `tests/integration/characters/softDelete.integration.test.ts`: add status assertions on POST and DELETE in the failing test

### Out of Scope

- Changes to any other storage methods (e.g., `deleteEncounter`, `deleteParty`)
- Changes to the `characters_active` view definition or filter pipeline
- Adding retries or polling to integration tests
- Changing MongoDB write-concern settings

## What Changes

- `lib/db.ts`: `connectToDatabase` stores its work in a module-level `Promise` on first call; subsequent concurrent calls await the same promise instead of starting parallel initialization.
- `lib/storage.ts`: `deleteCharacter` reads `result.matchedCount` after `updateOne` and throws `Error('Character not found')` when it is 0.
- `tests/integration/characters/softDelete.integration.test.ts`: the "should return 404 when accessing deleted character detail" test adds `expect(createRes.status).toBe(201)` and `expect(deleteRes.status).toBe(200)` before the final assertion.

## Risks

- **Risk:** The `matchedCount` guard in `deleteCharacter` changes error-path behaviour.
  - **Impact:** Any caller that previously observed a silent no-op on a missing character will now receive a thrown error. In the current codebase the only direct caller is the DELETE route, which already returns 404 if `loadCharacters` does not find the character (ownership check before `deleteCharacter` is called), so `matchedCount === 0` should never be reached via the normal path.
  - **Mitigation:** Review all callers of `deleteCharacter` before implementing; confirm the ownership pre-check means `matchedCount === 0` is only reachable via a true bug or race.

- **Risk:** The promise mutex in `connectToDatabase` caches the rejected promise on first failure.
  - **Impact:** If the initial connection attempt fails (e.g., MongoDB not yet ready), all subsequent callers will receive the same rejection and the server will be unable to recover without a restart.
  - **Mitigation:** Clear `connectionPromise` on rejection so the next caller retries. This is standard practice for this pattern.

## Open Questions

No unresolved ambiguity exists. All three fixes are self-contained and have been fully scoped from existing code analysis.

## Non-Goals

- Fixing other potentially-flaky integration tests unrelated to soft delete
- Changing `deleteCharacter` to return the deleted document
- Adding soft-delete support to encounters, parties, or campaigns

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
