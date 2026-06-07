---
name: tests
description: Tests for the fix-soft-delete-flaky-test change
---

# Tests

## Overview

This document outlines the tests for the `fix-soft-delete-flaky-test` change. All work follows strict TDD: write a failing test first, then write the implementation to make it pass, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before touching implementation code, write a test that captures the requirement. Run it and confirm it fails.
2. **Write code to pass the test** — write the simplest implementation that makes the test pass.
3. **Refactor** — clean up without breaking the test.

---

## Task 1 — `connectToDatabase` promise mutex (`lib/db.ts`)

**Spec:** `openspec/changes/fix-soft-delete-flaky-test/specs/db-init-concurrency/spec.md`
**Test file:** `tests/unit/lib/db.test.ts` (create if it doesn't exist)

### T1-A — Concurrent callers share one initialisation

- [ ] **Given** `cachedClient`/`cachedDb` are null (module just loaded)
- [ ] **When** `connectToDatabase()` is called twice concurrently (both calls start before either resolves)
- [ ] **Then** the mocked `initializeDatabase` is invoked exactly once
- [ ] **TDD step:** Mock `MongoClient`, `db.admin().ping`, and `initializeDatabase`. Call `connectToDatabase()` twice without `await`, then `await Promise.all([call1, call2])`. Assert mock call count is 1.

### T1-B — Subsequent callers use the cache

- [ ] **Given** `connectToDatabase()` has been called and the cache is populated
- [ ] **When** `connectToDatabase()` is called again
- [ ] **Then** the result is returned immediately and `initializeDatabase` is not called again
- [ ] **TDD step:** Assert mock call count remains 1 after a second `await connectToDatabase()`.

### T1-C — Failed connection allows retry

- [ ] **Given** the first `connectToDatabase()` call rejects (MongoDB unavailable)
- [ ] **When** a second `connectToDatabase()` call is made after the rejection
- [ ] **Then** a new connection attempt is made (not the same rejected promise)
- [ ] **TDD step:** Mock `client.connect` to reject on first call, resolve on second. Assert that the second `connectToDatabase()` call succeeds and `initializeDatabase` was called once (on the successful attempt).

---

## Task 2 — `deleteCharacter` `matchedCount` guard (`lib/storage.ts`)

**Spec:** `openspec/changes/fix-soft-delete-flaky-test/specs/delete-character-not-found/spec.md`
**Test file:** `tests/unit/lib/storage.characters.test.ts` (create or extend)

### T2-A — Delete succeeds when character exists

- [ ] **Given** a mock MongoDB collection where `updateOne` returns `{ matchedCount: 1, modifiedCount: 1 }`
- [ ] **When** `deleteCharacter(id, userId)` is called
- [ ] **Then** the function resolves without error
- [ ] **TDD step:** Confirm existing happy-path test (or write one) still passes after adding the guard.

### T2-B — Delete throws when character is not found

- [ ] **Given** a mock MongoDB collection where `updateOne` returns `{ matchedCount: 0, modifiedCount: 0 }`
- [ ] **When** `deleteCharacter(id, userId)` is called
- [ ] **Then** the function throws `Error('Character not found')`
- [ ] **TDD step:** Write the test first; it fails because current code has no guard. Add guard; test passes.

### T2-C — Integration: DELETE endpoint returns 500 when character not found mid-flight

- [ ] **Given** the integration test server is running and a character exists
- [ ] **When** the character is deleted from the DB directly (bypassing the API) and then the DELETE endpoint is called via HTTP
- [ ] **Then** the DELETE endpoint returns HTTP 500 (because the ownership pre-check in `loadCharacters` still finds the character in the raw collection—it's not in the view—OR this is only exercised by a unit test; document which approach is used)
- [ ] **Note:** This scenario is more naturally covered by unit tests (T2-B). Integration coverage is provided by the overall soft-delete integration suite which still passes.

---

## Task 3 — Intermediate status assertions in 404 test (`tests/integration/characters/softDelete.integration.test.ts`)

**Spec:** `openspec/changes/fix-soft-delete-flaky-test/specs/soft-delete-test-assertions/spec.md`
**Test file:** `tests/integration/characters/softDelete.integration.test.ts` (modify existing)

### T3-A — POST assertion surfaces create failures immediately

- [ ] **Given** the "should return 404 when accessing deleted character detail" test
- [ ] **When** the POST to create the character returns a non-201 status (simulate by temporarily breaking the route or asserting against a known-good server)
- [ ] **Then** `expect(createRes.status).toBe(201)` fails at line N (not at the end of the test)
- [ ] **TDD step:** Add the assertion; confirm the test still passes end-to-end on a green server. Confirm that removing the server and re-running fails at the `201` assertion (manual verification acceptable).

### T3-B — DELETE assertion surfaces delete failures immediately

- [ ] **Given** the same test, after the character is created
- [ ] **When** the DELETE returns a non-200 status
- [ ] **Then** `expect(deleteRes.status).toBe(200)` fails at the correct line before the GET is attempted
- [ ] **TDD step:** Add the assertion; confirm full test suite still passes.

### T3-C — Full end-to-end: 404 test passes deterministically

- [ ] **Given** the integration test server is running with all three fixes applied
- [ ] **When** `npm run test:integration -- --testPathPattern="softDelete"` is run **three times** consecutively
- [ ] **Then** all runs produce green output with no intermittent 404→200 failure
- [ ] **TDD step:** This is the acceptance gate for the full change.

---

## Regression

- [ ] Run `npm run test:unit` — no existing unit tests broken
- [ ] Run `npm run test:integration` — no existing integration tests broken
- [ ] Run `npm run build` — TypeScript compiles cleanly
