---
name: tests
description: Tests for decouple-parties
---

# Tests

## Overview

This document outlines the tests for the `decouple-parties` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Test case for Task 1 & 2: Verify TypeScript compilation succeeds after updating `Campaign` and `Party` interfaces in `lib/types.ts`.
- [ ] Test case for Task 3: Verify `storage.deleteCampaign` deletes a Campaign but does NOT delete the associated Parties from the database. (Integration Test)
- [ ] Test case for Task 4: Verify `loadPartiesByCampaign` returns parties mapped in `Campaign.partyIds`.
- [ ] Test case for Task 4: Verify `loadPartiesByCampaign` correctly handles legacy parties using `campaignId` when `Campaign.partyIds` is empty or undefined.
- [ ] Test case for Task 5: Verify API routes (e.g., party creation or assignment) correctly push the Party ID into the `Campaign.partyIds` array.
