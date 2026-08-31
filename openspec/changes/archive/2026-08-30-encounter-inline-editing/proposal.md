## GitHub Issues

- #607

## Why

- Problem statement: When editing an encounter that is far down in a long list, the edit panel opens at the top of the screen (which may not be visible). The user does not see the edit panel without scrolling up.
- Why now: Users are confused when they click edit and seemingly nothing happens because the edit panel is out of view.
- Business/user impact: Improves UX and removes confusion when managing encounters.

## Problem Space

- Current behavior: The `EncounterEditor` is conditionally rendered at the top of the encounters list when an encounter is being edited.
- Desired behavior: The edit panel should open in place, directly replacing the encounter card being edited.
- Constraints: The `EncounterEditor` is shared between editing existing encounters and creating new encounters. The creation workflow can remain at the top, but editing existing encounters must be inline.
- Assumptions: The `EncounterEditor` component can handle being rendered inline within the list without structural layout breakage.
- Edge cases considered: Empty states, linking encounters (for campaigns), and creating a new encounter while editing an existing one (which should probably just close the inline edit).

## Scope

### In Scope

- Update the global encounters page (`app/encounters/page.tsx`) to render `EncounterEditor` inline for existing encounters.
- Update the campaign encounters page (`app/campaigns/[id]/encounters/page.tsx`) to render `EncounterEditor` inline for existing encounters.

### Out of Scope

- Modifying the visual design or internal logic of the `EncounterEditor` itself.
- Changes to the backend APIs or encounter storage.

## What Changes

- Modify `app/encounters/page.tsx` mapping to conditionally swap `EncounterCard` with `EncounterEditor`.
- Modify `app/campaigns/[id]/encounters/page.tsx` mapping to conditionally swap `EncounterCard` with `EncounterEditor`.
- Remove the top-level `EncounterEditor` instances that were used for editing existing encounters.

## Risks

- Risk: Inline editor might not fit visually if the `EncounterCard` and `EncounterEditor` have drastically different layout constraints.
  - Impact: Low (it's already a responsive card).
  - Mitigation: Ensure we test the layout visually after inline placement.

## Open Questions

- Question: None. The requested behavior is well-defined.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Refactoring the entire encounters page structure.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
