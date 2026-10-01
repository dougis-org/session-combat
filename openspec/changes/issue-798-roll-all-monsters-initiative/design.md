## Context

- Relevant architecture: `ActiveCombatView` React component for tracking combat, `useInitiativeModal` for UI auto-popping, `useCombat` for global combat state management, `sortCombatants` for list ordering.
- Dependencies: React state, local `InitiativeRoll` generation.
- Interfaces/contracts touched: `CombatantState` (sort order), `UseCombatReturn` (adding `rollUnrolledMonsters`).

## Goals / Non-Goals

### Goals

- Allow batch rolling of initiative for all unrolled monsters with a single button click.
- Prevent overwriting of existing initiative rolls for any combatants.
- Improve UX by grouping unrolled monsters together at the top of the initiative list.

### Non-Goals

- Changing the default `TYPE_ORDER` for rolled combatants (players still win initiative ties against monsters).
- Automating player initiative rolls.

## Decisions

### Decision 1: Sort Unrolled Monsters Before Unrolled Players

- Chosen: Modify `sortCombatants` so that if both `a` and `b` lack an `initiativeRoll`, monsters are sorted before players.
- Alternatives considered: Using the default `TYPE_ORDER` (which puts players first), or adding a separate visual list for unrolled combatants.
- Rationale: Sorting monsters first naturally causes `useInitiativeModal` to target a monster first, presenting the batch-roll button immediately upon combat start.
- Trade-offs: Minor logic added to the sort function, but it integrates perfectly with existing auto-pop behavior.

### Decision 2: Replacing `rollInitiative` with `rollUnrolledMonsters(advantage, flatBonus)`

- Chosen: Delete the unused `rollInitiative` function. Create a new `rollUnrolledMonsters(advantage, flatBonus)` function in `useCombat` that maps over combatants, applies the given advantage/flatBonus to any `type === 'monster'` without an `initiativeRoll`, and calls `buildInitiativeRoll`.
- Alternatives considered: Batch rolling all combatants including players, or making the batch roll ignore UI settings for advantage/bonus.
- Rationale: The original `rollInitiative` overwrote existing rolls and included players, which was a bug waiting to happen. Passing advantage/flatBonus allows the DM to apply global modifiers (e.g. surprise) to the batch.
- Trade-offs: None.

### Decision 3: Render Batch Button in `InitiativeEntry`

- Chosen: Pass `unrolledMonsterCount` and `onRollAllMonsters` to `InitiativeEntry`. If the current combatant is a monster and `unrolledMonsterCount > 1`, render the batch roll button.
- Alternatives considered: Rendering the button globally next to the "Initiative Order" heading.
- Rationale: Placing it in the modal keeps all initiative actions localized to the same UI surface.
- Trade-offs: Button is only visible when the modal is focused on a monster.

## Proposal to Design Mapping

- Proposal element: Grouping unrolled monsters
  - Design decision: Decision 1: Sort Unrolled Monsters Before Unrolled Players
  - Validation approach: Unit tests for `sortCombatants` and manual UI testing.

- Proposal element: Delete dangerous `rollInitiative`
  - Design decision: Decision 2: Replacing `rollInitiative` with `rollUnrolledMonsters`
  - Validation approach: Compile check and manual testing to ensure no broken references.

- Proposal element: UI for batch rolling
  - Design decision: Decision 3: Render Batch Button in `InitiativeEntry`
  - Validation approach: Manual testing and unit testing of the component rendering.

## Functional Requirements Mapping

- Requirement: A button should be shown to roll all unrolled monsters when entering combat.
  - Design element: Decision 3
  - Acceptance criteria reference: Specs (to be written)
  - Testability notes: Mock `unrolledMonsterCount` and verify button presence/absence.

- Requirement: Existing initiative values should not be changed.
  - Design element: Decision 2
  - Acceptance criteria reference: Specs (to be written)
  - Testability notes: Verify `rollUnrolledMonsters` filters by `!c.initiativeRoll`.

- Requirement: Advantage/Flat Bonus should apply to the batch if selected.
  - Design element: Decision 2
  - Acceptance criteria reference: Specs (to be written)
  - Testability notes: Unit test `rollUnrolledMonsters` behavior when passed boolean/number arguments.

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Improved DM workflow efficiency.
  - Design element: Decision 1 & 3
  - Acceptance criteria reference: Specs
  - Testability notes: Verify modal auto-snaps to players after batch monster roll.

## Risks / Trade-offs

- Risk/trade-off: Modifying sorting logic could affect rolled tiebreakers if implemented incorrectly.
  - Impact: Incorrect turn order.
  - Mitigation: Strict conditional check `if (!a.initiativeRoll && !b.initiativeRoll)` before altering sort order.

## Rollback / Mitigation

- Rollback trigger: Sorting logic breaks combat order in production, or batch rolling overwrites player initiatives.
- Rollback steps: Revert the PR.
- Data migration considerations: None, combat state is volatile per-session.
- Verification after rollback: Verify manual entry works as before.

## Operational Blocking Policy

- If CI checks fail: Fix unit/integration tests before merging.
- If security checks fail: Address vulnerabilities immediately.
- If required reviews are blocked/stale: Ping code owners after 24h.
- Escalation path and timeout: N/A for small UI improvement.

## Open Questions

- None.
