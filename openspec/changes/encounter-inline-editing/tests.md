---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `encounter-inline-editing` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] (E2E) Test that clicking Edit on a global encounter opens the editor inline, replacing the card.
- [ ] (E2E) Test that canceling the inline edit restores the original global encounter card.
- [ ] (E2E) Test that clicking Edit on a campaign encounter opens the editor inline, replacing the card.
- [ ] (E2E) Test that clicking Add New Encounter opens the editor at the top of the list for both global and campaign encounter pages.
- [ ] (Unit) Test `EncountersContent` conditionally maps `EncounterEditor` when `editingEncounter.id === encounter.id`.
- [ ] (Unit) Test `EncountersManagementContent` conditionally maps `EncounterEditor` when `editingEncounter.id === encounter.id`.
