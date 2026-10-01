## Phase 1: Core Logic

- [x] Task 1.1: Update `sortCombatants` in `lib/utils/combat.ts`
  - Modify sorting logic so that if `!a.initiativeRoll && !b.initiativeRoll` is true for both combatants, sort `monster` before `player`.
  - Add unit tests for `sortCombatants` to verify unrolled monsters sort before unrolled players, but rolled monsters still sort below rolled players on ties.

- [x] Task 1.2: Add `rollUnrolledMonsters` to `useCombat`
  - In `lib/hooks/useCombat.ts`, delete the unused `rollInitiative` function.
  - Add `rollUnrolledMonsters(advantage?: boolean, flatBonus?: number)` function.
  - Implement logic to map over `combatState.combatants`, find `c.type === 'monster'` and `!c.initiativeRoll`.
  - For those, apply the passed advantage/flatBonus and use `buildInitiativeRoll` to generate the roll. Save the state.
  - Expose `rollUnrolledMonsters` from the hook.

## Phase 2: UI Updates

- [x] Task 2.1: Pass props to `InitiativeEntry`
  - In `lib/components/ActiveCombatView.tsx`, calculate `unrolledMonsterCount = combatState.combatants.filter(c => c.type === 'monster' && !c.initiativeRoll).length`.
  - Pass `unrolledMonsterCount` and `onRollAllMonsters={(adv, fb) => rollUnrolledMonsters(adv, fb)}` to the `InitiativeEntry` component.

- [x] Task 2.2: Add Batch Roll Button
  - In `lib/components/InitiativeEntry.tsx`, update the `InitiativeEntryProps` interface.
  - Render a new button (e.g., "Roll d20 for all X unrolled Monsters") beneath the standard set buttons if `combatant.type === 'monster'` and `unrolledMonsterCount > 1`.
  - The button onClick should call `onRollAllMonsters?.(advantage, flatBonus)`.
  - Ensure styling fits with existing buttons (using standard Tailwind colors used in the component).

## Phase 3: Review and Delivery

- [x] Task 3.1: Local AI Code Review
  - Run the `openspec-review-code` skill or `pr-reviewer-toolkit` on the local changes before committing.
  - Fix any issues identified.
- [x] Task 3.2: PR Review
  - Create Pull Request
  - Wait for CI checks (Lint, Typecheck, Tests)
  - Address any reviewer feedback
- [x] Task 3.3: Merge
  - Wait for required approvals
  - Merge to `main`
