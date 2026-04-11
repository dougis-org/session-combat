---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the
`cleanup-typescript-test-noise-phase-1` change. All work should follow a strict
TDD (Test-Driven Development) process.

Phase 1 test coverage is limited to the non-D&D failure set. The D&D Beyond
fixture-contract work tracked in `#138` is not part of this test plan.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write or
   adjust a test that captures the current type or behavioral requirement. Run
   the relevant command and ensure it fails.
2. **Write code to pass the test:** Write the smallest possible test/helper
   change to make the failure pass.
3. **Refactor:** Improve clarity and remove duplication while keeping the test
   green and the typecheck clean.

## Test Cases

- [x] **Task 3.1 / Spec MODIFIED combat contracts**
  Add or adjust failing checks so
  `tests/unit/combat/conditionExpiry.test.ts` and
  `tests/unit/combat/damageResistance.test.ts` reflect the current
  `CombatantState` and `ActiveDamageEffect` contracts, then confirm the suites
  pass and the typecheck errors disappear.
- [x] **Task 3.2 / Spec MODIFIED helper and import-route contracts**
  Add or adjust failing checks so
  `tests/unit/helpers/route.test.helpers.ts`,
  `tests/unit/import/characterImportRoute.test.ts`, and
  `tests/unit/import/charactersPageImport.test.ts` use the current auth, async,
  and response-mock contracts, then confirm the suites pass and the typecheck
  errors disappear.
- [x] **Task 3.3 / Spec MODIFIED env and optional-property hygiene**
  Add or adjust failing checks so
  `tests/unit/import/dndBeyondCharacterServer.test.ts` avoids direct read-only
  env mutation and `tests/integration/monsterUpload.test.ts` narrows optional
  properties safely, then confirm the suites pass and the typecheck errors
  disappear.
- [x] **Task 4.2 / Spec ADDED phase-bounded cleanup**
  Run `npx tsc --noEmit` and verify that the phase 1 non-D&D failures are gone
  while any remaining D&D Beyond fixture failures are attributable to `#138`.
- [x] **Task 4.3 / Non-functional reliability**
  Run `npm run lint` and any targeted validation commands used for the touched
  suites, then record the commands and outcomes for PR traceability.
