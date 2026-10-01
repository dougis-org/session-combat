## GitHub Issues

- #798

## Why

- Problem statement: When entering combat with multiple unrolled monsters, DMs are forced to roll and click through the Initiative Entry modal for each monster one-by-one, which is tedious and slow.
- Why now: Addressed as part of UX improvements for encounter setup.
- Business/user impact: Greatly speeds up the transition into combat by allowing bulk initiative rolling for monsters.

## Problem Space

- Current behavior: `useInitiativeModal` targets the first unrolled combatant (usually a player, if mixed with monsters due to the type tiebreaker). DMs roll one-by-one.
- Desired behavior: Unrolled monsters sort above unrolled players. When the modal opens for a monster, if there are multiple unrolled monsters, a "Roll all unrolled Monsters" button is available to batch-roll them all at once using the advantage/flat-bonus settings set in that modal.
- Constraints: The existing (and unused) `rollInitiative` function in `useCombat` overwrites everyone's initiative, so it is dangerous and must be replaced.
- Assumptions: Batch-rolled monsters will use the currently selected advantage and flat bonus from the modal they are rolled from.
- Edge cases considered: 
  - Applying advantage/flat bonus to the entire batch (desired for DM fiat).
  - Combatants without dexterity scores (defaulted safely in `buildInitiativeRoll`).

## Scope

### In Scope

- Deleting the unused `rollInitiative` from `useCombat`.
- Adding a new `rollUnrolledMonsters(advantage, flatBonus)` helper.
- Modifying `sortCombatants` to group unrolled monsters before unrolled players.
- Adding a "Roll d20 for all unrolled Monsters" button to `InitiativeEntry.tsx` that triggers the batch roll.

### Out of Scope

- Changing how player characters enter initiative (they remain manual/individual).
- Batch rolling specific selections of monsters (it's all unrolled monsters or none).

## What Changes

- `lib/utils/combat.ts`: Adjust `sortCombatants` type sorting specifically for the unrolled case.
- `lib/hooks/useCombat.ts`: Remove `rollInitiative`, add `rollUnrolledMonsters`.
- `lib/components/ActiveCombatView.tsx`: Pass unrolled monster count and roll handler to `InitiativeEntry`.
- `lib/components/InitiativeEntry.tsx`: Render the batch roll button when applicable.

## Risks

- Risk: Modifying `sortCombatants` could break initiative ties for already-rolled combatants.
  - Impact: Incorrect turn order.
  - Mitigation: The sort change will explicitly only apply when `!a.initiativeRoll && !b.initiativeRoll`.

## Open Questions

- All open questions resolved during exploration. Proceeding directly.

## Non-Goals

- Refactoring the entire combat state machine.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
