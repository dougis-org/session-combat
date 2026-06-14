---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-audit-cves` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [x] **Test Case 1 for Task "Test Definition (TDD step)"**: Run `npm audit --audit-level=high`. Verify that it exits with a non-zero exit code due to existing vulnerabilities in the dependency tree. This represents the failing test.
- [x] **Test Case 2 for Tasks "Modify package.json" and "Regenerate lockfile"**: Run `npm audit --audit-level=high` after upgrading packages. Verify that it exits with code 0.
- [x] **Test Case 3 for Task "Confirm acceptance criteria"**: Run the project's integration test suite (`npm run test:ci` or similar) to ensure the `MongoDBContainer` starts successfully with testcontainers v12 and there are no runtime regressions.
