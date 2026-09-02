---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-active-session-claim` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write a unit or integration test simulating `storage.saveSessionLog` failure during the `POST /api/campaigns/[id]/sessions/active` route.
  - Assert that the response is a 500 status code.
  - Assert that `storage.setActiveCampaignSession` was called with `null` to rollback the claim.
  - Assert that `campaign.activeSessionId` is effectively cleared in the mocked database or return values.
