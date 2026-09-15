---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `combatant-card-semantic-grouping` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Ensure `CombatantCardHeader` test expects the elements to be wrapped in the semantic `div`s with `data-card-section="identity-stats"`.
- [ ] Ensure `HpControls` test expects the components to be wrapped in a `data-card-section="hp-controls"` div.
- [ ] Ensure `InitiativeControl` test expects its layout wrapper to include `data-card-section="initiative"`.
- [ ] Ensure `CombatantCard` layout test expects the outer top-level row to have `flex-wrap` and includes a placeholder div for `data-card-section="quick-rolls"`.
