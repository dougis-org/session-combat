---
name: tests
description: Tests for session-invalidation-foundation
---

# Tests

## Overview

Tests for the `session-invalidation-foundation` change. All work follows strict TDD: write a failing test, confirm it fails, make it pass with the simplest code, then refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** — before any implementation code, write the test and confirm it fails.
2. **Write code to pass the test** — simplest implementation that makes it green.
3. **Refactor** — improve structure while keeping the test passing.

## Test Cases

### Task 1: `lib/types.ts` — Add `tokenVersion` to interfaces

TypeScript compilation is the test. No separate test file needed.

- [ ] `User` interface has `tokenVersion: number` — verified by TS typecheck (`npm run type-check`)
- [ ] `AuthPayload` interface has `tokenVersion: number` — verified by TS typecheck

### Task 2: `lib/auth.ts` — `generateToken()` includes `tokenVersion`

File: `tests/unit/lib/auth.test.ts` (new or update existing)

- [ ] `generateToken({ userId, email, tokenVersion: 0 })` produces a JWT whose decoded payload contains `tokenVersion: 0`
- [ ] `generateToken({ userId, email, tokenVersion: 3 })` produces a JWT whose decoded payload contains `tokenVersion: 3`
- [ ] `verifyToken()` returns an `AuthPayload` with the correct `tokenVersion` field

### Task 3: `lib/middleware.ts` — async `tokenVersion` DB check in `withAuth` / `withAuthAndParams`

File: `tests/unit/lib/middleware.test.ts` (update existing)

Update `MOCK_PAYLOAD` to include `tokenVersion: 1` throughout the test file.

**`withAuth` — tokenVersion validation:**

- [ ] Returns 401 and does not call handler when `payload.tokenVersion` does not match user document `tokenVersion` (stale token)
- [ ] Returns 401 and does not call handler when the user document is not found in the DB (deleted account)
- [ ] Calls handler with auth payload when token is valid and `tokenVersion` matches user document
- [ ] Calls handler when there is no DB mismatch (existing happy-path test updated to mock DB correctly)

**`withAuthAndParams` — tokenVersion validation:**

- [ ] Returns 401 when `payload.tokenVersion` does not match user document `tokenVersion`
- [ ] Returns 401 when the user document is not found in the DB
- [ ] Calls handler with auth payload and params when token is valid and `tokenVersion` matches

**Mock setup note:** The new DB check calls `getDatabase()` then `collection('users').findOne({ _id: userId })`. Mock `@/lib/db` with `getDatabase` returning a mock collection, similar to the pattern in `tests/unit/api/campaigns/route.test.ts`.

### Task 4: Mark `requireAuth` / `verifyAuth` as `@deprecated`

No test needed — this is a JSDoc annotation. Confirm existing `requireAuth` / `verifyAuth` tests still pass after the annotation is added.

### Task 5: `app/api/auth/login/route.ts` — reads `tokenVersion` from user doc

File: `tests/unit/api/auth/login.route.test.ts` (new)

- [ ] Successful login generates a token that includes the user's current `tokenVersion`
- [ ] Successful login with `tokenVersion: 0` still returns 200 (handles zero value)
- [ ] Returns 401 for unknown email (no change from current behavior)
- [ ] Returns 401 for wrong password (no change from current behavior)

**Mock setup note:** Mock `@/lib/db` to return a user document that includes `tokenVersion`. Capture the `generateToken` call argument to assert `tokenVersion` is forwarded.

### Task 6: `app/api/auth/register/route.ts` — writes `tokenVersion: 0` and passes to `generateToken()`

File: `tests/unit/api/auth/register.route.test.ts` (new)

- [ ] Successful registration inserts a user document with `tokenVersion: 0`
- [ ] Successful registration generates a token with `tokenVersion: 0` in the payload
- [ ] Returns 201 on success (no regression)
- [ ] Returns 409 if email already exists (no regression)

**Mock setup note:** Capture the `insertOne` argument to assert `tokenVersion: 0` is present. Capture the `generateToken` argument to assert `tokenVersion: 0` is forwarded.

### Task 7: Migrate ~35 `requireAuth` / `verifyAuth` callers

No new test files needed for the migration itself. The following existing tests must still pass after each migrated route is converted to `withAuth` / `withAuthAndParams`:

- [ ] `tests/unit/api/campaigns/route.test.ts` — GET, POST pass (auth mock updated if needed)
- [ ] `tests/unit/api/campaigns/[id]/route.test.ts` — all methods pass
- [ ] `tests/unit/api/campaigns/global/route.test.ts` — passes
- [ ] `tests/unit/api/campaigns/global/[id]/route.test.ts` — passes
- [ ] `tests/unit/api/campaigns/global/[id]/copy/route.test.ts` — passes
- [ ] `tests/unit/api/characters/route.test.ts` — passes
- [ ] `tests/unit/api/characters/[id]/route.test.ts` — passes
- [ ] `tests/unit/api/parties/route.test.ts` — passes

**Note:** Unit tests that mock `requireAuth` directly will need to be updated to mock `withAuth` / `withAuthAndParams` instead. Follow the pattern established in the updated `middleware.test.ts`.

### Validation tasks (Tasks 8–11)

- [ ] `npm run lint` — passes with no errors
- [ ] `npm run type-check` — passes with no errors
- [ ] `npm test` — all unit tests pass
- [ ] Integration tests pass — `npm run test:integration` (auth-protected routes still return correct responses)

### Task 12: Manual smoke test

- [ ] Register a new user → confirm login works
- [ ] Connect to MongoDB, run `db.users.updateOne({email: ...}, {$set: {tokenVersion: 999}})` to simulate invalidation
- [ ] Attempt a request with the old token → confirm 401 is returned
- [ ] Log in again → confirm new token works correctly
