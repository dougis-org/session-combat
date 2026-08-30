---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `enhance-dice-roll-modal` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write unit test for `DiceRollOverlay` to ensure it renders `<p>` with `text-2xl` sizing for `built.formula` instead of `text-xs`.
- [ ] Write unit test for `DiceRollOverlay` to ensure it maps over `built.breakdown` and renders the correct `<Dice...Icon>` components with their rolled values centered, for standard rolls.
- [ ] Write unit test for `DiceRollOverlay` to ensure it renders two `<DiceD10Icon>` components for a percentile roll (checking for `built.percentileFaces`), one for the tens digit and one for the ones digit.
- [ ] Write unit test for `GlobalDiceFab` to ensure that `dp.reset()` is called correctly after `performRoll` is dispatched. This could involve mocking `useDicePoolState` or verifying the UI clears its selected counts immediately after rolling.
