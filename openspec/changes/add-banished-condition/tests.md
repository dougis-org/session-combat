---
name: tests
description: Tests for the add-banished-condition change
---

# Tests

## Overview

This document outlines the tests for the `add-banished-condition` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

Spec scenario names refer to `specs/removed-from-play-conditions/spec.md`.

### T1/T2 Catalog and seed — `tests/unit/lib/scripts/seedConditionCatalog.test.ts`

- [x] Catalog has 19 entries; seeding twice yields 19 docs, second run 0 inserted / 19 updated (spec: "Seed is idempotent at 19")
- [x] Banished entry exists with non-empty description and `removedFromPlay: true` (spec: "Banished is listed")
- [x] No entry other than Banished has `removedFromPlay` (spec: "Other entries are unchanged")
- [x] Existing "includes Slowed, Confused, and Turned" test still passes

### T3 Repo/API — `tests/unit/lib/storage/conditionCatalogRepo.test.ts`

- [x] Stored doc with `removedFromPlay: true` is returned with the flag
- [x] Stored doc without the flag (or `false`) is returned without the property
- [x] Extra stored fields (e.g. `_id`, `internal`) are not returned (spec NFAC "Catalog projection")

### T4 Modal — `tests/unit/components/combatant-card/ConditionFormModal.test.tsx`

- [x] Selecting Banished (mock catalog with flag) submits `removedFromPlay: true` (spec: "Catalog pick copies the flag")
- [x] Selecting a non-flagged entry submits no flag
- [x] Custom "Banished" typed by hand submits no flag (spec: "Custom condition named Banished is not flagged")

### T5 Helper — `tests/unit/combat/removedFromPlay.test.ts`

- [x] False for empty conditions and for unflagged conditions
- [x] True once a flagged condition is present (spec: "Set on add")
- [x] False after manual removal; false after `processRoundEnd` expires a `duration: 1` flagged condition (spec: "Cleared on removal or expiry")
- [x] Combatant fixtures lacking the field behave as before (spec NFAC "Backward compatibility")

### T6 Turn order — `tests/unit/hooks/useCombat.test.ts` (or existing nextTurn suite)

- [x] A, B(banished), C: advance from A lands on C (spec: "Next turn skips a banished combatant")
- [x] Banished first in order, advance from last wraps, increments round, lands on next eligible (spec: "Round wrap with banished combatant first")
- [x] Banished player is skipped the same as a monster
- [x] All combatants banished/downed monsters: alert shown, state unchanged, loop terminates (spec: "Nobody can act", NFAC "Bounded advancement")
- [x] Skipped combatant's legendary pool is not reset
- [x] Existing downed-monster skip tests unchanged

### T7 Unrolled exclusion — `tests/unit/hooks/useInitiativeModal.test.ts`, `tests/unit/components/ActiveCombatView.test.tsx`

- [x] Banished unrolled monster does not auto-open the modal, is excluded from `unrolledMonsterCount`, and is not rolled by `rollUnrolledMonsters` (spec: "Banished unrolled monster ignored")
- [x] After the condition is removed the monster is counted and prompts (spec: "Returns to the prompt after removal")
- [x] A rolled combatant with `initiativeRoll.total === 0` is still treated as rolled (existing behavior)

### T8 Targeting — `tests/unit/components/combatant-card/TargetingPanel.test.tsx`

- [x] Banished enemy and banished player have no checkbox in either list (spec: "Not selectable")
- [x] Existing target that becomes banished: chip hidden, `targetIds` unchanged; chip returns after removal (spec: "Existing target hidden then restored")
- [x] Non-banished lists unchanged

### T8b Target-add path — `tests/unit/components/TargetActionModal.test.tsx`, `TargetingPanel.test.tsx`

- [x] "Add Condition" calls `onRequestCondition` and no longer shows a freeform name input (replaces the old freeform-condition tests)
- [x] Selecting Banished in the shared modal adds a flagged condition with description to the target only (spec: "Banished applied to a target")
- [x] Custom name + duration 3 adds an unflagged condition with `duration: 3` (spec: "Custom and timed conditions still work")
- [x] Empty name / out-of-range duration adds nothing (spec: "Invalid input rejected")
- [x] Damage flow in `TargetActionModal` unchanged

### T9 Card presentation — `tests/unit/components/CombatantCard.*.test.tsx`

- [x] Flagged condition: card has `opacity-50` and shows "Banished" badge (spec: "Greyed card")
- [x] No flag: neither appears; dying/stable/dead greying unchanged

### T10 Sweep / regression

- [ ] Full unit suite, type check, and build pass
- [ ] E2E smoke on a non-3000 port: add Banished to a monster, Next skips it, it is absent from targeting, remove it and it returns
