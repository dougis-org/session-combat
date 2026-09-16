## GitHub Issues

- #739

## Why

- Problem statement: At the start of combat, there are two distinct interfaces for combatants (the InitiativeEntry list at the top and the CombatantCard list below), which is visually confusing and clutters the UI.
- Why now: Streamlining the combat tracker's UI makes starting encounters much smoother for the DM.
- Business/user impact: A cleaner, unified interface reduces cognitive load and saves space on the DM's screen during setup.

## Problem Space

- Current behavior: `ActiveCombatView` renders a separate block for `zeroInitiative` combatants at the top using `InitiativeEntry`. If no one has rolled, it splits the list into "Party" and "Enemies".
- Desired behavior: Display a single unified list ("Initiative Order") from the start. Combatants missing initiative sort to the very top. The `InitiativeEntry` UI becomes a floating modal overlay pinned to the top-left of the `CombatantCard`.
- Constraints: The modal must accurately align with the top-left corner of the card. The automatic advancement of the modal to the next combatant should feel seamless and stop if the DM closes it manually.
- Assumptions: The existing `InitiativeEntry` component works perfectly and just needs to be rendered in a Modal wrapper instead of inline.
- Edge cases considered:
  - What happens if the DM clicks a card while the modal is already open for another card? (It should switch to the newly clicked one).
  - Scrolling while the modal is open (position should remain attached or modal should close).

## Scope

### In Scope

- Removing the `zeroInitiative` block and "Party / Enemies" split from `ActiveCombatView`.
- Updating `sortCombatants` (or `getDisplayCombatants`) to put un-rolled combatants at the top of the list.
- Creating a positioned `InitiativeModal` overlay and wiring it to `onSetInitiative` click events.
- Adding auto-advance logic that pops the modal open for the next un-rolled combatant when an initiative is saved.

### Out of Scope

- Changes to how the initiative roll math is calculated.
- Styling changes to the `InitiativeEntry` component itself.

## What Changes

- `ActiveCombatView.tsx`: Remove `zeroInitiative` rendering blocks. Add logic to render `InitiativeModal`.
- `useCombat.ts`: Update the list structure logic to always yield a single list and adjust sorting so un-rolled combatants bubble to the top. Add logic for auto-advancing the `initiativeEditId`.
- New Component (e.g. `InitiativeModal.tsx` or inside `ActiveCombatView.tsx`): A popup component that takes a `CombatantState` and bounding rect position and renders `InitiativeEntry` inside an absolutely positioned floating box.

## Risks

- Risk: The automatic modal popping could become annoying if not constrained correctly.
  - Impact: Bad UX for the DM.
  - Mitigation: Ensure the auto-pop only triggers immediately after a successful save, and stops completely if the DM hits "Close" or clicks outside.
- Risk: Positioning might break if the viewport resizes or scrolls while the modal is open.
  - Impact: The modal detaches from the card visually.
  - Mitigation: Since the modal is only open briefly, calculating position on click (similar to `RemoveConfirmPopup`) is likely sufficient.

## Open Questions

- Question: None. The exploration phase fully resolved the UX flow.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Refactoring the entire combat tracker state management.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
