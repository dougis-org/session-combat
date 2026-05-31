## Context

- Relevant architecture: `CombatInfoIcon` is a self-contained presentational component at `lib/components/CombatInfoIcon.tsx`. It owns all grouping and display logic internally — no external hooks or stores.
- Dependencies: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (all installed). Jest config already covers `lib/**` and `tests/unit/**` with jsdom environment.
- Interfaces/contracts touched: `CombatantState` (type from `lib/types`) — specifically `id`, `name`, `type`, `hp`, `maxHp`, `ac`, `initiative`, `conditions`, `abilityScores`.

## Goals / Non-Goals

### Goals

- Full RTL coverage of all uncovered acceptance criteria from issue #62
- All assertions grounded in actual rendered output of the current component implementation
- Tests appended to existing file without disrupting the 6 passing tests

### Non-Goals

- Changing the component
- Snapshot or visual regression tests
- Coverage of other components

## Decisions

### Decision 1: Append tests to existing file, not a new file

- Chosen: Add new `describe` blocks to `tests/unit/components/CombatInfoIcon.test.tsx`
- Alternatives considered: New sibling file (e.g., `CombatInfoIcon.extended.test.tsx`)
- Rationale: Issue #62 calls for a single test file; splitting creates maintenance overhead with no benefit
- Trade-offs: File grows moderately; acceptable for a single focused component

### Decision 2: Ground all selectors in actual component output

- Chosen: Read component source before writing assertions; use exact text the component renders (`PLAYERS (N)`, `MONSTERS (N)`, `×N`, `DEFEATED`, `None`, `• conditionName (duration)`)
- Alternatives considered: Guessing/approximating selectors
- Rationale: Prevents false-failure tests that don't match real output; component source was reviewed in full
- Trade-offs: Tests are coupled to exact copy strings — acceptable for a presentational component

### Decision 3: Shared fixture helpers for new test data

- Chosen: Define additional fixture objects (e.g. `ALIVE_MONSTER`, `ALIVE_PLAYER_WITH_CONDITION`, duplicate-name combatants) alongside existing `ALIVE_PLAYER` / `DEAD_MONSTER`
- Alternatives considered: Inline anonymous objects per test
- Rationale: Keeps tests readable and avoids repetition across the new describe blocks
- Trade-offs: Minor increase in fixture boilerplate at the top of the file

## Proposal to Design Mapping

- Proposal element: Two-column layout with "Players" / "Monsters" headings
  - Design decision: Decision 2 — assert `PLAYERS (N)` and `MONSTERS (N)` text after hover
  - Validation approach: `screen.getByText(/PLAYERS \(\d+\)/)`

- Proposal element: Alive-count in column headers
  - Design decision: Decision 2 — assert exact counts (`PLAYERS (1)`, `MONSTERS (0)`, etc.)
  - Validation approach: Exact text match or regex against column heading

- Proposal element: ×N grouping for same-name combatants
  - Design decision: Decision 3 — fixture with two combatants sharing a name; assert `×2` text
  - Validation approach: `screen.getByText('×2')`

- Proposal element: Status conditions with durations
  - Design decision: Decision 3 — fixture with `conditions: [{ id, name, duration }]`; assert `• Poisoned (3)` text in yellow-class element
  - Validation approach: `screen.getByText(/• Poisoned \(3\)/)`

- Proposal element: Horizontal delimiter between alive and dead
  - Design decision: Decision 2 — assert `DEFEATED` heading appears when dead combatants exist
  - Validation approach: `screen.getByText(/DEFEATED/i)` (component renders a `<div class="border-t ...">` + DEFEATED label)

- Proposal element: Strikethrough on dead combatants
  - Design decision: Decision 2 — assert dead combatant name has `line-through` class
  - Validation approach: `expect(el.closest('.line-through')).toBeInTheDocument()`

- Proposal element: "None" text when no alive combatants of a type
  - Design decision: Decision 2 — render only monsters, assert "None" appears in Players column area
  - Validation approach: `screen.getByText('None')` (component renders `<p class="... italic">None</p>`)

