---
name: tests
description: Tests for the centered-dimmed-initiative-modal change
---

# Tests

## Overview

Tests for `centered-dimmed-initiative-modal` (#807). All work follows strict TDD. jsdom has no layout engine, so unit tests assert classes, DOM structure, roles, and focus; real width/overflow is verified in Playwright.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** that captures the requirement; run it and confirm it fails for the right reason.
2. **Write the simplest code to pass.**
3. **Refactor** while keeping tests green.

## Test Cases

### Task 1.1: `useFocusTrap` (`tests/unit/hooks/useFocusTrap.test.tsx`) — Spec: Accessible Dialog and Focus Management

- [ ] Focuses the first tabbable descendant when activated.
- [ ] Falls back to focusing the container (`tabIndex=-1`) when it has no tabbable descendants.
- [ ] Tab on the last tabbable element moves focus to the first; Shift+Tab on the first moves to the last.
- [ ] Skips disabled controls and `tabindex="-1"` elements when computing first/last.
- [ ] Restores focus to the previously focused element on deactivation when it is still in the document.
- [ ] Does not throw or restore focus when the previously focused element was removed.
- [ ] Re-focuses the first control when the key changes while active, without restoring focus to the page in between.
- [ ] Does nothing while inactive (no listeners, no focus changes).
- [ ] Does not intercept Escape.

### Task 2.1/2.2: `useInitiativeModal` simplification (`tests/unit/hooks/useInitiativeModal.test.tsx`) — Spec: Auto-Open, Auto-Advance, Reliability, Performance

- [ ] `openInitiativeModal('c1')` sets `initiativeEditId` and opens without any DOM card element present.
- [ ] Auto-open still opens for the first unrolled, non-dismissed combatant (no card lookup, no `console.warn` about a missing card).
- [ ] Dismissed combatant does not auto-reopen; other combatants still do (existing coverage retained).
- [ ] Removing the open combatant clears `initiativeEditId` (recovery effect).
- [ ] While open, no `resize`/`scroll` listener and no `ResizeObserver` is registered (spy on `window.addEventListener` and `ResizeObserver`).
- [ ] Result no longer exposes `initiativeEditPosition`, `initiativeModalRef`, `getCardAnchorPosition`, `remeasureInitiativeModal` (TypeScript and runtime key check).
- [ ] Delete the `remeasureInitiativeModal (#802)` tests and the position-based tests.

### Task 3.1: Backdrop and dialog (`tests/unit/components/ActiveCombatView.test.tsx`) — Spec: Dimmed Backdrop, Content-Sized Centered Dialog, Pinned Initiative Modal Overlay

- [ ] Backdrop (`initiative-modal-backdrop`) renders with `fixed`, `inset-0`, `bg-black/40`, `items-center`, `justify-center`, `p-4`, `overflow-y-auto` when the modal is open.
- [ ] Backdrop is absent when every combatant has rolled.
- [ ] Dialog (`initiative-modal`) has `w-max max-w-full` and no inline `top`/`left`/`width`/`transform`.
- [ ] Clicking the backdrop closes the modal and clears the edit state; clicking inside the dialog does not.
- [ ] Auto-advance keeps the same backdrop element (same node identity) and updates the heading to the next combatant.
- [ ] Saving the last unrolled combatant removes the backdrop.
- [ ] `document.body.style.overflow` is `hidden` while open and restored to its prior value on close and on unmount.
- [ ] Removing the open combatant closes the modal and removes the backdrop.
- [ ] Delete tests asserting `style.top`/`style.left`, viewport clamping, scroll-aware clamp, and card-width matching.

### Task 3.1/3.2: Accessibility (`tests/unit/components/ActiveCombatView.test.tsx`, `tests/unit/combat/initiativeEntry.test.tsx`) — Spec: Dialog semantics, Focus moves in, Tab wraps, Focus restored, Auto-advance refocuses

- [ ] `getByRole('dialog')` exists with `aria-modal="true"` and accessible name containing "Set Initiative" and the combatant name.
- [ ] Opening from the card's Initiative control moves focus inside the dialog; closing returns focus to that control.
- [ ] Tab from the last control wraps to the first, and Shift+Tab from the first wraps to the last, in "roll", "dice", and "total" modes and with the batch "Roll all monsters" button present.
- [ ] After Set with auto-advance, `document.activeElement` is inside the dialog (not `body`).
- [ ] Escape and the close button still dismiss (existing tests retained).

### Task 3.2: `InitiativeEntry` layout (`tests/unit/combat/initiativeEntry.test.tsx`) — Spec: Initiative entry controls are never visually clipped

- [ ] Controls column keeps `p-1` and no longer has `overflow-y-auto` or `max-h-[70vh]`.
- [ ] A 120-character name renders in the heading with a wrapping class (`break-words`); heading ids are applied from props.
- [ ] `onModeChange` is no longer a prop (delete the `onModeChange (#802)` tests); switching modes still renders the correct entry row.
- [ ] Entry rows keep `w-full min-w-0` and the input `min-w-0 flex-1` (existing coverage retained).

### Task 3.3/4.2: Playwright (`tests/e2e/combat-initiative-modal.spec.ts`, free port, not 3000) — Spec: Long name does not create a scrollbar, Dialog is centered, Keyboard-only operation

- [ ] Combat with a character whose name is about 80 characters at a 1397px viewport: the dialog has `scrollWidth <= clientWidth`, and so does the controls column; no horizontal scrollbar.
- [ ] Same at a 375px viewport: dialog bounding box is within 16px of each viewport edge and the name wraps.
- [ ] Dialog bounding-box center is within 2px of the viewport center horizontally and vertically on a normal-height viewport.
- [ ] Backdrop covers the viewport and the combatant list behind it is still visible (backdrop alpha less than 0.5).
- [ ] Tab cycles only through controls inside the dialog (press Tab N+1 times, `document.activeElement` stays inside); Escape closes and focus returns to the card control.
- [ ] Auto-open on combat start followed by "Roll d20" via keyboard advances through all combatants and ends with no backdrop.
- [ ] Detail panel and remove-confirm popup do not render above the backdrop while the modal is open (stacking check).
- [ ] Existing `combat-core.spec.ts` initiative flow (waits for `initiative-modal` hidden) still passes.
