## GitHub Issues

- #274

## Why

- Problem statement: `CombatInfoIcon` contains ~30 lines of pure data transformation (filtering alive/dead combatants, grouping by type and name) directly in the component body. This logic is unreachable by unit tests without rendering the full component.
- Why now: Issue #257 surfaced a coverage gap caused by this complexity. The refactor is a prerequisite to adding targeted unit tests for the grouping logic.
- Business/user impact: No user-visible change. Developer impact: the grouping logic becomes independently testable, and `CombatInfoIcon` becomes a thin render layer that is easier to reason about and test in isolation.

## Problem Space

- Current behavior: Lines 14–53 of `lib/components/CombatInfoIcon.tsx` filter combatants into alive/dead subsets and group each subset by type (`player`/monster) and name into four `Map` instances, then derive two totals — all inside the component function body.
- Desired behavior: A pure utility function `groupCombatantsForDisplay` lives in `lib/utils/combat.ts`, accepts `CombatantState[]`, and returns a structured result. `CombatInfoIcon` calls it and renders from the result.
- Constraints: `lib/utils/combat.ts` already imports `CombatantState` and houses pure combatant transformations — the new function fits naturally there with no new files required.
- Assumptions: No other component or utility currently performs equivalent grouping logic (no duplication to consolidate).
- Edge cases considered: Empty combatant array; all combatants dead; all combatants alive; multiple combatants with the same name (×N grouping); mixed player/monster in alive and dead subsets.

## Scope

### In Scope

- Extract filtering + grouping logic from `CombatInfoIcon` into `groupCombatantsForDisplay` in `lib/utils/combat.ts`
- Update `CombatInfoIcon` to call the utility and destructure its result
- Export the function so it is unit-testable

### Out of Scope

- Unit tests for `groupCombatantsForDisplay` (can follow separately per issue #274)
- Any behavior or visual changes to `CombatInfoIcon`
- Changes to any other component or utility

## What Changes

- `lib/utils/combat.ts` — new exported function `groupCombatantsForDisplay` with return type `GroupedCombatants`
- `lib/components/CombatInfoIcon.tsx` — remove inline data transformation; call `groupCombatantsForDisplay`; destructure `{ alive, dead, totals }`

## Risks

- Risk: Accidental behavior change during extraction (e.g., off-by-one in alive/dead filter boundary)
  - Impact: Incorrect display of combatant counts or DEFEATED section
  - Mitigation: Existing component tests cover all grouping scenarios; they must stay green after the refactor

## Open Questions

No unresolved ambiguity. All design decisions were confirmed in the exploration session:
- Placement: `lib/utils/combat.ts` (follows existing pattern, no new files)
- Return shape: nested `{ alive, dead, totals }` (richer, self-documenting)
- `totals` counts alive combatants only (matches current header count behavior)

## Non-Goals

- Adding new tests as part of this change
- Changing the public API or props of `CombatInfoIcon`
- Refactoring unrelated logic in `CombatInfoIcon` or `combat.ts`

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
