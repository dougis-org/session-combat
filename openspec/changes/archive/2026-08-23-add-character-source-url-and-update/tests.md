---
name: tests
description: Tests for the add-character-source-url-and-update change
---

# Tests

## Overview

This document outlines the tests for the `add-character-source-url-and-update` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task: Add `externalSync` to `Character` interface in `lib/types.ts`
- [ ] Write a type-level unit test (if applicable) or verify compilation when using `externalSync`.

### Task: Modify `POST /api/characters/import` route to save `externalSync` data
- [ ] **T1:** Unit/Integration test: importing a new character successfully adds the `externalSync` block containing the correct `provider` and `url`.
- [ ] **T2:** Unit/Integration test: re-importing an existing character with `overwrite: true` successfully updates the character stats AND correctly preserves/updates the `externalSync` block.

### Task: Create a "Sync from D&D Beyond" button and warning modal UI component
- [ ] **T3:** Component test: Button is only rendered if `character.externalSync` exists and provider is "dndbeyond".
- [ ] **T4:** Component test: Clicking the sync button opens the warning modal.
- [ ] **T5:** Component test: The modal correctly informs the user that local changes will be lost.

### Task: Connect the modal's Confirm action to trigger `POST /api/characters/import`
- [ ] **T6:** E2E/Integration test: Clicking Confirm on the warning modal sends a POST request with the character's `externalSync.url` and `overwrite: true`.
- [ ] **T7:** E2E/Integration test: Upon successful request, the UI updates with the newly fetched stats and the modal closes.
- [ ] **T8:** E2E/Integration test: If the request fails, the original data is unchanged and an error toast is displayed.
