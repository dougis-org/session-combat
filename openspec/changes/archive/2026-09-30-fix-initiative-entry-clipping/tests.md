---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-initiative-entry-clipping` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

Component tests live in `tests/unit/combat/initiativeEntry.test.tsx`; hook tests next to the existing `useInitiativeModal` tests under `tests/unit/`.

- [ ] Task 1 / "Focused entry input shows its full border": the scroll container (ancestor of the controls column) has class `p-1` and no longer relies on `pr-1` alone
- [ ] Task 1 / "Tall content still scrolls": the scroll container still has `max-h-[70vh]` and `overflow-y-auto`
- [ ] Task 2 / "Dice mode fills the width": in dice mode the entry row and inner flex have `w-full min-w-0`, the input has `min-w-0 flex-1`, and the row does not have `flex-col`
- [ ] Task 2 / "Total mode fills the width": same assertions in total mode
- [ ] Task 3 / "Re-clamp after mode change": clicking "Enter Dice Roll" and "Enter Total" calls `onModeChange` with `'dice'` / `'total'`; no call when the prop is omitted (no error)
- [ ] Task 4 / "Switching to a taller mode near the viewport bottom": with a mocked `getBoundingClientRect` that grows after the mode change, invoking the re-measure moves `top` up so the bottom edge is at least 16px inside the viewport
- [ ] Task 4 / "Re-measure with an unmounted modal": invoking the re-measure with no modal ref is a no-op and does not throw
- [ ] Task 4 / regression: the existing open-time clamp tests still pass after extracting the clamp function
- [ ] Task 6 / manual: Playwright check at narrow card width that the focused input's full border is visible and the entry row fills the width
