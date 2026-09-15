---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `skip-downed-monster-turn` change.
All work should follow a strict TDD (Test-Driven Development) process. All
new cases below extend the existing `nextTurn` coverage in
`tests/unit/hooks/useCombat.test.ts`.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write
    a test that captures the requirements of the task. Run the test and
    ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to
    make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the
    test still passes.

## Test Cases

- [ ] **TC1 — Monster at 0 HP is skipped.** Task: T1, T2. Spec scenario:
  "Monster at 0 HP is skipped". Given combatants `[A (player), B (monster,
  0 hp), C (player)]`, current turn `A`; call `nextTurn()`; assert
  `currentTurnIndex` now points to `C`, not `B`.
- [ ] **TC2 — Consecutive downed monsters are all skipped.** Task: T2.
  Spec scenario: "Consecutive downed monsters are all skipped". Given
  combatants `[A (player), B (monster, 0 hp), C (monster, 0 hp), D
  (player)]`, current turn `A`; call `nextTurn()`; assert
  `currentTurnIndex` points to `D`.
- [ ] **TC3 — Player at 0 HP keeps their turn.** Task: T1. Spec scenario:
  "Player at 0 HP keeps their turn". Given combatants `[A (player), B
  (player, hp: 0, lifeState: 'dying')]`, current turn `A`; call
  `nextTurn()`; assert `currentTurnIndex` points to `B` (not skipped).
- [ ] **TC4 — Lair combatant is never skipped.** Task: T1. Spec scenario:
  "Lair combatant is never skipped". Given combatants `[A (player), L
  (lair), B (player)]`, current turn `A`; call `nextTurn()`; assert
  `currentTurnIndex` points to `L` (not skipped) regardless of `L.hp`.
- [ ] **TC5 — Skip crosses the round wrap.** Task: T2. Spec scenario:
  "Skip crosses the round wrap". Given combatants `[A (player), B
  (monster, 0 hp)]` on round `1`, current turn `A`; call `nextTurn()`;
  assert `currentTurnIndex` wraps back to `A`'s index (`0`), `currentRound`
  is exactly `2` (incremented once, not twice), and the existing
  round-end/condition-expiry path (`processRoundEnd`) ran exactly once.
- [ ] **TC6 — Every remaining combatant is a downed monster: no-op +
  alert.** Task: T3. Spec scenario: "Every remaining combatant is a downed
  monster". Given combatants `[A (monster, 0 hp), B (monster, 0 hp)]`,
  current turn `A`; call `nextTurn()`; assert `currentTurnIndex`,
  `currentRound`, and both combatants' state are byte-for-byte unchanged
  from before the call, and `window.alert` (or the project's mocked
  equivalent) was called with a message indicating no combatant can act.
- [ ] **TC7 — Legendary-action pool reset targets only the final landing
  combatant.** Task: T2. Spec scenario: "Skipped monster's legendary pool
  is untouched". Given combatants `[A (player), B (monster, 0 hp,
  legendaryActionCount: 2, legendaryActionsRemaining: 0), C (monster,
  legendaryActionCount: 3, legendaryActionsRemaining: 1)]`, current turn
  `A`; call `nextTurn()`; assert `currentTurnIndex` points to `C`,
  `C.legendaryActionsRemaining === C.legendaryActionCount` (reset), and
  `B.legendaryActionsRemaining` is still `0` (untouched).
- [ ] **TC8 — Healed monster resumes its normal turn.** Task: T2. Spec
  scenario: "Healed monster resumes its normal turn". Given a combatant
  `M` (monster) previously skipped while `hp: 0`; update `M.hp` to `5`
  (simulating a heal applied between turns, e.g. via `updateCombatant`);
  call `nextTurn()` up to the point in initiative order where `M` is next;
  assert `currentTurnIndex` lands on `M` (no longer skipped) with no other
  special-cased state required.
- [ ] **TC9 — Defensive: empty/degenerate combatants list does not
  hang.** Task: T2, T3 (NFAC "Turn advancement never loops
  unboundedly"). Given a `combatState` with an empty `combatants` array (or
  a single downed-monster-only entry), call `nextTurn()`; assert the call
  returns synchronously without throwing or hanging, and does not mutate
  state beyond the documented no-op + alert path.
- [ ] **TC10 — Baseline regression: normal turn advance among all-live
  combatants is unchanged.** Task: T2 (regression guard). Given combatants
  `[A (player), B (player), C (monster, hp > 0)]`, current turn `A`; call
  `nextTurn()`; assert `currentTurnIndex` points to `B` exactly as before
  this change (no skip triggered, no behavior change for the common case).
