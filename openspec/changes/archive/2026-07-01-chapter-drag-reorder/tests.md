---
name: tests
description: Tests for chapter-drag-reorder
---

# Tests

## Overview

Tests for the `chapter-drag-reorder` change. Work follows strict TDD: write a failing test, make it pass, refactor.

Note: drag-and-drop reorder behavior is tested via Playwright E2E only. Unit tests in jsdom cannot meaningfully simulate pointer/touch/keyboard DnD events. The deleted unit test (`'reorders chapters with move buttons and updates order index'`) is replaced by the Playwright scenarios below.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing implementation code. Run it and confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping the test green.

## Test Cases

### Task 1 — Install @dnd-kit dependencies

- [ ] **Build succeeds after install**: Run `npm run build` — confirms @dnd-kit packages resolve without type or module errors

### Task 2 — SortableChapterRow + DnD wiring

- [ ] **Drag handle present per row** (Playwright): Open a campaign with 3 chapters; expand chapters accordion; assert `[data-testid="drag-handle-0"]`, `[data-testid="drag-handle-1"]`, `[data-testid="drag-handle-2"]` are all visible
  - Spec: `specs/drag-handle/spec.md` — "Handle visible for each chapter"

- [ ] **▲/▼ buttons absent** (Playwright or unit): Assert no element with `data-testid` matching `move-up-*` or `move-down-*` exists in the DOM
  - Spec: `specs/drag-handle/spec.md` — "REMOVED ▲/▼ move buttons"

- [ ] **Drag to later position reorders** (Playwright): Drag handle-0 to handle-2; assert chapter title inputs are in the new order
  - Spec: `specs/drag-reorder/spec.md` — "Drag chapter to a later position"

- [ ] **Drag to earlier position reorders** (Playwright): Drag handle-2 to handle-0; assert title inputs in new order
  - Spec: `specs/drag-reorder/spec.md` — "Drag chapter to an earlier position"

- [ ] **Drag cancelled with Escape restores order** (Playwright): Start drag (mousedown on handle, move), press Escape; assert title inputs are in original order
  - Spec: `specs/drag-reorder/spec.md` — "Drag cancelled with Escape"

- [ ] **Drag to same position is no-op** (Playwright): Drag handle-1 to handle-1 (tiny move); assert order unchanged
  - Spec: `specs/drag-reorder/spec.md` — "Drag to same position is a no-op"

- [ ] **Handle disabled during save** (Playwright): Intercept save network call to delay response; assert drag handles have `pointer-events: none` or are aria-disabled while save is in flight
  - Spec: `specs/drag-handle/spec.md` — "Handle disabled during save"

- [ ] **Existing interactions unaffected** (unit — existing passing tests): Chapter title edit, activate (🚩), remove, add — all existing CampaignEditor unit tests must continue to pass after DnD wiring

### Task 3 — Delete move-button unit test

- [ ] **No move-button test remains** (unit): `npm test -- --testPathPattern=CampaignEditor` passes and output does not mention `move-up-*` / `move-down-*`

### Task 4 — Playwright E2E campaigns.spec.ts

- [ ] **Save persistence** (Playwright): Drag reorder, save, navigate away, reopen editor — assert chapters display in saved order
  - Spec: `specs/save-persistence/spec.md` — "Drag reorder then save persists new order" + "Reloading the editor shows persisted order"

- [ ] **Active chapter identity preserved after reorder** (Playwright): Mark chapter as active, drag to new index, assert ACTIVE badge follows the same chapter ID
  - Spec: `specs/save-persistence/spec.md` — "Active chapter identity preserved after reorder"

- [ ] **No chapters duplicated or dropped on save** (Playwright): After reorder + save, assert chapter count equals original count and all `order` values are unique and in [0, N-1]
  - Spec: `specs/save-persistence/spec.md` — "Save after reorder does not duplicate or drop chapters"

### Keyboard / A11y (manual + Playwright where feasible)

- [ ] **Keyboard reorder moves chapter up** (Playwright): Focus drag-handle-1, press Space, ArrowUp, Space; assert new order
  - Spec: `specs/keyboard-a11y/spec.md` — "Keyboard reorder moves chapter up"

- [ ] **Keyboard reorder moves chapter down** (Playwright): Focus drag-handle-0, press Space, ArrowDown, Space; assert new order
  - Spec: `specs/keyboard-a11y/spec.md` — "Keyboard reorder moves chapter down"

- [ ] **Keyboard cancel with Escape** (Playwright): Focus handle, press Space (lift), press Escape; assert original order
  - Spec: `specs/keyboard-a11y/spec.md` — "Keyboard sort cancelled with Escape"

- [ ] **Focus ring not clipped** (manual): Tab to drag handle in browser; confirm focus ring is fully visible, not clipped by any container
  - Spec: `specs/keyboard-a11y/spec.md` — "Handle focus not clipped by container"

- [ ] **Screen-reader role** (manual/axe): Run axe or VoiceOver on chapter list; confirm handle announces as sortable/draggable
  - Spec: `specs/drag-handle/spec.md` — "Handle has accessible role and label"
