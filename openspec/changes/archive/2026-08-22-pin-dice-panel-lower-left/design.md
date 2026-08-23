## Context

- Relevant architecture: Client-side React components in `lib/components/GlobalDiceFab.tsx`.
- Dependencies: Requires existing dice utility functions and UI components.
- Interfaces/contracts touched: No backend or state changes; purely a UI layout and rendering change.

## Goals / Non-Goals

### Goals

- Anchor the dice panel's bottom-left corner exactly over the dice trigger button's bottom-left corner.
- Retain the `bg-black/50` dimming overlay behind the panel.
- Provide instantaneous tooltips for the dice buttons.

### Non-Goals

- Refactoring the entire `GlobalDiceFab` state machine.
- Redesigning the visual look of the dice panel itself.

## Decisions

### Decision 1: Panel Positioning strategy

- Chosen: Change the outer overlay from a `flex items-center justify-center` container to a standard `fixed inset-0 bg-black/50` block. Give the inner panel `absolute bottom-4 left-4` (matching the trigger button's fixed coordinates).
- Alternatives considered: 
  - Using a Popper/Floating UI library for anchoring: Overkill for a fixed-coordinate button.
  - Positioning the panel inside the trigger button's DOM node: Can cause z-index/clipping issues.
- Rationale: The trigger button is hardcoded to `bottom-4 left-4`. Using `absolute bottom-4 left-4` for the panel inside a full-screen wrapper achieves the requested "bottom-left overlaying bottom-left" positioning trivially and cleanly.
- Trade-offs: The panel will completely cover the trigger button. The user can close it by clicking the overlay or pressing Escape, which is standard.

### Decision 2: Instant Tooltips implementation

- Chosen: Extract a small `TooltipButton` (or generic `Tooltip`) component within `GlobalDiceFab.tsx` that manages an `isHovered` state and renders an absolutely positioned tooltip element, replacing the native `title` attribute.
- Alternatives considered: 
  - Managing an object of hovered states in `GlobalDiceFab` directly: Clutters the main component's state.
  - Adding a heavyweight tooltip library: Unnecessary dependency for a simple UI requirement.
- Rationale: Matches the pattern already established in `CombatInfoIcon.tsx` for custom tooltips, ensuring consistency while keeping dependencies light.
- Trade-offs: Slightly more React node overhead than a native `title` attribute, but provides the immediate feedback required.

## Proposal to Design Mapping

- Proposal element: Repositioning the `GlobalDiceFab` panel fixed to the bottom-left corner inside its existing overlay wrapper.
  - Design decision: Decision 1
  - Validation approach: Visual/manual test to ensure the panel pops up at the bottom left of the screen, covering the trigger button.
- Proposal element: Replacing native `title` attributes in `GlobalDiceFab` with custom instant tooltips.
  - Design decision: Decision 2
  - Validation approach: Unit tests verifying hover state renders the tooltip text instantly.

## Functional Requirements Mapping

- Requirement: Panel opens at bottom-left corner over the trigger.
  - Design element: Decision 1
  - Acceptance criteria reference: specs `global-dice-fab`
  - Testability notes: Verify CSS classes on the panel component in unit tests (`absolute bottom-4 left-4`).

- Requirement: Tooltips appear instantly without native delay.
  - Design element: Decision 2
  - Acceptance criteria reference: specs `global-dice-fab`
  - Testability notes: Fire `mouseEnter` events in tests and assert the tooltip text is immediately present in the DOM.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Ensure background overlay is clickable to close the modal.
  - Design element: Decision 1
  - Acceptance criteria reference: specs `global-dice-fab`
  - Testability notes: Ensure the `pointerDown` event listener still successfully closes the panel when clicking the overlay area outside the panel.

## Risks / Trade-offs

- Risk/trade-off: Panel covers the trigger button, so the user cannot click the trigger to close it.
  - Impact: User must click the background overlay or press Escape to close.
  - Mitigation: This is standard modal behavior, and the existing `pointerDown` event listener handles outside clicks perfectly.

## Rollback / Mitigation

- Rollback trigger: Layout breaks on mobile viewports causing the panel to be clipped.
- Rollback steps: Revert the PR to restore the centered flex layout and native `title` attributes.
- Data migration considerations: None.
- Verification after rollback: Open the global dice fab and ensure it centers on screen again.

## Operational Blocking Policy

- If CI checks fail: Block merge until tests are updated to reflect new DOM structure and classes.
- If security checks fail: Block merge and resolve.
- If required reviews are blocked/stale: Follow standard project stall policy.
- Escalation path and timeout: N/A for minor UI change.

## Open Questions

- None.
