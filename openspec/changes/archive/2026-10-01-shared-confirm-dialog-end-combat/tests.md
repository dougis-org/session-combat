---
name: tests
description: Tests for the shared-confirm-dialog-end-combat change
---

# Tests

## Overview

This document outlines the tests for the `shared-confirm-dialog-end-combat` change. All work follows strict TDD (Test-Driven Development): write a failing test, make it pass, refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1 — Modal `titleId` (`tests/unit/components/Modal.test.tsx`)

- [x] Default id: `Modal` without `titleId` renders title id and `aria-labelledby` = `modal-title` (spec: "Default id preserved")
- [x] Custom id: `Modal` with `titleId="custom-title"` applies it to the title element and `aria-labelledby` (spec: "Custom id applied")

### T2 — ConfirmDialog (`tests/unit/components/ConfirmDialog.test.tsx`)

- [x] Renders caller labels with green confirm (`bg-green-600`) and red cancel (`bg-red-600`) (spec: "Custom labels and colours")
- [x] Clicking confirm calls `onConfirm` once and never `onCancel` (spec: "Confirm invokes onConfirm only")
- [x] Cancel button, header "×" (aria-label "Close modal"), Escape key, and overlay click each call `onCancel` and never `onConfirm` (spec: "Cancel button, "×", Escape, and overlay all cancel")
- [x] `isOpen={false}` renders no `role="dialog"` (spec: "Closed dialog renders nothing")
- [x] Two dialogs with `titleId` `a-title` / `b-title` render distinct ids and each `aria-labelledby` resolves to its own title (spec: "Two dialogs coexist")
- [x] Dialog has `aria-modal="true"` and accessible name equal to the title (spec NFAC: "Dialog semantics")

### T3 — useCombat (`tests/unit/hooks/useCombat.test.ts`)

- [x] `endCombat()` does not call `window.confirm`; PUT `{ isActive: false }` is sent and state cleared on success (spec: "endCombat runs without native confirm")
- [x] PUT failure preserves local state and sets `error` (spec: "endCombat failure preserved")
- [x] Remove the stale `global.confirm = jest.fn(() => true)` mock (no test may depend on it)

### T4 — ActiveCombatView (`tests/unit/components/ActiveCombatView.test.tsx`)

- [x] Clicking End Combat shows the dialog and does not call `endCombat` (spec: "Open dialog without ending combat")
- [x] Clicking "End Combat" in the dialog closes it and calls `endCombat` once; a rapid double-click still calls it once (spec: "Confirm ends combat once")
- [x] Clicking "Return to Combat" or "×" closes the dialog and does not call `endCombat` (spec: "Return to Combat keeps combat running")
- [x] Dialog uses `titleId` `end-combat-confirm-title`, and coexists with the other modals' ids (spec: "Two dialogs coexist")

### T5 — E2E (`tests/e2e/combat-core.spec.ts`)

- [x] Click End Combat → in-app dialog appears → click confirm "End Combat" inside the dialog → setup screen returns (spec: "Confirm ends combat once")
- [x] Click End Combat → click "Return to Combat" → combat screen remains (spec: "Return to Combat keeps combat running")

### Regression

- [x] Existing `Modal` consumers (`app/characters/[id]/page.tsx`, `app/encounters/EncounterEditor.tsx`, etc.) tests still pass unchanged
- [x] No remaining `confirm(` call in `lib/hooks/useCombat.ts` `endCombat` (grep check)
