---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-password-reset-emails` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write a test that mocks `sendPasswordResetEmail` and `storeResetToken` as delayed promises, and asserts that the API route does not return its response until both promises have resolved. *(Coverage for Guaranteed Execution)*
- [ ] Write a test where the email provided in the forgot password form has different casing than the registered user, and assert that the email is still sent successfully. *(Coverage for Case-Insensitive Email Lookup)*
- [ ] Write a test for a non-existent email and measure the execution time, asserting it falls within a predefined expected range that matches the successful path (or simply asserting that a dummy hash function is called). *(Coverage for Anti-Enumeration Dummy Delay)*
- [ ] Write a test where `process.env.MAILTRAP_TOKEN` is unset, and assert that the route still returns 200 OK and logs a warning instead of throwing a 500 error. *(Coverage for Missing Configuration Logging)*
