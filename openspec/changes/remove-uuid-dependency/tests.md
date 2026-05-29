---
name: tests
description: Tests for the remove-uuid-dependency change
---

# Tests

## Overview

This change is a pure dependency swap — no new logic is introduced and no existing tests need to be written or modified. The existing test suites (`npm run test:unit` and `npm run test:integration`) serve as the regression gate. This document maps the acceptance scenarios from `specs/uuid-generation/spec.md` to the existing test coverage and defines the grep-based structural checks that verify the migration.

## Testing Steps

For this change, the TDD cycle is:

1. **Fail:** Confirm existing tests still reference uuid import paths (they currently pass; after removing the package, any missed import would cause a type/module error — that's the "red" signal).
2. **Pass:** Apply each file migration; confirm `npm run test:unit` and `npm run build` remain green.
3. **Refactor:** Run the grep verification to confirm zero uuid references remain.

## Test Cases

### Task: Migrate source files

- [ ] **TC-01** — `lib/api/spell-helpers.ts` builds without error after import swap
  - Spec scenario: Spell helper generates a valid UUID id
  - Verification: `npx tsc --noEmit` passes; `npm run build` passes

- [ ] **TC-02** — `lib/import/transformMonster.ts` builds without error after import swap
  - Spec scenario: Monster import generates a valid UUID id
  - Verification: `npx tsc --noEmit` passes; `npm run build` passes

- [ ] **TC-03** — `lib/import/transformSpell.ts` builds without error after import swap
  - Spec scenario: Spell transform generates a valid UUID id
  - Verification: `npx tsc --noEmit` passes; `npm run build` passes

### Task: Migrate test helpers

- [ ] **TC-04** — `tests/e2e/helpers/actions.ts` compiles without error after import swap
  - Spec scenario: E2E test action helper generates a UUID
  - Verification: `npx tsc --noEmit` passes

- [ ] **TC-05** — `tests/e2e/helpers/isolation.ts` compiles and hyphen-strip produces a 32-char hex string
  - Spec scenario: E2E isolation token strips hyphens correctly
  - Verification: `npx tsc --noEmit` passes; E2E isolation logic is exercised in `npm run test:integration`

### Task: Remove the packages

- [ ] **TC-06** — `package.json` contains no `uuid` key after removal
  - Spec scenario: No uuid references remain after migration (operability)
  - Verification: `grep "uuid" package.json` returns zero matches

- [ ] **TC-07** — `npm install` exits with code 0 after package removal
  - Spec scenario: Package install succeeds cleanly
  - Verification: `npm install` returns exit code 0; `package-lock.json` contains no `uuid` entries

### Task: Structural verification

- [ ] **TC-08** — Zero source files import from `"uuid"` after migration
  - Spec scenario: No uuid references remain after migration
  - Verification command:
    ```
    grep -r "from 'uuid'\|from \"uuid\"\|require('uuid')\|require(\"uuid\")" \
      --include="*.ts" --include="*.tsx" --include="*.js" \
      . --exclude-dir=node_modules --exclude-dir=.next
    ```
    Must return empty output.

### Regression gate

- [ ] **TC-09** — All unit tests pass: `npm run test:unit` (121 suites)
- [ ] **TC-10** — All integration tests pass: `npm run test:integration` (19 suites)
- [ ] **TC-11** — Build succeeds: `npm run build`
