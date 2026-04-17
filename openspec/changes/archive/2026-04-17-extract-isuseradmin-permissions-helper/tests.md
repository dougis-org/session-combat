---
name: tests
description: Tests for extract-isuseradmin-permissions-helper
---

# Tests

## Overview

Tests for extracting `isUserAdmin` into `lib/permissions.ts`. All work follows strict TDD: failing test first, implement to pass, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 2 — Integration test for `isUserAdmin` (write BEFORE implementation)

File: `tests/integration/permissions.test.ts`
Maps to: specs/permissions/spec.md (all ADDED scenarios)

- [ ] **Admin user returns `true`**
  - Seed: register user via API, set `isAdmin: true` directly in MongoDB `users` collection
  - Call `isUserAdmin(userId)` directly
  - Assert: returns `true`
  - Spec: "Admin user lookup succeeds"

- [ ] **Non-admin user returns `false`**
  - Seed: register user via API (no `isAdmin` flag)
  - Call `isUserAdmin(userId)`
  - Assert: returns `false`
  - Spec: "Non-admin user lookup succeeds"

- [ ] **Unknown userId returns `false`**
  - Use a valid ObjectId that does not exist in the `users` collection
  - Call `isUserAdmin(userId)`
  - Assert: returns `false`
  - Spec: "User not found"

- [ ] **Invalid ObjectId format returns `null`**
  - Call `isUserAdmin("not-a-valid-objectid")`
  - Assert: returns `null`
  - Spec: "Invalid ObjectId format"

### Task 1 — `lib/permissions.ts` (implement against failing tests above)

- [ ] TypeScript compiles with `boolean | null` return type
  - Run: `npx tsc --noEmit`
  - Assert: no errors on `lib/permissions.ts` import in route files

### Tasks 3 & 4 — Route files (verify no regression)

File: `tests/integration/monsters.integration.test.ts` (existing)
Maps to: specs/routes/spec.md (MODIFIED requirement)

- [ ] **Existing monster route integration tests still pass after route edits**
  - Run: `npm run test:integration`
  - Assert: all tests in `monsters.integration.test.ts` pass unchanged
  - Spec: "Behavior unchanged for admin/non-admin user"

- [ ] **No local `isUserAdmin` definitions remain**
  - Run: `grep -r "function isUserAdmin" app/`
  - Assert: empty output
  - Spec: REMOVED requirement

### Validation commands (run in order)

```bash
npx tsc --noEmit
npm run test:unit
npm run test:integration
npm run build
grep -r "function isUserAdmin" app/    # must return empty
```
