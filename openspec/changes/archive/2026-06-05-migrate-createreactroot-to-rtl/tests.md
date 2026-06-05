---
name: tests
description: Test verification plan for migrate-createreactroot-to-rtl
---

# Tests

## Overview

This document maps acceptance scenarios to the test commands that verify them. Because this change is a test migration (not a production code change), the TDD cycle is inverted: the existing tests ARE the specification. The workflow is:

1. **Rewrite test file** to use RTL
2. **Run the file** — must pass (the test is the failing/passing signal)
3. **Refactor** if any tests needed loosening or tightening during migration

## Testing Steps

### File 1 — `tests/unit/CombatStatsRow.test.tsx`

Spec reference: `specs/rtl-migration/spec.md` — AC1, AC2

- [ ] **TDD step 1 (Red):** Before migrating, confirm tests pass with legacy pattern: `npx jest tests/unit/CombatStatsRow.test.tsx --no-coverage`
- [ ] **TDD step 2 (Green):** Migrate file; run `npx jest tests/unit/CombatStatsRow.test.tsx --no-coverage` — all 3 tests must pass
- [ ] **TDD step 3 (Verify AC2):** `grep "reactRoot" tests/unit/CombatStatsRow.test.tsx` — expect no output
- [ ] **TDD step 3 (Verify AC1):** Confirm `render` from `@testing-library/react` is imported; confirm `screen.getByText` (or equivalent) is used in assertions

### File 2 — `tests/unit/CharacterMiniSummary.test.tsx`

Spec reference: `specs/rtl-migration/spec.md` — AC1, AC2

- [ ] **TDD step 1 (Red):** Baseline: `npx jest tests/unit/CharacterMiniSummary.test.tsx --no-coverage` passes with legacy pattern
- [ ] **TDD step 2 (Green):** Migrate file; run `npx jest tests/unit/CharacterMiniSummary.test.tsx --no-coverage` — all 8 tests must pass (including `global.fetch` spy test)
- [ ] **TDD step 3 (Verify AC2):** `grep "reactRoot" tests/unit/CharacterMiniSummary.test.tsx` — expect no output
- [ ] **TDD step 3 (Verify AC1):** Confirm `screen.getByText`, `toBeInTheDocument`, `not.toBeInTheDocument` used in assertions

### File 3 — `tests/unit/LairForm.test.tsx`

Spec reference: `specs/rtl-migration/spec.md` — AC1, AC2, AC4 (userEvent)

- [ ] **TDD step 1 (Red):** Baseline: `npx jest tests/unit/LairForm.test.tsx --no-coverage` passes with legacy pattern
- [ ] **TDD step 2 (Green):** Migrate file; run `npx jest tests/unit/LairForm.test.tsx --no-coverage` — all tests must pass
- [ ] **TDD step 3 (Verify AC2):** `grep "reactRoot" tests/unit/LairForm.test.tsx` — expect no output
- [ ] **TDD step 3 (Verify AC4):** Confirm `userEvent.setup()` used per-test for click interactions; confirm `screen.getByRole('button', { name: /Add Lair/i })` used (no `querySelectorAll`)
- [ ] **TDD step 3 (Verify AC1):** Confirm `screen.getByTestId` used for `data-testid` queries

### File 4 — `tests/unit/LairActionsSlot.test.tsx`

Spec reference: `specs/rtl-migration/spec.md` — AC1, AC2, AC4 (userEvent)

- [ ] **TDD step 1 (Red):** Baseline: `npx jest tests/unit/LairActionsSlot.test.tsx --no-coverage` passes with legacy pattern
- [ ] **TDD step 2 (Green):** Migrate file; run `npx jest tests/unit/LairActionsSlot.test.tsx --no-coverage` — all tests must pass
- [ ] **TDD step 3 (Verify AC2):** `grep "reactRoot" tests/unit/LairActionsSlot.test.tsx` — expect no output
- [ ] **TDD step 3 (Verify AC4):** Confirm `userEvent.setup()` used per-test for click interactions
- [ ] **TDD step 3 (Verify AC1):** Confirm `screen.getByTestId` used in place of `container.querySelector`

### Full Suite — AC3 regression check

Spec reference: `specs/rtl-migration/spec.md` — AC3

- [ ] Run `npm run test:unit` — all tests pass, zero regressions
- [ ] Confirm `tests/unit/helpers/reactRoot.ts` still exists: `ls tests/unit/helpers/reactRoot.ts`
- [ ] Confirm `CampaignEditor.test.tsx` still imports `reactRoot`: `grep "reactRoot" tests/unit/components/CampaignEditor.test.tsx`
- [ ] Run `npm run test:integration` — all integration tests pass

### Maintainability check — AC4

Spec reference: `specs/rtl-migration/spec.md` — Non-Functional: Maintainability

- [ ] Compare any migrated file against `tests/unit/components/CombatantCard.callbacks.test.tsx` — import style, `userEvent.setup()` per test, `screen.*` queries are consistent
