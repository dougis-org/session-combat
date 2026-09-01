---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `surface-start-session-button` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Task 1: Update `SessionControl` state management
  - [ ] Write a test that mounts `<SessionControl initialSessionId="123" />` and verifies it displays "End Session".
  - [ ] Write a test that simulates a `session` event via `useCampaignStream` and verifies the button state updates from "Start Session" to "End Session" automatically.
- [ ] Task 2: Update `CampaignLayout`
  - [ ] Verify that `CampaignLayout` renders `<SessionControl>` without passing `onSessionChange`.
- [ ] Task 3: Display `SessionControl` in `SessionsContent`
  - [ ] Write a test for `SessionsPage.tsx` where the context has no active session. Verify the "Start Session" button is rendered.
  - [ ] Write a test for `SessionsPage.tsx` where the context has an active session. Verify the "Start Session" button is NOT rendered in the main content area.
