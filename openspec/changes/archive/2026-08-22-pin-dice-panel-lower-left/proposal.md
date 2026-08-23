## GitHub Issues

- #526

## Why

- Problem statement: The new global dice panel opens in the center of the screen, which feels disconnected from the trigger button. Additionally, native browser tooltips for the dice sizes are slow to appear.
- Why now: The `GlobalDiceFab` was just introduced, and addressing its layout and UX friction immediately ensures the core interaction (rolling dice) is smooth and precise.
- Business/user impact: A snappy dice panel positioned directly over the trigger button improves UX, while fast custom tooltips eliminate frustrating hover delays.

## Problem Space

- Current behavior: `GlobalDiceFab` renders a centered modal inside a dark background overlay. Dice buttons use native `title` attributes that have sluggish hover delays.
- Desired behavior: The dice panel anchors its bottom-left corner over the bottom-left of the dice trigger button, while retaining the background dimming overlay. Hover tooltips for dice sizes appear instantly via a custom tooltip component.
- Constraints: 
  - Must not break the recently added global dice roll state and bridge mechanics.
  - The tooltip implementation should align with existing patterns (e.g. `CombatInfoIcon.tsx`).
- Assumptions:
  - The dice trigger button remains fixed at `bottom-4 left-4`.
  - The user explicitly requested to keep the background dimming to highlight the roll.
- Edge cases considered:
  - Panel size changing or extending beyond the viewport: Since it's anchored bottom-left, it will safely grow up and to the right.

## Scope

### In Scope

- Repositioning the `GlobalDiceFab` panel fixed to the bottom-left corner (`bottom-4 left-4`) inside its existing overlay wrapper.
- Replacing native `title` attributes in `GlobalDiceFab` with custom instant tooltips based on existing patterns.

### Out of Scope

- Changing the dice pool mechanics, roll outcomes, or session bridge logic.
- Adding tooltips to other parts of the application.
- Removing the background dimming overlay.

## What Changes

- Update `GlobalDiceFab.tsx` panel container classes to position it at `bottom-4 left-4` instead of `items-center justify-center`.
- Implement a custom tooltip component/state pattern in `GlobalDiceFab.tsx` and replace `title` attributes for dice buttons.

## Risks

- Risk: Reusing tooltip logic inline might cause code duplication.
  - Impact: Slightly larger component footprint.
  - Mitigation: Extract a simple shared `Tooltip` component if appropriate, or keep it simple inline if it's small.

## Open Questions

None. The user has resolved the questions regarding keeping the background dimming and using custom tooltips.

## Non-Goals

- Refactoring the entire `GlobalDiceFab` state machine.
- Redesigning the visual look of the dice panel itself beyond its placement.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
