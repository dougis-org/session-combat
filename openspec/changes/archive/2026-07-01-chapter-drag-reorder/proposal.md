## GitHub Issues

- #462

## Why

- Problem statement: The Campaign edit screen uses ▲/▼ buttons to reorder chapters. These consume meaningful horizontal space in each row and are less intuitive than drag-and-drop for list reordering.
- Why now: Issue #446 deferred this change to keep that PR focused. The chapter UI is now stable and the feature can be completed.
- Business/user impact: DMs editing multi-chapter campaigns will reorder chapters more naturally and the chapter rows will be less cluttered.

## Problem Space

- Current behavior: Each chapter row has an ▲ (move up) and ▼ (move down) button. Clicking them swaps adjacent chapters. The `order` field is renormalized as indices after each swap. Two unit tests verify the swap logic.
- Desired behavior: Each chapter row has a ⠿ drag handle on the left. The user drags a row to the desired position; all other rows animate smoothly out of the way. Keyboard users can sort with arrow keys while focused on the handle. Saving persists the new `order` values.
- Constraints: No existing DnD library in the project. React 19 / Next 16. Must work on desktop (pointer) and tablet (touch). The project is otherwise dependency-lean so any new library must be justified.
- Assumptions: The campaign editor is a desktop-primary surface; tablet use is secondary but must be supported. Mobile-phone use is out of scope.
- Edge cases considered:
  - Single-chapter list: drag handle present but drag to same position is a no-op.
  - Drag cancelled mid-gesture (Escape): list returns to original order.
  - `saving` state: drag handle should be disabled (same as current ▲/▼ buttons).
  - Active chapter (currentChapterId) is not affected by reordering — it tracks by ID, not index.

## Scope

### In Scope

- Replace ▲/▼ buttons with a ⠿ drag handle in `app/campaigns/CampaignEditor.tsx`
- Install `@dnd-kit/core` and `@dnd-kit/sortable`
- Implement PointerSensor (mouse), TouchSensor (tablet), KeyboardSensor (keyboard a11y)
- CSS-transform animation (200ms ease) while items reorder
- Dragged item gets visual elevation (opacity 0.5, shadow) while dragging
- `onDragEnd` reorders array using `arrayMove` and renormalizes `order` values
- Delete unit test `'reorders chapters with move buttons and updates order index'`
- Add new Playwright E2E spec `tests/e2e/campaigns.spec.ts` covering drag-reorder and save persistence

### Out of Scope

- Multi-select drag, dragging chapters across campaigns
- Mobile phone support (screen < tablet width)
- Persisting intermediate drag states (only final drop matters)
- Any changes to the campaign API or data model

## What Changes

- `package.json`: add `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `app/campaigns/CampaignEditor.tsx`: remove `handleMoveUp`/`handleMoveDown`, add `handleDragEnd`, wrap chapter list in `DndContext`+`SortableContext`, replace ▲/▼ buttons with drag handle
- `tests/unit/components/CampaignEditor.test.tsx`: delete the move-button reorder test
- `tests/e2e/campaigns.spec.ts`: new file with E2E drag-reorder scenario

## Risks

- Risk: `@dnd-kit` with `KeyboardSensor` may not work if the chapter list container clips focus (overflow-hidden).
  - Impact: Keyboard users cannot reorder chapters.
  - Mitigation: Verify keyboard focus during implementation; adjust container styling if needed (e.g., `overflow-visible` on inner list).

- Risk: Playwright `locator.dragTo()` dispatches pointer events — should work with `PointerSensor` but depends on jsdom/Playwright version.
  - Impact: E2E drag test may be flaky or require `mouse.move` approach.
  - Mitigation: Prototype the E2E drag interaction early in the task sequence; fall back to `page.mouse` if `dragTo` is unreliable.

- Risk: Deleting the unit test removes the only automated coverage of chapter reorder logic until E2E is written.
  - Impact: Brief gap in coverage if tasks are done out of order.
  - Mitigation: Write E2E test before deleting unit test, or delete both in the same commit.

## Open Questions

No unresolved ambiguity. All key decisions have been confirmed during exploration:
- Library: `@dnd-kit` (confirmed)
- Sensors: Pointer + Touch + Keyboard (confirmed)
- Animation: yes, CSS transform 200ms (confirmed)
- Unit test: delete, rely on Playwright (confirmed)
- Touch/tablet: supported (confirmed)

## Non-Goals

- Undo/redo for drag reorder
- Drag-and-drop elsewhere in the app (not part of this change)
- Animated page-level transitions

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
