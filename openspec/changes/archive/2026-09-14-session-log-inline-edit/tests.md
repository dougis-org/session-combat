---
name: tests
description: Tests for inline session editing
---

# Tests

## Overview

This document outlines the tests for the `session-log-inline-edit` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Write a component test for `SessionsContent` showing that clicking "+ New Session" renders `SessionForm` at the top of the list.
- [ ] Write a component test for `SessionsContent` showing that clicking "Edit" on a session card renders `SessionForm` inline in place of that card.
- [ ] Write a component test showing that when editing a session, the top-level `SessionForm` is *not* rendered.
