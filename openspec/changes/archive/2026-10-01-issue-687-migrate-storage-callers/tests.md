---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `issue-687-migrate-storage-callers` change. This is a refactoring change, so instead of writing new behavior tests, we are updating existing test files to mock the correct dependencies and ensuring the existing test suite continues to pass.

## Testing Steps

For each task in `tasks.md`:

1.  **Run existing tests:** Run `npm run test:unit` to ensure everything currently passes.
2.  **Apply refactor:** Apply the import and route handler changes (Task 1).
3.  **Run failing tests:** Run tests to see them fail (because they are still mocking `storage.ts`).
4.  **Fix mocks:** Update the unit test files to mock `sessionLogRepo` and `rollRepo` (Task 2).
5.  **Verify:** Run `npm run test:unit` to ensure everything passes again.

## Test Cases

- [ ] `tests/unit/api/campaigns/[id]/rolls.route.test.ts`: Mock `rollRepo` instead of `storage`. Verify all existing roll endpoint tests pass (maps to Task 2.1).
- [ ] `tests/unit/api/campaigns/sessions.route.test.ts`: Mock `sessionLogRepo` instead of `storage`. Verify existing session tests pass (maps to Task 2.2).
- [ ] `tests/unit/api/campaigns/sessions.id.route.test.ts`: Mock `sessionLogRepo` instead of `storage`. Verify existing session tests pass (maps to Task 2.2).
- [ ] `tests/unit/api/campaigns/[id]/sessions/active.route.test.ts`: Mock `sessionLogRepo` instead of `storage`. Verify existing session tests pass (maps to Task 2.2).
- [ ] `tests/unit/storage/sessionLog.test.ts`: Import from `sessionLogRepo` directly instead of via the `storage` facade. Verify the direct repo tests pass (maps to Task 2.2).
