---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the
`align-dnd-beyond-fixture-contracts` change. All work should follow a strict
TDD (Test-Driven Development) process.

This change is limited to the D&D Beyond fixture-contract failures tracked in
`#138`. It must not rely on weakening production types to make the tests pass.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing implementation changes, reproduce
   the current typing failure with `npx tsc --noEmit` or a targeted import test.
2. **Write code to pass the test:** Make the smallest fixture/test-only change
   that restores contract alignment.
3. **Refactor:** Reduce duplication and keep type-safe patterns readable without
   changing runtime behavior.

## Test Cases

- [ ] **Task 2 / shared fixture contract**
  Reproduce that the shared fixture in `tests/fixtures/dndBeyondCharacter.ts`
  fails assignability against the current import contract, then update the
  fixture typing and confirm targeted import tests still pass.
- [ ] **Task 3 / modifier and action override unions**
  Reproduce the current widening failures in
  `tests/unit/import/dndBeyondCharacterImport.test.ts` for modifier and action
  overrides, then confirm the suite compiles and preserves the intended
  assertions after refactoring.
- [ ] **Task 4 / optional normalized-field narrowing**
  Reproduce the `TS18048` failures for `senses`, `savingThrows`, and `skills`,
  then confirm the updated assertions narrow explicitly and keep the same
  expected values.
- [ ] **Task 6 / repo-wide typecheck validation**
  Run `npx tsc --noEmit` and confirm the D&D Beyond fixture-related failures
  described in #138 no longer appear.
- [ ] **Validation / lint and build**
  Run `npm run lint` and `npm run build` after the cleanup to confirm the
  fixture/test alignment does not create broader project regressions.
