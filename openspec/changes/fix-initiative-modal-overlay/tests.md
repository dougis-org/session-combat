---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-initiative-modal-overlay` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1 — Anchor to card, not button (maps to spec: "MODIFIED Pinned Initiative Modal Overlay")

- [x] Given a combatant card whose Initiative button sits at a different screen position than the card's own bounding rect, when the DM clicks the Initiative control, the modal's computed anchor position equals the card's (`[data-combatant-id]`) `getBoundingClientRect()`-derived `{top, left}`, not the button's.
- [x] Given the post-save auto-advance path (`handleSetInitiative`), when it targets the next unrolled combatant, the computed anchor position is derived from that combatant's card rect, not its Initiative button rect.

### Task 2 — Measure-then-clamp positioning (maps to spec: "Modal never overflows the viewport")

- [x] Given a target card positioned near the right edge of a mocked narrow `window.innerWidth`, when the initiative modal opens, the modal's rendered bounding box (`left` + measured width) does not exceed `window.innerWidth - 16`.
- [x] Given a target card positioned near the bottom edge of a mocked `window.innerHeight`, when the initiative modal opens, the modal's rendered bounding box (`top` + measured height) does not exceed `window.scrollY + window.innerHeight - 16`.
- [x] Given a target card comfortably within the viewport, when the initiative modal opens, its position equals the card's top-left corner (no clamping adjustment applied).
- [x] Given the `INITIATIVE_MODAL_WIDTH` constant, confirm it no longer exists in `ActiveCombatView.tsx` (grep/static check) and no left-offset subtraction based on a hardcoded width remains.

### Task 3 — Dismissed-combatant tracking (maps to spec: "Dismissed auto-opened modal does not reopen itself" / "Dismissed combatant remains manually openable")

- [x] Given the initiative modal is open (auto-opened) for combatant A with no `initiativeRoll`, when the DM clicks the close (X) button, the modal closes and, on the next re-render triggered by unrelated state (e.g. adding combatant B), the modal does not reopen for combatant A.
- [x] Given the initiative modal is open (auto-opened) for combatant A, when the DM presses Escape, the modal closes and does not auto-reopen for combatant A afterward.
- [x] Given the initiative modal is open (auto-opened) for combatant A, when the DM clicks outside the modal, the modal closes and does not auto-reopen for combatant A afterward.
- [x] Given combatant A's auto-opened modal was previously dismissed, when the DM clicks combatant A's card Initiative control directly, the modal opens for combatant A as normal.
- [x] Given combatant A's modal was closed as the result of a successful `onSet` (not a dismiss), when another unrolled combatant B exists, auto-advance still targets B (dismissal tracking must not suppress the existing post-save auto-advance).

### Task 4 — Auto-open effect (maps to spec: "Auto-opens on initial combat view render" / "Auto-opens for a newly added combatant" / "Does not auto-open when everyone has rolled")

- [x] Given `ActiveCombatView` mounts with combatants where one or more have no `initiativeRoll`, when the initial render completes, the initiative modal is open and anchored to the first such combatant (per existing `sortCombatants` ordering) — no click required.
- [x] Given `ActiveCombatView` mounts with every combatant already having an `initiativeRoll`, when the initial render completes, no initiative modal is shown.
- [x] Given all existing combatants have an `initiativeRoll` and no modal is open, when a new combatant with no `initiativeRoll` is added (simulating "+ Add Enemy"/"+ Add Party Member"), the initiative modal auto-opens targeting the new combatant.
- [x] Given the initiative modal is already open for combatant A (auto-opened or manually opened), when another unrolled combatant B exists simultaneously, the auto-open effect does not steal focus from A (only one modal open at a time, no double-trigger).

### Task 5 — Missing-DOM-node recovery (maps to spec: "Recovery behavior from missing DOM node")

- [x] Given the auto-open effect targets combatant A but combatant A is removed from `combatState.combatants` before the anchor lookup runs (or its card is absent from the DOM), the effect does not throw and results in `initiativeEditId`/`initiativeEditPosition` set to `null` (no modal rendered).
- [x] Given the modal is already open and its target combatant is removed mid-session, the modal closes gracefully rather than rendering with a stale/undefined combatant.

### Task 6 — "N/A" red readout (maps to spec: "Unrolled combatant shows N/A in warning color" / "Rolled combatant shows its numeric total in normal style")

- [x] Given a combatant with `initiativeRoll` undefined, when `InitiativeControl` renders, the readout text content is "N/A" and carries the warning/red style class.
- [x] Given a combatant with `initiativeRoll` set and `initiative` total equal to `0` (e.g. large negative bonus), when `InitiativeControl` renders, the readout text content is the numeric `0` (not "N/A") in the normal (non-warning) style.
- [x] Given a combatant with `initiativeRoll` set and a positive total, when `InitiativeControl` renders, the readout text content is that numeric total in the normal style.

## Traceability to `tasks.md`

- Task 1 → Test Cases: "Task 1 — Anchor to card, not button"
- Task 2 → Test Cases: "Task 2 — Measure-then-clamp positioning"
- Task 3 → Test Cases: "Task 3 — Dismissed-combatant tracking"
- Task 4 → Test Cases: "Task 4 — Auto-open effect"
- Task 5 → Test Cases: "Task 5 — Missing-DOM-node recovery"
- Task 6 → Test Cases: "Task 6 — 'N/A' red readout"
