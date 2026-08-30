## GitHub Issues

- #595

## Why

- Problem statement: When rolling dice, the result modal text is too small and does not show an image of the dice, providing a poor experience especially when the 3D physics animation is disabled. Additionally, the dice pool retains its selection after rolling instead of resetting, which adds friction for subsequent different rolls.
- Why now: Improving the UX for dice rolling is a core part of the application's feedback loop.
- Business/user impact: A more tactile and accessible dice rolling experience, and less frustration when changing dice selections between rolls.

## Problem Space

- Current behavior: 
  - The modal shows the roll formula in a small text size.
  - The modal only shows the numeric total, with no visual representation of the dice.
  - The dice pool panel keeps the previously rolled dice selected after a roll is made.
- Desired behavior:
  - Increase the font size of the roll formula in the modal.
  - Show a visual representation of the dice results in the modal using the existing SVG icons. Percentile rolls should show two d10s (tens and ones).
  - Reset the dice pool (clear selection) immediately after a roll is dispatched.
- Constraints: 
  - Do not use `@3d-dice/dice-box` for static rendering; use the existing SVG icons from `game-icons.net`.
- Assumptions: 
  - The `built.breakdown` and `built.percentileFaces` provide the necessary data for all rolls.
- Edge cases considered: 
  - Percentile rolls need special handling to show two d10s instead of one `d%` icon.
  - Users with animations disabled must still see the SVGs.

## Scope

### In Scope

- Updating `DiceRollOverlay.tsx` to increase label font size and render SVG icons for the rolled dice.
- Updating `GlobalDiceFab.tsx` to call `dp.reset()` after a roll.

### Out of Scope

- Modifying the 3D WebGL tumbling animation logic.
- Adding new dice icon assets.

## What Changes

- `lib/components/dice/DiceRollOverlay.tsx`: Add a new visual component to map over `built.breakdown` (or `built.percentileFaces`) and render SVG die icons with the rolled values superimposed. Increase the formula label font size.
- `lib/components/GlobalDiceFab.tsx`: Call `dp.reset()` in the roll handling flow.

## Risks

- Risk: The SVG icons might crowd the modal if a very large pool (e.g. 20 dice) is rolled.
  - Impact: Low to medium (modal might grow too tall or wide).
  - Mitigation: Wrap the icons in a flex container (`flex-wrap`) with sensible max dimensions and scaling.

## Open Questions

- Question: None
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Replacing the 3D tumbling physics.
- Re-architecting the dice pool state machine.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
