## Context

- Relevant architecture: `lib/components/InitiativeEntry.tsx` renders inside an absolutely positioned wrapper in `lib/components/ActiveCombatView.tsx`. `lib/hooks/useInitiativeModal.ts` anchors the wrapper to the combatant card (width = card width) and clamps it to the viewport in a `useLayoutEffect` keyed on `[initiativeEditId, initiativeEditPosition]`.
- Dependencies: Tailwind utility classes only; React `useLayoutEffect`.
- Interfaces/contracts touched: `InitiativeEntry` props (possible optional `onModeChange` callback); `useInitiativeModal` return value (possible extra `remeasureInitiativeModal`). No API/storage changes.

## Goals / Non-Goals

### Goals

- Focused inputs in the modal show their complete border/focus ring on all sides.
- The dice/total entry row spans the available width.
- The modal remains within the viewport after the entry mode changes.

### Non-Goals

- Redesigning the modal layout, container queries, or changing initiative logic.
- Changing the entry row's flex direction (reverted attempt `fc6f5b20` did).

## Decisions

### Decision 1: Pad the scroll container instead of removing it

- Chosen: Replace `pr-1` with `p-1` on the `max-h-[70vh] overflow-y-auto` grid in `InitiativeEntry.tsx` (keep `mb-4`).
- Alternatives considered: Remove `overflow-y-auto`/`max-h-[70vh]`; move scroll to a padded wrapper.
- Rationale: `overflow-y-auto` also clips x; the focus ring paints outside the input's border box and is clipped at the container's padding edge. Padding gives the ring room while keeping the safety scroll for tall content.
- Trade-offs: 4px extra inset; the hook clamp already bounds the modal so the scroll rarely activates, but removing it would leave nothing to catch stale-clamp overflow.

### Decision 2: Full-width entry row, same flex direction

- Chosen: Entry row wrapper `div.flex.items-start.gap-2` gets `w-full min-w-0`; each mode's inner `div.flex` gets `w-full min-w-0`; inputs get `min-w-0 flex-1`.
- Alternatives considered: `flex-col` (reverted in `fc6f5b20`); fixed input widths.
- Rationale: Fixes the blank space to the right without altering the established layout (#799 aligned the Set button under Roll d20).
- Trade-offs: The initiative result badge shares the row and is pushed right when an input is active; acceptable.

### Decision 3: Re-measure the modal when entry mode changes

- Chosen: `InitiativeEntry` accepts an optional `onModeChange(mode)` callback; `ActiveCombatView` forwards it to a hook-exposed re-measure that re-runs the existing clamp logic (extracted from the layout effect into a reusable function).
- Alternatives considered: `ResizeObserver` on the modal (broader, fires on any size change); extra effect dependency (hook cannot see `entryMode`).
- Rationale: Mode change is the only size-changing event in the modal (adds/removes the entry row), so an explicit trigger is minimal and deterministic.
- Trade-offs: One extra prop and hook return value.

## Proposal to Design Mapping

- Proposal element: Focus ring clipped by scroll container
  - Design decision: Decision 1
  - Validation approach: unit test asserting `p-1` and no `pr-1`-only padding on the scroll container; manual focus check in browser
- Proposal element: Blank space right of entry row
  - Design decision: Decision 2
  - Validation approach: unit test asserting `w-full`/`min-w-0`/`flex-1` classes in dice and total modes, row remains `flex` (not `flex-col`)
- Proposal element: Stale clamp after mode switch
  - Design decision: Decision 3
  - Validation approach: unit test that mode change invokes `onModeChange`; hook test that re-measure moves `top` upward when the modal grows past the viewport

## Functional Requirements Mapping

- Requirement: Focus ring is not clipped
  - Design element: Decision 1
  - Acceptance criteria reference: specs/modal-initiative-entry/spec.md — "Focused input is not clipped"
  - Testability notes: jsdom cannot paint; assert padding classes and verify visually via Playwright screenshot
- Requirement: Entry row uses full width
  - Design element: Decision 2
  - Acceptance criteria reference: "Entry row spans available width"
  - Testability notes: class assertions
- Requirement: Modal re-clamps after mode change
  - Design element: Decision 3
  - Acceptance criteria reference: "Modal stays in viewport after mode change"
  - Testability notes: mock `getBoundingClientRect` in hook test

## Non-Functional Requirements Mapping

- Requirement category: operability/accessibility
  - Requirement: Keyboard focus indicator fully visible
  - Design element: Decision 1
  - Acceptance criteria reference: "Focused input is not clipped"
  - Testability notes: Playwright screenshot of focused input at narrow card width

## Risks / Trade-offs

- Risk/trade-off: Padding shifts layout by 4px and may break class-exact tests
  - Impact: Test churn
  - Mitigation: Update assertions; keep `-m-1` option if alignment is off
- Risk/trade-off: Re-measure on mode change could cause a visible jump
  - Impact: Minor UX
  - Mitigation: Only trigger on mode change

## Rollback / Mitigation

- Rollback trigger: Layout regression in the initiative modal reported after release.
- Rollback steps: Revert the PR (class-only changes plus one optional callback).
- Data migration considerations: None.
- Verification after rollback: Open the initiative modal in all three modes and confirm it renders as before.

## Operational Blocking Policy

- If CI checks fail: fix, validate locally, push; never bypass or `--admin` merge.
- If security checks fail: remediate before merging; no waivers without a named human-accepted risk.
- If required reviews are blocked/stale: re-request review; if blocked > 24h, escalate to the repo owner.
- Escalation path and timeout: report the stall to the user after three no-progress iterations.

## Open Questions

- Does the reporter's screenshot show any clipping beyond the focus ring? (non-blocking)
