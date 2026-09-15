## GitHub Issues

- #732

## Why

- Problem statement: The combatant card's top section is a single, un-wrapped flex container. On smaller screens, this causes horizontal overflow, forcing DMs to scroll left and right to see all data and combat controls.
- Why now: DMs need to be able to use the combat tracker on various resolutions, including mobile devices, without layout breakage. We also have a pending requirement to add a D20 roll icon, which will further cramp the horizontal space.
- Business/user impact: A cleaner, responsive combat interface allows DMs to run combat more smoothly without fighting the UI.

## Problem Space

- Current behavior: `CombatantCardHeader` and `HpControls` render raw React Fragments (`<>...</>`) directly into the `CombatantCard`'s top-level flex row. Elements sit side-by-side without wrapping.
- Desired behavior: Elements are logically grouped into named, labeled semantic `div`s with `flex-wrap` enabled. This allows the sections to wrap onto multiple lines cleanly on smaller screens. This grouping must also prepare the structure for future per-group collapsibility (e.g. collapsing HP Controls or Stats).
- Constraints: The new layout must leave an obvious semantic group/space for the future D20 quick roll icon.
- Assumptions: Wrapping the fragments in `div`s with `flex` properties will not break the visual layout on large screens, it will just add a small DOM wrapper.
- Edge cases considered: 
  - What happens when only one group wraps? (Flex wrap handles this gracefully).
  - Can cards be updated easily in the future? (Yes, semantic groups make this much easier than the current flat list of elements).

## Scope

### In Scope

- Updating `CombatantCard.tsx` to add `flex-wrap` and semantic section containers.
- Updating `CombatantCardHeader.tsx` to return semantic `div`s instead of fragments.
- Updating `HpControls.tsx` to return a semantic `div` instead of a fragment.
- Creating the following semantic sections: Identity/Stats, HP/Combat Controls, Quick Rolls (placeholder), and Initiative/Turn.
- Assigning GitHub issue #732 to the current user (dougis).

### Out of Scope

- Implementing the actual collapse/expand logic (this is just laying the structural foundation).
- Implementing the D20 Quick Roll functionality (we are just leaving a placeholder section for it).

## What Changes

- `lib/components/CombatantCard.tsx`: Update the top flex container to include `flex-wrap` and adjust its children layout structure.
- `lib/components/combatant-card/CombatantCardHeader.tsx`: Wrap output elements into `identity` and `stats` flex groups rather than flat fragments.
- `lib/components/combatant-card/HpControls.tsx`: Wrap output into an `hp-controls` flex group.
- GitHub issue #732 will be assigned to the user.

## Risks

- Risk: The added `div` wrappers might slightly alter the alignment or margins of elements on large screens.
  - Impact: Low/Medium visual glitch.
  - Mitigation: Ensure we maintain the existing `gap` and `items-center` alignment properties on the new wrapper divs.

## Open Questions

- No unresolved ambiguity exists. All questions raised during explore mode have been answered (we will lay the groundwork for both global and per-card collapsing by adding labeled sections).

## Non-Goals

- Complete redesign of the combatant card visuals.
- Building the global "compact mode" state management.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
