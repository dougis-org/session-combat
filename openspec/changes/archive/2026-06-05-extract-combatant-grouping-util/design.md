## Context

- Relevant architecture: `lib/utils/combat.ts` — existing module of pure combatant data transformations (`applyDamage`, `applyHealing`, `useLegendaryAction`, etc.) importing `CombatantState` from `lib/types`. `lib/components/CombatInfoIcon.tsx` — React component with hover-triggered tooltip; currently does grouping inline.
- Dependencies: `CombatantState` type from `lib/types` (already imported in `combat.ts`).
- Interfaces/contracts touched: `CombatInfoIcon` internal data flow only. No props, no exports, no parent components change.

## Goals / Non-Goals

### Goals

- Isolate the grouping logic into a pure, exported, independently-testable function
- Leave `CombatInfoIcon` behavior, props, and render output identical

### Non-Goals

- Adding tests for the extracted function (out of scope per proposal)
- Changing any other function in `combat.ts`
- Modifying `CombatInfoIcon` beyond removing the inline logic

## Decisions

### Decision 1: Placement in `lib/utils/combat.ts`

- Chosen: Add `groupCombatantsForDisplay` to the existing `lib/utils/combat.ts`
- Alternatives considered: Co-locate alongside the component (`lib/components/combatInfoIcon.utils.ts`); create a new `lib/utils/combatDisplay.ts`
- Rationale: `combat.ts` already owns pure `CombatantState` transformations and already imports the type. No new file needed. Consistent with project pattern.
- Trade-offs: Slightly mixes "display" logic into a file otherwise concerned with mechanics — acceptable given the function is pure and the project doesn't yet distinguish display utils from mechanic utils.

### Decision 2: Return type shape `GroupedCombatants`

- Chosen: Nested structure `{ alive: { players, monsters }, dead: { players, monsters }, totals: { players, monsters } }`
- Alternatives considered: Flat object with 6 keys (`alivePlayersByName`, `aliveMonstersByName`, etc.)
- Rationale: Richer structure is self-documenting; callers destructure `alive.players` rather than `alivePlayersByName`. Matches the user's stated preference confirmed in exploration.
- Trade-offs: Slightly more destructuring at call site; negligible.

### Decision 3: `totals` counts alive combatants only

- Chosen: `totals.players` and `totals.monsters` reflect only alive combatants
- Alternatives considered: Count all combatants regardless of alive/dead status
- Rationale: Matches existing component behavior — the `PLAYERS (N)` header shows alive count. Dead combatants appear separately in the DEFEATED section.
- Trade-offs: None — this is a direct lift of the existing calculation.

## Proposal to Design Mapping

- Proposal element: Extract filtering + grouping from `CombatInfoIcon`
  - Design decision: Decision 1 (placement), Decision 2 (return shape)
  - Validation approach: Existing `CombatInfoIcon.test.tsx` suite must pass unchanged

- Proposal element: `groupCombatantsForDisplay` exported from `lib/utils/combat.ts`
  - Design decision: Decision 1
  - Validation approach: Import resolves; TypeScript compiles cleanly

- Proposal element: `totals` counts alive combatants only
  - Design decision: Decision 3
  - Validation approach: Column heading tests (`PLAYERS (1)`, `MONSTERS (0)`) in existing test suite

## Functional Requirements Mapping

- Requirement: Alive/dead split preserves `hp > 0` / `hp <= 0` boundary
  - Design element: `groupCombatantsForDisplay` filter logic
  - Acceptance criteria reference: specs/grouping.md — alive/dead split
  - Testability notes: Direct unit test on the function; also covered by existing component tests

- Requirement: Combatants grouped by type then name into `Map<string, CombatantState[]>`
  - Design element: `groupCombatantsForDisplay` grouping logic
  - Acceptance criteria reference: specs/grouping.md — grouping by type and name
  - Testability notes: Assert Map keys and values for same-name and different-name inputs

- Requirement: `CombatInfoIcon` render output unchanged
  - Design element: Component calls `groupCombatantsForDisplay` and destructures result
  - Acceptance criteria reference: All existing `CombatInfoIcon.test.tsx` cases
  - Testability notes: No new component tests needed; existing suite is the regression guard

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No runtime behavior change
  - Design element: Pure extraction — logic is moved not modified
  - Acceptance criteria reference: Existing test suite green
  - Testability notes: TypeScript strict mode; existing tests provide full behavioral coverage

- Requirement category: operability
  - Requirement: Function is exported and accessible to future test files
  - Design element: `export function groupCombatantsForDisplay` in `combat.ts`
  - Acceptance criteria reference: TypeScript compilation succeeds
  - Testability notes: Import from `@/lib/utils/combat` in a future test file

## Risks / Trade-offs

- Risk/trade-off: Accidental logic change during extraction (e.g., wrong filter predicate)
  - Impact: Incorrect alive/dead bucketing; wrong counts in tooltip
  - Mitigation: Existing component tests cover all split/grouping/count scenarios; they serve as the regression gate

## Rollback / Mitigation

- Rollback trigger: Any existing `CombatInfoIcon` test fails after the change
- Rollback steps: Revert `lib/utils/combat.ts` addition and `lib/components/CombatInfoIcon.tsx` edit; no data or config changes involved
- Data migration considerations: None
- Verification after rollback: Run `npm test -- --testPathPattern CombatInfoIcon`

## Operational Blocking Policy

- If CI checks fail: Do not merge; fix the failing test or TypeScript error before proceeding
- If security checks fail: N/A — no auth, network, or dependency changes
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to project owner after 48 hours
- Escalation path and timeout: Project owner (@dougis) after 48-hour stale review

## Open Questions

No open questions. All decisions confirmed during exploration and proposal phases.
