---
name: tests
description: Tests for the profile-settings change
---

# Tests

## Overview

This document outlines the tests for the `profile-settings` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Test case: `isValidPreferenceValue` allows `surface` string in `schema.test.ts`
- [ ] Test case: `UserMenu.test.tsx` renders "Profile & Settings" link
- [ ] Test case: `ProfilePage.test.tsx` renders without crashing for authenticated user
- [ ] Test case: `ProfilePage.test.tsx` binds input changes to `setPreference`
- [ ] Test case: `ProfilePage.test.tsx` redirects unauthenticated user via `<ProtectedRoute>`
