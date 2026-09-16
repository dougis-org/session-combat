## Context

- Relevant architecture: Next.js Client Components (React). `ActiveCombatView.tsx` manages the main combat UI, and `useCombat.ts` manages the combat state and sorting.
- Dependencies: `InitiativeEntry.tsx`, `CombatantCard.tsx`, `useCombat.ts`.
- Interfaces/contracts touched: `sortCombatants`, `getDisplayCombatants`, `setInitiativeRoll`.

## Goals / Non-Goals

### Goals

- Eliminate the visual clutter of having two separate combatant interfaces at the start of combat.
- Sort combatants who have not rolled initiative to the top of the combat tracker.
- Display the `InitiativeEntry` UI as an anchored popup over the target `CombatantCard`.
- Implement auto-advancing logic so setting initiative automatically opens the modal for the next combatant, until manually dismissed.

### Non-Goals

- Refactoring the entire `useCombat` state hook.
- Modifying the internal logic or styling of the `InitiativeEntry` component.

## Decisions

### Decision 1: Unified List Sorting

- Chosen: In `useCombat.ts`, change `getDisplayCombatants()` to always apply sorting. Update `sortCombatants()` to sort un-rolled characters (`!initiativeRoll`) above rolled ones.
- Alternatives considered: Keep two lists (Party/Enemies) but hide the `zeroInitiative` block.
- Rationale: Satisfies the requirement to have a single interface sorted by un-set first, and simplifies the render logic in `ActiveCombatView`.
- Trade-offs: Changes the pre-combat visual layout from a grouped Party/Enemies view to a single list (Party first, then Enemies, if neither has rolled). This aligns with the unified interface goal.

### Decision 2: Pinned Initiative Modal

- Chosen: Remove the `zeroInitiative` block from `ActiveCombatView.tsx`. Create an absolute-positioned overlay (similar to `RemoveConfirmPopup`) containing `InitiativeEntry`, anchored to the `top` and `left` of the selected `CombatantCard`.
- Alternatives considered: Use a global React Portal or standard centered Modal.
- Rationale: The requirement specifically states the modal should be "pinned so its top left corner aligns with the top left corner of the combatant screen". Using bounding rects matches the existing `RemoveConfirmPopup` pattern and avoids z-index or overflow issues in a scrollable container.
- Trade-offs: If the user resizes the window or scrolls aggressively, the absolute position might drift. This is acceptable as the modal is ephemeral and recalculates position on click.

### Decision 3: Auto-Advance Logic

- Chosen: In `ActiveCombatView`, when `setInitiativeRoll` is called, determine the next combatant in `getDisplayCombatants()` that has not rolled, and set them as the new `initiativeEditId`. Update the rect position accordingly.
- Alternatives considered: Do not auto-advance.
- Rationale: Auto-advance provides a much smoother DM experience for quickly inputting all initiatives.
- Trade-offs: Requires ensuring the modal position updates dynamically to the next card.

## Proposal to Design Mapping

- Proposal element: Removing the `zeroInitiative` block and "Party / Enemies" split.
  - Design decision: Decision 1 (Unified List Sorting).
  - Validation approach: Verify only one combatant list renders, even at the start of combat.
- Proposal element: Un-rolled combatants sort to the top.
  - Design decision: Decision 1 (Unified List Sorting).
  - Validation approach: Verify `sortCombatants` correctly orders `!initiativeRoll` items first.
- Proposal element: Pinned modal overlay.
  - Design decision: Decision 2 (Pinned Initiative Modal).
  - Validation approach: Verify `InitiativeEntry` is rendered in an absolute container positioned over the target card.
- Proposal element: Auto-advance modal.
  - Design decision: Decision 3 (Auto-Advance Logic).
  - Validation approach: Verify saving an initiative opens the modal on the next unrolled character automatically.

## Functional Requirements Mapping

- Requirement: Unrolled characters appear at the top of the tracker.
  - Design element: Decision 1.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Can be unit-tested in `useCombat.test.ts` by checking `sortCombatants` output.

- Requirement: Modal is pinned to top-left of combatant card.
  - Design element: Decision 2.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Verify position style props visually or via component tests.

- Requirement: Modal auto-advances.
  - Design element: Decision 3.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Integration test simulating save and checking if `initiativeEditId` updates.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: The modal auto-advance must be breakable by the user.
  - Design element: The `onClose` handler sets `initiativeEditId` to null, which stops the auto-advance loop.
  - Acceptance criteria reference: TBD in specs.
  - Testability notes: Verify hitting 'Close' dismisses the modal and it does not reopen.

## Risks / Trade-offs

- Risk/trade-off: Window resizing breaks the modal position.
  - Impact: Low (modal is ephemeral).
  - Mitigation: Calculate position accurately on every open or advance. If needed, listen to window resize and close the modal.

## Rollback / Mitigation

- Rollback trigger: The auto-advance logic causes infinite loops or the modal obscures critical UI permanently.
- Rollback steps: Revert the PR. The previous two-interface setup will be restored.
- Data migration considerations: None (this is purely a UI/client-state change).
- Verification after rollback: Ensure `zeroInitiative` block returns to the top of the screen.

## Operational Blocking Policy

- If CI checks fail: Fix unit/integration tests (specifically those around `useCombat` and `InitiativeEntry`).
- If security checks fail: N/A for UI changes.
- If required reviews are blocked/stale: Ping reviewer after 24 hours.
- Escalation path and timeout: N/A for minor UI feature.

## Open Questions

- None.
