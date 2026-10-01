## GitHub Issues

- #802

## Why

- Problem statement: In the initiative modal (`InitiativeEntry`), the "Enter Dice Roll" / "Enter Total" inputs and the flat-bonus input lose part of their border when focused (bottom/top/left edge cut off), and the entry row leaves a large blank area to its right.
- Why now: Reported in #802; the earlier layout refactor (#799) made the entry row shrink-wrap, and an attempted fix (`fc6f5b20`, reverted) did not resolve the clipping.
- Business/user impact: DMs entering initiative see a visibly broken control during the first, most frequent step of combat; the focus indicator (an accessibility affordance) is partly invisible.

## Problem Space

- Current behavior:
  - The inner grid in `lib/components/InitiativeEntry.tsx` is `max-h-[70vh] overflow-y-auto pr-1`. `overflow-y-auto` forces `overflow-x` to `auto` as well, so the container clips anything painted outside its padding box. It has right padding only, so a focused input's border/ring is clipped on the bottom, top and left.
  - The entry row (`div.flex` holding the input and "Set" button) has no width, so it shrink-wraps to the input's intrinsic width, leaving blank space to the right.
  - `useInitiativeModal` measures the modal once when it opens (Roll d20 mode, no entry row). Switching to Dice/Total mode adds the entry row afterwards, and the viewport clamp is not re-run, so the modal can extend past the viewport bottom.
- Desired behavior: Focused inputs show their full border/ring on every side; the entry row spans the available width; the modal stays inside the viewport after the entry mode changes.
- Constraints: Keep the modal card-anchored, viewport-clamped and non-reflowing; keep the scroll safeguard (`max-h-[70vh]`); do not change the entry row's flex direction (the reverted attempt `fc6f5b20` switched it to `flex-col`).
- Assumptions: The reported screenshot matches the clipping described above (not independently confirmed; screenshot not viewable by the agent). Tailwind utility classes are the project's styling mechanism.
- Edge cases considered: narrow card width; very tall content (scroll safeguard must still work); mode switch while the modal is near the viewport bottom; flat-bonus focus ring at the top edge.

## Scope

### In Scope

- Add padding on all sides of the scroll container in `InitiativeEntry` so focus rings are not clipped.
- Make the dice/total entry row full width (`w-full min-w-0`, input `min-w-0 flex-1`) while keeping `flex` row direction.
- Re-measure and re-clamp the modal in `useInitiativeModal` when the entry mode changes.
- Unit tests for the class changes and the re-clamp.

### Out of Scope

- Redesign of the initiative modal layout or heading column.
- Container-query based responsive layout.
- Other modals or the dice roller / roll feed.

## What Changes

- `lib/components/InitiativeEntry.tsx`: scroll container padding `pr-1` -> `p-1` (with compensating spacing); entry row and inputs width classes; notify the parent of mode changes (or expose a way for the hook to re-measure).
- `lib/hooks/useInitiativeModal.ts`: re-run the measure/clamp when the modal's size changes (entry mode change).
- `tests/unit/combat/initiativeEntry.test.tsx` (and hook test): assertions for the above.

## Risks

- Risk: Added padding shifts the layout by a few pixels.
  - Impact: Minor visual change; existing tests asserting exact classes could fail.
  - Mitigation: Use `-m-1 p-1` style compensation if alignment matters; update affected tests.
- Risk: Re-measuring causes the modal to jump while the user types.
  - Impact: Jarring UX.
  - Mitigation: Only re-measure on entry mode change, not on every render.

## Open Questions

- Question: Is the screenshot's clipping vertical focus-ring clipping only, or is any content (text, button) also cut off?
  - Needed from: Requester (#802 reporter)
  - Blocker for apply: no (scroll-container padding is the diagnosed cause; the re-clamp is defensive)

## Non-Goals

- Changing initiative calculation, validation or auto-open behavior.
- Reworking modal anchoring.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
