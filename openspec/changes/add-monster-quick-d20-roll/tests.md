---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-monster-quick-d20-roll` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

New test file: `tests/unit/components/CombatantCard.quickRoll.test.tsx`

- [ ] **Test 1 — Button renders for a monster combatant.** Render `CombatantCard` with `combatant.type: 'monster'`; assert the `quick-rolls` section contains a button with an accessible name referencing the d20/attack roll.
  - Maps to task: "Populate the existing `data-card-section=\"quick-rolls\"` slot..." (tasks.md, Execution)
  - Maps to spec scenario: "Scenario: Monster card renders the quick-roll button" (specs/monster-quick-roll/spec.md)

- [ ] **Test 2 — Button absent for a player combatant.** Render `CombatantCard` with `combatant.type: 'player'`; assert no quick-roll button is present in the `quick-rolls` section.
  - Maps to task: same as Test 1
  - Maps to spec scenario: "Scenario: Non-monster combatant does not render the quick-roll button"

- [ ] **Test 3 — Button absent for a lair combatant.** Render `CombatantCard` with `combatant.type: 'lair'`; assert no quick-roll button is present in the `quick-rolls` section.
  - Maps to task: same as Test 1
  - Maps to spec scenario: "Scenario: Non-monster combatant does not render the quick-roll button"

- [ ] **Test 4 — Click rolls and immediately shows an unmodified d20 result.** Mock `rollDie` to return a fixed value (e.g. `[14]`); render a monster card, click the quick-roll button; assert a result modal is shown synchronously (no animation gating) with formula `1d20` and total `14`.
  - Maps to task: "On button click: roll via `rollDie(20)[0]`..." and "Render `<DiceRollOverlay .../>`..." (tasks.md, Execution)
  - Maps to spec scenario: "Scenario: Quick roll shows an immediate unmodified d20 result"

- [ ] **Test 5 — Quick roll never triggers a network call or chat submission.** Spy on `global.fetch` (and, if present in the render tree, any roll-submission hook/prop); click the quick-roll button; assert neither is invoked.
  - Maps to task: same as Test 4
  - Maps to spec scenario: "Scenario: Quick roll is never submitted or persisted"

- [ ] **Test 6 — Repeated clicks replace rather than stack the result.** Mock `rollDie` to return two different fixed values across two calls; click the quick-roll button twice in succession without dismissing the first modal; assert exactly one result modal is present, showing the second value.
  - Maps to task: "construct `{ formula: '1d20', ... }`... replacing (not stacking) any roll already showing" (tasks.md, Execution)
  - Maps to spec scenario: "Scenario: Repeated quick rolls replace rather than stack"

- [ ] **Test 7 — Quick roll leaves other card state untouched.** Render a monster card with preset HP, an active condition, and a pending target; click the quick-roll button and dismiss the resulting modal; assert HP, conditions, and targeting state are unchanged (existing HP/condition/targeting test helpers may be reused).
  - Maps to task: "Write unit tests... a quick roll leaves HP, conditions, targeting, and death-save state on the card unchanged" (tasks.md, Execution)
  - Maps to spec scenario: "Scenario: Quick roll does not affect other card state"

- [ ] **Test 8 — Two sibling cards have independent quick-roll state.** Render two `CombatantCard` instances (both `type: 'monster'`) side by side; click the quick-roll button on the first; assert the second card shows no result modal.
  - Maps to task: "Write unit tests... two sibling cards' quick-roll state are independent of each other" (tasks.md, Execution)
  - Maps to spec scenario (NFAC): "Scenario: Independent per-card roll state"

- [ ] **Test 9 — No animation engine is imported/mounted for a quick roll.** Assert that clicking the quick-roll button does not mount the dice canvas element (`data-testid="dice-roll-canvas"`) and that `DiceRollOverlay` is rendered with `disableAnimation` effectively true (modal appears without any `animationSettled`/`animationStatus` prop being required to flip).
  - Maps to task: "Render `<DiceRollOverlay built={activeRoll} disableAnimation .../>`" (tasks.md, Execution)
  - Maps to spec scenario (NFAC): "Scenario: No animation load is incurred"
