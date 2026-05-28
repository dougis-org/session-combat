## Context

- Relevant architecture: `lib/components/CombatantCard.tsx` (486 lines) is the primary combat UI component. Damage logic delegates to `applyTypedDamage` (module-local wrapper) → `calcApplyDamage` / `calcApplyDamageWithType` (imported). HP history is persisted to localStorage via `pushHpHistory`/`getHpHistoryStack`.
- Dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — all installed via #254.
- Interfaces/contracts touched: `CombatantCard` props (`combatant: CombatantState`, `onUpdate`, `combatId`). No production code changes.

## Goals / Non-Goals

### Goals

- Exercise all uncovered lines in `CombatantCard.tsx` lines 518–735 with RTL tests
- Reach ≥65% branch coverage for `CombatantCard.tsx`
- Tests pass in CI with `npm test`

### Non-Goals

- Migrating existing tests to RTL
- Testing damage math at unit level
- Production code changes

## Decisions

### Decision 1: Split into a new test file

- Chosen: `tests/unit/components/CombatantCard.hp.test.tsx`
- Alternatives considered: Extend `CombatantCard.test.tsx` in place
- Rationale: The existing file uses a local `render()` function that conflicts with RTL's `render`. Mixing patterns creates confusion and import conflicts. A clean file is easier to review and extend.
- Trade-offs: Two files to maintain; mitigated by the fact that they cover distinct areas (badges/undo vs. HP/damage/conditions).

### Decision 2: Use `userEvent.setup()` for all interactions

- Chosen: `const user = userEvent.setup()` + `await user.type(...)`, `await user.selectOptions(...)`, `await user.click(...)`
- Alternatives considered: Bare `fireEvent` calls (faster, but doesn't simulate real browser events)
- Rationale: `userEvent` fires the full event sequence (focus, input, change, blur) matching how a real user interacts with the HP number input and damage type select. `fireEvent` would miss React synthetic event handling quirks.
- Trade-offs: Async `await` required throughout; tests are slightly slower but more realistic.

### Decision 3: Assert HP bar width via inline style, not Tailwind class

- Chosen: `expect(healthBar).toHaveStyle({ width: '100%' })` (or the computed percent string)
- Alternatives considered: Asserting `bg-green-500` / `bg-red-500` class presence
- Rationale: jsdom does not process Tailwind's CSS, so class-based color assertions always pass vacuously. Inline style (set via `style={{ width: \`${hpPercent}%\` }}`) is the only reliable assertion surface.
- Trade-offs: Color thresholds (green/yellow/red) cannot be directly asserted — documented as a known gap.

### Decision 4: Dead state asserted via emoji text content

- Chosen: `expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('☠️')`
- Alternatives considered: `data-testid="dead-indicator"` attribute on the emoji
- Rationale: The emoji is rendered inline in the `<h3>` when `hp <= 0`. No `data-testid` exists and adding one would be a production code change (out of scope). Text content assertion is sufficient.
- Trade-offs: Brittle to emoji changes in the component; acceptable since the emoji is a stable design choice.

### Decision 5: Condition toggle tested via text + button queries

- Chosen: `screen.getByRole('button', { name: /Conditions \(1\)/ })` to expand, then `screen.getByRole('button', { name: 'Remove' })` to assert removal calls `onUpdate`
- Alternatives considered: `data-testid` on condition rows
- Rationale: No `data-testid` on condition markup; RTL role/text queries are the correct RTL-idiomatic approach and work without production code changes.
- Trade-offs: Query relies on condition count format string — stable given the component template.

## Proposal to Design Mapping

- Proposal element: HP bar width/color coverage
  - Design decision: Decision 3 (inline style assertion)
  - Validation approach: `data-testid="health-bar"` style.width checked at 100%, ~50%, and near-zero ratios

- Proposal element: Dead state (☠️ emoji)
  - Design decision: Decision 4 (emoji text content)
  - Validation approach: Render combatant with `hp: 0`, assert heading contains ☠️

- Proposal element: Damage application (normal/resistance/immunity/vulnerability)
  - Design decision: Decision 2 (userEvent interactions)
  - Validation approach: `userEvent.type` HP input → `userEvent.selectOptions` damage type → `userEvent.click` Damage button → assert `onUpdate` called with expected `{ hp, tempHp }`

- Proposal element: Temp HP drain
  - Design decision: Decision 2 (userEvent interactions)
  - Validation approach: Fixture with `tempHp: 5`, apply damage ≤ 5 (drains only temp), apply damage > 5 (spills to real HP)

- Proposal element: Condition display and toggle
  - Design decision: Decision 5 (text + button queries)
  - Validation approach: Render with `conditions: [...]`, expand panel, assert text, click Remove, assert `onUpdate` called with filtered array

- Proposal element: New file vs. extending existing
  - Design decision: Decision 1 (new file)
  - Validation approach: CI runs both test files; both pass

## Functional Requirements Mapping

- Requirement: HP bar reflects hp/maxHp ratio
  - Design element: `data-testid="health-bar"` inline style assertion
  - Acceptance criteria reference: specs/hp-display/spec.md
  - Testability notes: Three cases — full (100%), half (~50%), near-zero (<25%)

- Requirement: Dead state visible when hp ≤ 0
  - Design element: ☠️ emoji text content in `<h3>`
  - Acceptance criteria reference: specs/hp-display/spec.md
  - Testability notes: Render with `hp: 0`; assert emoji present. Render with `hp: 1`; assert emoji absent.

- Requirement: Damage application with type modifiers
  - Design element: userEvent UI interactions → onUpdate assertion
  - Acceptance criteria reference: specs/damage-application/spec.md
  - Testability notes: One test per modifier type. Fixture controls modifiers via `damageResistances` etc.

- Requirement: Temp HP drains before real HP
  - Design element: userEvent UI interactions → onUpdate assertion
  - Acceptance criteria reference: specs/temp-hp/spec.md
  - Testability notes: Fixture with `tempHp` set; assert resulting `{ hp, tempHp }` in onUpdate call

- Requirement: Conditions display and removal
  - Design element: RTL role/text queries → onUpdate assertion
  - Acceptance criteria reference: specs/conditions/spec.md
  - Testability notes: Assert count button renders; expand panel; click Remove; assert onUpdate called with empty conditions array

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: All tests pass in CI (jsdom environment)
  - Design element: `@jest-environment jsdom` directive in new test file; localStorage.clear() in beforeEach
  - Acceptance criteria reference: All specs
  - Testability notes: CI runs `npm test` which includes both test files

## Risks / Trade-offs

- Risk/trade-off: HP color branch coverage gap (Tailwind classes not assertable in jsdom)
  - Impact: ~3 branches (green/yellow/red threshold) remain visually untested
  - Mitigation: HP bar width ratios still exercise the `hpPercent` calculation branches; color class assignment is a single ternary that can be tested if a `data-testid` is added in a future change

## Rollback / Mitigation

- Rollback trigger: CI fails on the new test file
- Rollback steps: Delete `tests/unit/components/CombatantCard.hp.test.tsx`; no production code changes to revert
- Data migration considerations: None
- Verification after rollback: `npm test` passes

## Operational Blocking Policy

- If CI checks fail: Fix the failing tests before merging; do not merge with failing tests
- If security checks fail: N/A — test-only change
- If required reviews are blocked/stale: Request re-review; do not bypass branch protection
- Escalation path and timeout: If blocked >48h, flag in the Testing Quality Initiative project board

## Open Questions

No open questions. All design decisions are resolved.
