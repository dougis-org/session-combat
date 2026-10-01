---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `issue-798-roll-all-monsters-initiative` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1.1: `sortCombatants` Updates
- [ ] Test that two unrolled combatants sort `monster` before `player`.
- [ ] Test that one unrolled and one rolled combatant sort unrolled first.
- [ ] Test that two rolled combatants still sort `player` before `monster` on ties.

### Task 1.2: `rollUnrolledMonsters`
- [ ] Test that calling `rollUnrolledMonsters()` generates rolls for all unrolled monsters.
- [ ] Test that `rollUnrolledMonsters()` ignores players and already-rolled monsters.
- [ ] Test that passing advantage to `rollUnrolledMonsters(true, 0)` correctly propagates to the `buildInitiativeRoll` call.

### Task 2.1 & 2.2: `InitiativeEntry` UI
- [ ] Test that `ActiveCombatView` passes `unrolledMonsterCount` to `InitiativeEntry` properly.
- [ ] Test that `InitiativeEntry` renders the batch roll button when `combatant.type === 'monster'` and `unrolledMonsterCount > 1`.
- [ ] Test that the batch roll button is hidden if `unrolledMonsterCount <= 1` or if `combatant.type !== 'monster'`.
- [ ] Test that clicking the batch roll button calls `onRollAllMonsters` with the current `advantage` and `flatBonus` state.
