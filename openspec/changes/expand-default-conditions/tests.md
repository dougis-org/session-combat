---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `expand-default-conditions` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1 — Add the three catalog entries (`lib/data/conditionCatalog.ts`)

- [ ] Update `tests/unit/lib/scripts/seedConditionCatalog.test.ts` first to expect 18 entries and to assert `"Slowed"`, `"Confused"`, `"Turned"` are present with non-empty descriptions (this is the failing test — see T2) — confirm it fails against the current 15-entry catalog before touching `conditionCatalog.ts`
- [ ] Add the three entries to `CONDITION_CATALOG`; re-run the test and confirm it now passes
- [ ] Maps to task: T1 (Execution)
- [ ] Maps to acceptance scenario: "New conditions present after seeding" (specs/condition-catalog/spec.md, ADDED Requirements)

### T2 — Update the hardcoded-length test (`tests/unit/lib/scripts/seedConditionCatalog.test.ts`)

- [ ] Change `expect(CONDITION_CATALOG).toHaveLength(15)` to `toHaveLength(18)`
- [ ] Add `expect(CONDITION_CATALOG.map(c => c.name)).toEqual(expect.arrayContaining(["Slowed", "Confused", "Turned"]))`
- [ ] Confirm the existing per-entry validation loop in the same test (asserting non-empty `name`/`description` for every entry) passes for the three new entries with no modification to the loop itself
- [ ] Maps to task: T2 (Execution)
- [ ] Maps to acceptance scenario: "Catalog is readable after seeding" and "Re-running the seed script is idempotent" (specs/condition-catalog/spec.md, MODIFIED Requirements)

### T3 — Grep for other hardcoded assumptions

- [ ] Run `grep -rn "toHaveLength(15)\|CONDITION_CATALOG" tests/` and manually inspect every hit not already covered by T1/T2
- [ ] For any additional hardcoded-15 or enumerated-condition-list assertion found, update it in place (extend existing test, do not duplicate)
- [ ] Re-run the full test file(s) touched and confirm green
- [ ] Maps to task: T3 (Execution)
- [ ] Maps to acceptance scenario: "Catalog is readable after seeding" (specs/condition-catalog/spec.md, MODIFIED Requirements) — ensures no other test silently encodes the old count

### T4 — Reuse-before-build / no-regression check on dependent layers

- [ ] Run `npm test -- tests/unit/lib/storage/conditionCatalogRepo.test.ts` unmodified and confirm it still passes (repo layer is shape-agnostic to catalog length; this test seeds its own mock data, independent of `CONDITION_CATALOG`)
- [ ] Run `npm test -- tests/unit/api/conditions/catalog/route.test.ts` (if present) unmodified and confirm it still passes
- [ ] Run `npm test -- tests/unit/components/combatant-card/ConditionFormModal.test.tsx tests/unit/components/combatant-card/ConditionControls.test.tsx` unmodified and confirm they still pass
- [ ] Maps to task: T4 (Execution)
- [ ] Maps to acceptance scenario: "New conditions selectable from the condition dropdown" (specs/condition-catalog/spec.md, ADDED Requirements) — confirms the existing dropdown/selection code path requires no change to support the new entries

### Full-suite regression gate

- [ ] Run `npm test` (full unit suite) — all green
- [ ] Run `npm run typecheck` — no errors
- [ ] Run `npm run build` — succeeds
- [ ] Maps to task: Validation section of tasks.md
- [ ] Maps to acceptance scenario: all scenarios in `specs/condition-catalog/spec.md` (ADDED + MODIFIED)
