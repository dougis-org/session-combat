---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-monster-import-tests` change. All work should follow a strict TDD (Test-Driven Development) process. Since this feature is entirely focused on adding E2E tests, the tests themselves are the feature implementation. We will write failing test shells first and then implement the assertions and actions.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] Write failing test shell for `tests/e2e/monsters.spec.ts` valid JSON import
- [x] Implement and pass valid JSON import test
- [x] Write failing test shell for `tests/e2e/monsters.spec.ts` invalid JSON import
- [x] Implement and pass invalid JSON import test
- [x] Write failing test shell for `tests/e2e/monsters.spec.ts` 5MB file limit rejection
- [x] Implement and pass 5MB file limit rejection test
- [x] Write failing test shell for `tests/e2e/encounters.spec.ts` create encounter with imported monster
- [x] Implement and pass create encounter with imported monster test
