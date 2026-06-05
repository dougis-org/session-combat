---
name: tests
description: Tests for the centralize-admin-helper change
---

# Tests

## Overview

This document outlines the test cases for the `centralize-admin-helper` change. All work follows a strict TDD (Test-Driven Development) workflow using our existing integration test runner.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test**: Modify the integration tests to import and call `makeUserAdmin` before the helper is implemented. Run the tests and ensure they fail/throw compilation or reference errors.
2. **Write code to pass the test**: Implement the `makeUserAdmin` helper to connect, update the database, and disconnect.
3. **Refactor**: Clean up implementation, verify no connection handles are leaked, and ensure all integration tests pass cleanly.

## Test Cases

### BDD/TDD Test Cases

- [x] **TC-1: Compile and Reference Failure (Task 3 / Task 4)**
  - *Description*: Verify that modifying the test files (`permissions.test.ts` and `campaign-global-api.integration.test.ts`) to use `makeUserAdmin` results in a test suite failure or typecheck error prior to the helper's implementation.
  - *Verification command*: `npm run test:integration tests/integration/permissions.test.ts tests/integration/campaign-global-api.integration.test.ts` (should fail/throw)

### Implementation Test Cases

- [x] **TC-2: Successful Admin Promotion (Task 5)**
  - *Description*: Verify that calling `makeUserAdmin` successfully finds a user and updates their `isAdmin` flag to `true`.
  - *Verification*: Covered by the success scenarios in `permissions.test.ts` ("returns true for admin user") and `campaign-global-api.integration.test.ts` ("admin creates template...").
  - *Verification command*: `npm run test:integration tests/integration/permissions.test.ts`

- [x] **TC-3: Missing User Failure (Task 5)**
  - *Description*: Verify that calling `makeUserAdmin` with a valid ObjectId string for a non-existent user throws a clear error.
  - *Verification*: Handled by checking `matchedCount === 0` and throwing an error. Can be validated by adding a temporary unit/assertion check or verification logic.

- [x] **TC-4: Permissions Test Suite Success (Task 6)**
  - *Description*: Verify that the entire permissions integration test suite compiles, runs, and passes with zero errors using the centralized helper.
  - *Verification command*: `npm run test:integration tests/integration/permissions.test.ts`

- [x] **TC-5: Campaign Global API Test Suite Success (Task 6)**
  - *Description*: Verify that the entire campaign global API integration test suite compiles, runs, and passes with zero errors using the centralized helper.
  - *Verification command*: `npm run test:integration tests/integration/campaign-global-api.integration.test.ts`
