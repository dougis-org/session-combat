---
name: tests
description: Tests for the pin-dice-panel-lower-left change
---

# Tests

## Overview

This document outlines the tests for the `pin-dice-panel-lower-left` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

- [ ] Verify that when the global dice fab is opened, the panel has classes indicating absolute positioning (`absolute`, `bottom-4`, `left-4`) rather than center flex layout (Task 2.1).
- [ ] Verify that the background dimming overlay `bg-black/50` is present and clickable to close the modal (Task 2.1).
- [ ] Verify that hovering a dice button fires `onMouseEnter` and displays the custom tooltip text in the DOM, and `onMouseLeave` removes it (Task 2.2).
- [ ] Verify the absence of the native `title` attribute on the dice buttons (Task 2.2).
