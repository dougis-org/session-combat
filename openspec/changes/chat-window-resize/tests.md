---
name: tests
description: Tests for the chat-window-resize change
---

# Tests

## Overview

This document outlines the tests for the `chat-window-resize` change. All work follows strict TDD: write a failing test first, make it pass with the simplest code, then refactor.

Test file: `tests/unit/components/CampaignChat.resize.test.tsx` (new)
Existing file to update: `tests/unit/components/CampaignChat.test.tsx`

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing any implementation code
2. **Write the simplest code** to make the test pass
3. **Refactor** for quality while keeping tests green

## Test Cases

### Task 1 — DockState extension and dockReducer

- [ ] `TOGGLE_SIZE` from compact (`isLarge: false`) sets `isLarge: true`
  - Spec: expand toggle → "User expands chat from compact mode"
- [ ] `TOGGLE_SIZE` from large (`isLarge: true`) sets `isLarge: false`
  - Spec: expand toggle → "User collapses chat from large mode"
- [ ] `SET_HEIGHT(400)` sets `customHeight: 400` and `isLarge: false`
  - Spec: drag-to-resize → "User drags handle upward"
- [ ] `SET_HEIGHT(50)` clamps to `customHeight: 150` (minimum enforced)
  - Spec: drag-to-resize → "User drags handle below minimum height"
- [ ] Initial state includes `isLarge: false, customHeight: null`

### Task 1 — Height resolution helper

- [ ] `isLarge: true, customHeight: null` → resolves to `'calc(100vh - 60px)'`
  - Spec: expand toggle → "User expands chat from compact mode"
- [ ] `isLarge: true, customHeight: 400` → resolves to `'calc(100vh - 60px)'` (large overrides custom)
  - Spec: expand toggle → "Expand overrides custom drag height"
- [ ] `isLarge: false, customHeight: 400` → resolves to `'400px'`
  - Spec: drag-to-resize → "User drags handle upward"
- [ ] `isLarge: false, customHeight: null` → resolves to `'33vh'` (default)

### Task 2 — localStorage persistence

- [ ] On mount with matching screen dims (±≤100px): `SET_HEIGHT` dispatched with saved height
  - Spec: persistence → "Custom height restored on same screen"
- [ ] On mount with mismatched screen dims (>100px diff in width or height): no dispatch, component renders at default
  - Spec: persistence → "Custom height discarded on different screen"
- [ ] On mount when `LocalStore.get` throws: component renders at default height with no crash
  - Spec: persistence → "localStorage error does not crash chat"
- [ ] After drag completes (mouseup): `safeSet` called with `{ height, screenWidth, screenHeight }`

### Task 3 — Drag handle sub-component

- [ ] RTL: drag handle renders in the expanded drawer when `isLarge: false`
- [ ] RTL: drag handle does NOT render when `isLarge: true`
  - Spec: drag-to-resize → "Drag handle is not shown in large mode"
- [ ] RTL: simulate `mousedown` on handle + `mousemove` by −100px (upward) + `mouseup`; assert final `customHeight` ≈ startHeight + 100
  - Spec: drag-to-resize → "User drags handle upward"
- [ ] RTL: simulate drag that would produce 50px height; assert final `customHeight === 150`
  - Spec: drag-to-resize → "User drags handle below minimum height"
- [ ] Cleanup: unmount component during drag (before mouseup); assert no `setState` errors and document listeners removed
  - Spec: NFAC Reliability → "Event listeners cleaned up on unmount during drag"

### Task 4 — Expand toggle button

- [ ] RTL: expand button renders in the header with correct `aria-label` in compact mode (`'Expand to full height'`)
- [ ] RTL: expand button renders with correct `aria-label` in large mode (`'Collapse to compact view'`)
- [ ] RTL: clicking expand button in compact mode dispatches `TOGGLE_SIZE` and calls `onSizeChange(true)`
  - Spec: onSizeChange prop → "Parent layout notified on expand"
- [ ] RTL: clicking expand button in large mode dispatches `TOGGLE_SIZE` and calls `onSizeChange(false)`
  - Spec: onSizeChange prop → "Parent layout notified on collapse from large mode"
- [ ] RTL: after expand click, panel `style` contains `calc(100vh - 60px)`
  - Spec: expand toggle → "User expands chat from compact mode"
- [ ] RTL: after collapse click, panel `style` reverts to `customHeight` or `33vh`
  - Spec: expand toggle → "User collapses chat from large mode"

### Task 5 — onSizeChange prop

- [ ] RTL: `onSizeChange` is called with `true` when transitioning to large mode
- [ ] RTL: `onSizeChange` is called with `false` when transitioning back to compact
- [ ] RTL: component renders without error when `onSizeChange` is not provided (prop is optional)

### Task 6 — CampaignLayout side-by-side

- [ ] RTL: when `isChatLarge: false`, layout does NOT have `flex` class on the outer wrapper
- [ ] RTL: when `isChatLarge: true` (after `onSizeChange(true)` fires), layout has `flex` class on the outer wrapper
  - Spec: side-by-side layout → "Campaign content reflows beside large chat"
- [ ] RTL: when `isChatLarge: false` again, layout removes `flex` class
  - Spec: side-by-side layout → "Campaign content returns to full width on collapse"

### Task 7 — Existing CampaignChat tests (regression)

- [ ] All existing tests in `tests/unit/components/CampaignChat.test.tsx` pass without modification (compact/pin behavior unchanged)
- [ ] All existing tests in `tests/unit/components/CampaignChat.roll.test.tsx` pass without modification