- Proposal element: Independent columns alive+dead sections
  - Design decision: Decision 3 — fixture mixing alive player + dead monster; assert both columns show appropriate sections
  - Validation approach: Multiple `getByText` / `queryByText` calls

- Proposal element: Empty state (no combatants)
  - Design decision: Decision 2 — render with `[]`; assert "No combatants" text after hover
  - Validation approach: `screen.getByText(/No combatants/i)`

## Functional Requirements Mapping

- Requirement: Two-column headings visible after hover
  - Design element: Decision 2
  - Acceptance criteria reference: issue #62 "Two-column layout renders with Players and Monsters headings"
  - Testability notes: Column headings are plain text nodes, easily queried by regex

- Requirement: Only alive combatants counted in header
  - Design element: Decision 2
  - Acceptance criteria reference: issue #62 "Only alive combatants are counted in column headers"
  - Testability notes: Render a mix of alive + dead; assert count in heading matches only alive

- Requirement: ×N grouping
  - Design element: Decision 3
  - Acceptance criteria reference: issue #62 "Combatants with the same name are grouped with a ×N multiplier"
  - Testability notes: Component renders `×{group.length}` as a `<span>` — query by text `×2`

- Requirement: Status conditions with durations in yellow
  - Design element: Decision 3
  - Acceptance criteria reference: issue #62 "Status conditions display with their remaining durations in yellow"
  - Testability notes: Component renders `• {name} ({duration})` in a `text-yellow-400` div — assert text; optionally assert class

- Requirement: Delimiter and DEFEATED label
  - Design element: Decision 2
  - Acceptance criteria reference: issue #62 "A horizontal delimiter separates alive from dead combatants"
  - Testability notes: DEFEATED label is the queryable signal for the delimiter section

- Requirement: Strikethrough on dead combatants
  - Design element: Decision 2
  - Acceptance criteria reference: issue #62 "Dead combatants appear with strikethrough styling below the delimiter"
  - Testability notes: Nearest ancestor with `line-through` class; use `closest()`

- Requirement: "None" fallback text
  - Design element: Decision 2
  - Acceptance criteria reference: issue #62 "'None' text shows in a column when no alive combatants of that type exist"
  - Testability notes: `<p class="... italic">None</p>` — query by text

- Requirement: Independent column sections
  - Design element: Decision 3
  - Acceptance criteria reference: issue #62 "Both columns independently show alive and dead sections"
  - Testability notes: Mixed fixture; assert one column has DEFEATED while the other does not

- Requirement: Empty state
  - Design element: Decision 2
  - Acceptance criteria reference: issue #62 "Empty state (no combatants at all) renders without errors"
  - Testability notes: Render with `[]`; assert "No combatants" text

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Tests must not flake; hover interactions must be deterministic
  - Design element: Use `userEvent.setup()` (already established in existing tests)
  - Acceptance criteria reference: N/A — test quality concern
  - Testability notes: `@testing-library/user-event` v14 setup pattern already proven in existing tests

## Risks / Trade-offs

- Risk/trade-off: Condition fixture shape must match `CombatantState['conditions']` exactly
  - Impact: Type error or runtime mismatch causes test to always pass/fail incorrectly
  - Mitigation: Read `lib/types.ts` before writing fixtures to confirm condition object shape

## Rollback / Mitigation

- Rollback trigger: New tests fail unexpectedly after merge
- Rollback steps: Revert the test file to the previous 6-test state; no production code was changed
- Data migration considerations: None
- Verification after rollback: `npx jest tests/unit/components/CombatInfoIcon.test.tsx --no-coverage` passes

## Operational Blocking Policy

- If CI checks fail: Investigate test failures; do not merge until all pass
- If security checks fail: N/A — test-only change with no new dependencies
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate after 48 hours
- Escalation path and timeout: Tag repo owner after 48 hours of no review activity

## Open Questions

No open questions. Component source, existing tests, and issue #62 fully specify the required behaviour.
