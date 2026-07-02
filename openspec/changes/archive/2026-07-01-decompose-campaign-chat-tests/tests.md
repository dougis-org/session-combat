---
name: tests
description: Tests for decompose-campaign-chat-tests
---

# Tests

## Overview

This document outlines the tests for the `decompose-campaign-chat-tests` change. All work follows a strict BDD/TDD process where we structure our new test suites, verify failure/compilation or execution, write/move the test assertions to pass, and refactor any overlapping or unneeded imports.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] **Test Case 1: Setup shared helper file (Task 2)**
  - Description: Verify that helper functions (`openDock()`, `fireMsg()`, `withMembers()`) and `setupFetchMock()` are exported and function in isolation.
  - Validation: Import them in a skeleton test file and verify compilation.

- [ ] **Test Case 2: Decompose drawer tests (Task 3)**
  - Description: Run `CampaignChat.drawer.test.tsx` and verify that all 13 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx`

- [ ] **Test Case 3: Decompose SSE tests (Task 4)**
  - Description: Run `CampaignChat.sse.test.tsx` and verify that all 6 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx`

- [ ] **Test Case 4: Decompose history tests (Task 5)**
  - Description: Run `CampaignChat.history.test.tsx` and verify that all 3 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.history.test.tsx`

- [ ] **Test Case 5: Decompose unread badge tests (Task 6)**
  - Description: Run `CampaignChat.unread.test.tsx` and verify that all 4 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx`

- [ ] **Test Case 6: Decompose members tests (Task 7)**
  - Description: Run `CampaignChat.members.test.tsx` and verify that all 2 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.members.test.tsx`

- [ ] **Test Case 7: Decompose composer tests (Task 8)**
  - Description: Run `CampaignChat.composer.test.tsx` and verify that all 11 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx`

- [ ] **Test Case 8: Decompose visibility tests (Task 9)**
  - Description: Run `CampaignChat.visibility.test.tsx` and verify that all 4 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx`

- [ ] **Test Case 9: Decompose scene tests (Task 10)**
  - Description: Run `CampaignChat.scene.test.tsx` and verify that all 6 tests pass.
  - Validation: `npx jest tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx`

- [ ] **Test Case 10: Delete original test file (Task 11)**
  - Description: Confirm that `tests/unit/components/CampaignChat.test.tsx` is deleted and the entire unit test suite `npm run test:unit` passes successfully.
  - Validation: `git status` shows deletion, `npm run test:unit` passes all tests.
