---
name: tests
description: Tests for migrate-test-auth-to-withauth-factory
---

# Tests

## Overview

This change is a test-only migration — there is no new application code to test. The "tests" are the migrated unit tests themselves, verified by running the Jest suite. TDD here means: make the migration change, run the test file, confirm it still passes (green), then move to the next file.

## Testing Steps

For each task in `tasks.md`, the cycle is:

1. **Confirm baseline:** Run the target file's tests before touching it — they should pass (even if testing the wrong thing).
2. **Apply migration:** Update mock factory, remove `requireAuth` references, remove 401 call sites, drop last arg from helper calls.
3. **Run and verify green:** Run the file's tests. All non-401 tests must pass; the deleted 401 tests simply no longer exist.

## Test Cases

### Task 1 — Shared helpers (`route.test.helpers.ts`)

- [x] `npx tsc --noEmit` fails with downstream call-site errors (expected — confirms the signature change took effect)
- [x] After completing Tasks 2–9, `npx tsc --noEmit` is clean (all call sites updated)

### Task 2 — Campaigns tests

- [x] `npx jest tests/unit/api/campaigns/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in any campaigns test file (`grep "requireAuth" tests/unit/api/campaigns/` → empty)
- [x] No `itReturns401` call in any campaigns test file

### Task 3 — Characters tests

- [x] `npx jest tests/unit/api/characters/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in characters test files

### Task 4 — Combat tests

- [x] `npx jest tests/unit/api/combat/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in combat test files

### Task 5 — Content tests

- [x] `npx jest tests/unit/api/content/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in content test files

### Task 6 — Encounters tests

- [x] `npx jest tests/unit/api/encounters/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in encounters test files

### Task 7 — Monsters tests

- [x] `npx jest tests/unit/api/monsters/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in monsters route test files — **exception:** `global.route.test.ts` legitimately mocks `requireAuth` because `global/route.ts` calls `requireAdmin` which calls `requireAuth` directly (not via `withAuth`)

### Task 8 — Parties test

- [x] `npx jest tests/unit/api/parties/ --no-coverage` passes after migration
- [x] No `requireAuth` reference in parties test files

### Task 9 — Miscellaneous tests

- [x] `npx jest tests/unit/import/ tests/unit/storage/ tests/unit/lib/api-helpers.test.ts --no-coverage` passes
- [x] `characterImportRoute.test.ts` factory no longer references `requireAuth` internally

### Task 10 — Final acceptance

- [x] `grep -rn "requireAuth" tests/unit/ | grep -v middleware.test.ts` → 2 exceptions: `api-helpers.test.ts` and `global.route.test.ts` (both legitimately mock `requireAuth` for `requireAdmin`; see tasks.md note)
- [x] `grep -rn "itReturns401" tests/unit/` → zero output
- [x] `npx tsc --noEmit` → clean
- [x] `npx jest --config jest.config.js tests/unit --no-coverage` → all pass (1891 tests, 0 failures)
