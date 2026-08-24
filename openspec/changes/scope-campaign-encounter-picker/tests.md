---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `scope-campaign-encounter-picker` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### `useCombat.test.ts`

- [ ] Test case: `useCombat` fetches `/api/campaigns/${campaignId}/encounters` when `campaignId` is present in the options.
- [ ] Test case: `useCombat` fetches `/api/encounters` when `campaignId` is not present in the options.

### `CombatSetupView.test.tsx`

- [ ] Test case: Renders the normal "From Library" dropdown when `campaignId` is provided and the `encounters` list is not empty.
- [ ] Test case: Renders the actionable empty state (message + link to manage encounters) when `campaignId` is provided and the `encounters` list is empty.
- [ ] Test case: Renders the normal "From Library" dropdown (empty but present) when `campaignId` is missing and the `encounters` list is empty.
- [ ] Test case: Renders without crashing if `encounters` is null or undefined (graceful fallback).
