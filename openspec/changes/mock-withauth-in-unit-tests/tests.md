---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `mock-withauth-in-unit-tests` change. Since the change itself is a refactoring of how authentication boundary mocks are set up, the tests verify that all unit test suites execute and pass successfully.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test case 1 for Sub-task 1 (Update route test helpers):**
  - Verify that executing `itReturns401` and `itReturns401WithParams` temporarily mutates `mockAuthState.payload` to `null` to trigger 401 rejections, and that it is fully restored to `MOCK_AUTH` after execution.
- [ ] **Test case 1 for Sub-task 2 (Update route unit test files):**
  - Verify that running `npm run test:unit` on route tests (e.g., `tests/unit/api/campaigns/route.test.ts` and `tests/unit/api/monsters/route.test.ts`) passes successfully using the state-based middleware mock factory without importing `requireAuth`.
- [ ] **Test case 1 for Sub-task 3 (Update storage & utility test files):**
  - Verify that running `npm run test:unit` on `tests/unit/lib/api-helpers.test.ts` and `tests/unit/storage/campaigns.members.test.ts` passes successfully without importing `requireAuth` from `@/lib/middleware`.
