---
name: tests
description: Tests for the consolidate-test-user-factory change
---

# Tests

## Overview

This change is a refactor of test helpers — no new production logic is introduced. The validation strategy is therefore structural (grep/compile checks) and behavioral (existing integration tests must continue to pass unchanged). There are no new test files to write; the test suite IS the validation.

## Testing Steps

For each task, the TDD loop is: verify the grep/compile assertion fails in current state (confirming the old pattern exists), make the change, verify the assertion passes.

## Test Cases

### Task 1 — Update `helpers/users.ts`

- [ ] **Compile check:** `tsc --noEmit` passes after changes — confirms `registerTestUser` signature is valid and `uniqueEmail` removal doesn't break anything
- [ ] **Export check:** `grep "export.*uniqueEmail\|export.*createTestUser" tests/integration/helpers/users.ts` returns zero matches
- [ ] **Import check:** `grep "createTestUser\|createTestEmail" tests/integration/helpers/users.ts` matches only the import from `auth.test.helpers.ts`
- [ ] **Behavioral:** `registerTestUser` returns `{ email, password, cookie, userId }` — confirmed by existing callers compiling and tests passing

### Task 2 — Rename call sites in 12 test files

- [ ] **No old import:** `grep -r "createTestUser" tests/integration --include="*.ts" | grep "helpers/users"` returns zero matches
- [ ] **New import present:** `grep -r "registerTestUser" tests/integration --include="*.ts"` matches all 12 files + `logout.test.ts`
- [ ] **Integration suite green:** `npm run test:integration` — all tests pass (no behavioral change, just rename)
- [ ] **Compile check:** `tsc --noEmit` passes

### Task 3 — Migrate `login.test.ts`

- [ ] **No auth setup imports:** `grep "registerUser\|createTestEmail" tests/integration/api/auth/login.test.ts` returns zero matches (excluding any `createTestUser` sync call for nonexistent-user email if used)
- [ ] **Uses `registerTestUser`:** `grep "registerTestUser" tests/integration/api/auth/login.test.ts` returns matches for each setup call
- [ ] **Login tests pass:** `npm run test:integration -- --testPathPattern=login.test` — all login tests pass

### Task 4 — Fix `register.test.ts` special-email strings

- [ ] **No collision-unsafe emails:** `grep "Date\.now()" tests/integration/api/auth/register.test.ts` shows only safe patterns (random suffix or via `createTestEmail`)
- [ ] **`createTestEmail` used:** `grep "createTestEmail" tests/integration/api/auth/register.test.ts` matches the special-email variants
- [ ] **Register tests pass:** `npm run test:integration -- --testPathPattern=register.test` — all register tests pass including the special-character and parallel-safety tests

### Task 5 — Handle `logout.test.ts`

- [ ] **No old import:** `grep "createTestUser.*helpers/users" tests/integration/api/auth/logout.test.ts` returns zero matches
- [ ] **New import present:** `grep "registerTestUser" tests/integration/api/auth/logout.test.ts` returns a match
- [ ] **Logout tests pass:** `npm run test:integration -- --testPathPattern=logout.test`

### Task 6 — Final verification (covers all tasks)

- [ ] `grep -r "createTestUser" tests/integration --include="*.ts" | grep -v "auth.test.helpers.ts\|register.test.ts"` → zero matches
- [ ] `grep -r "uniqueEmail" tests/integration --include="*.ts"` → zero matches
- [ ] No collision-unsafe email construction: `grep -r "Date\.now()[^)]*@" tests/integration --include="*.ts"` → zero matches
- [ ] `tsc --noEmit` → passes
- [ ] `npm run test:integration` → all tests pass
- [ ] `npm run build` → succeeds
