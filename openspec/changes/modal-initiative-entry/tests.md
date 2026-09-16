---
name: tests
description: Tests for modal-initiative-entry change
---

# Tests

## Overview

This document outlines the tests for the `modal-initiative-entry` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write test for Sub-task 1: `sortCombatants` correctly orders combatants with `!initiativeRoll` at the top of the list.
- [ ] Write test for Sub-task 1: `getDisplayCombatants` returns a unified sorted list when combat starts (no fallback to separate Party/Enemies array).
- [ ] Write test for Sub-task 2: `CombatantCardHeader` calls `onSetInitiative` with the correct ID and a `top`/`left` payload.
- [ ] Write test for Sub-task 2: `ActiveCombatView` renders the `InitiativeEntry` in a floating overlay container anchored to the passed `top`/`left` coordinates when `initiativeEditId` is active.
- [ ] Write test for Sub-task 3: `setInitiativeRoll` automatically updates `initiativeEditId` to the next unrolled combatant ID if one exists.
- [ ] Write test for Sub-task 3: Auto-advance stops and clears state if the DM explicitly hits "Close" on the modal overlay.
- [ ] Write test for Sub-task 4: Assert that any logic related to the old `zeroInitiative` block in `ActiveCombatView` is no longer present.
