---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `confirm-dialog-hook-and-focus-order` change. All work follows strict TDD: write the failing test, observe it fail, implement, refactor. No implementation for a task starts until its tests exist and fail.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test** capturing the requirement; run it and confirm it fails.
2.  **Write the simplest code** to pass.
3.  **Refactor** while keeping tests green.

## Test Cases

Unit tests use Jest + React Testing Library (`npm run test:unit`).

### Task 1 — Modal `closeButtonTabbable` (`tests/unit/components/Modal.test.tsx`; spec: modal "Default unchanged", "Opt-out")

- [x] T1: default — close button has no `tabindex="-1"`
- [x] T2: `closeButtonTabbable={false}` — close button has `tabindex="-1"` and click still calls `onClose` once

### Task 2 — ConfirmDialog (`tests/unit/components/ConfirmDialog.test.tsx`; spec: confirm-dialog "Positive action…", "Dialog variant")

- [x] T3: confirm button precedes cancel in DOM order
- [x] T4: confirm button has focus on open (`toHaveFocus`)
- [x] T5: Tab from initial focus moves to cancel; "×" has `tabindex="-1"`
- [x] T6: "×" click and Escape still call `onCancel` only
- [x] T7: default variant → confirm `bg-green-600`, cancel `bg-red-600` (existing assertion kept)
- [x] T8: `variant="danger"` → confirm `bg-red-600`, cancel `bg-gray-600`

### Task 3 — `useConfirmDialog` (`tests/unit/hooks/useConfirmDialog.test.tsx`; spec: confirm-dialog "useConfirmDialog hook")

- [x] T9: no dialog before `confirm()` is called
- [x] T10: `confirm()` opens dialog with given title/message/labels/variant
- [x] T11: confirm click closes the dialog and calls `onConfirm` exactly once
- [x] T12: cancel via button, "×", Escape, overlay closes without calling `onConfirm`
- [x] T13: two hook instances open simultaneously have distinct `aria-labelledby` ids, each matching one element

### Task 4 — ActiveCombatView refactor (`tests/unit/components/ActiveCombatView.test.tsx`; spec: confirm-dialog "End Combat via hook")

- [x] T14: End Combat click opens dialog and does not call `endCombat`
- [x] T15: confirm calls `endCombat` once
- [x] T16: "Return to Combat" leaves combat running; auto-end prompt (derived) still renders with fixed `titleId`

### Task 5 — E2E (`tests/e2e/combat-core.spec.ts`; run on a free port, not 3000)

- [x] T17: End Combat flow still passes using `data-testid` selectors
- [x] T18: after opening the End Combat dialog, the confirm button is focused and one Tab reaches cancel
