## Context

- Relevant architecture: Five components in `lib/components/` at 0% coverage: `LegendaryActionsPanel.tsx` (100 lines), `LairActionsSlot.tsx` (123 lines), `InitiativeEntry.tsx` (271 lines), `CombatInfoIcon.tsx` (200 lines), `Modal.tsx` (53 lines). All are used in the active combat UI. The first RTL tests for this project landed in PR 272 (`CombatantCard.hp.test.tsx`) — that file is the canonical pattern to follow.
- Dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — installed via #254. `jest.setup.ts` imports `@testing-library/jest-dom`. Confirmed working in CI via PR 272.
- Interfaces/contracts touched: Component props only. No production code changes.

## Goals / Non-Goals

### Goals

- Reach ≥80% statement coverage for each of the 5 components
- Establish one clean RTL test file per component in `tests/unit/components/`
- All tests pass in CI with `npm test`

### Non-Goals

- Migrating existing tests to RTL
- Production code changes
- Achieving 100% coverage
- Extracting `CombatInfoIcon` grouping logic (tracked in #274)

## Decisions

### Decision 1: One test file per component, new files only

- Chosen: `tests/unit/components/LegendaryActionsPanel.test.tsx`, `LairActionsSlot.test.tsx`, `InitiativeEntry.test.tsx`, `CombatInfoIcon.test.tsx`, `Modal.test.tsx`
- Alternatives considered: Combining all five into a single test file
- Rationale: Mirrors the PR 272 pattern (one file per component). Easier to navigate, scope failures, and extend. Consistent with what already exists in `tests/unit/components/`.
- Trade-offs: Five files to maintain; trivial given each covers a distinct component.

### Decision 2: Follow PR 272 file structure exactly

- Chosen: `@jest-environment jsdom` directive → `jest.mock` for `next/link` and `next/navigation` → React/RTL imports → component import → type import → BASE fixture → `renderX(overrides)` helper → `beforeEach(() => localStorage.clear())` → `describe` blocks grouped by behavior area
- Alternatives considered: Variations in mock placement or fixture shape
- Rationale: Consistency with the established pattern reduces cognitive load and avoids import conflicts (RTL's `render` vs any local helper named `render`).
- Trade-offs: Must verify each component's actual Next.js dependency — `Modal` and `LegendaryActionsPanel` may not need Next.js mocks, but including them is harmless and keeps the template uniform.

### Decision 3: `userEvent.setup()` for all interactions

- Chosen: `const user = userEvent.setup()` + `await user.click(...)`, `await user.type(...)` throughout
- Alternatives considered: `fireEvent` for simpler cases
- Rationale: PR 272 Decision 2 — `userEvent` fires the full event sequence matching real browser behavior. Keeps the codebase consistent.
- Trade-offs: All interaction tests require `async/await`; minor overhead, more realistic.

### Decision 4: `InitiativeEntry` — integration-style, three modes tested separately

- Chosen: Render the component with a known `combatant` fixture, interact with mode tabs and inputs, assert on `onSet` callback args. Three `describe` blocks: `roll mode`, `dice mode`, `total mode`.
- Alternatives considered: Unit testing internal state functions directly
- Rationale: `InitiativeEntry` has local `useState` (3 modes), a `useEffect` with `document.addEventListener`, and calls imported helpers (`buildInitiativeRoll`, `getDexInitiativeBonus`). Component-level integration testing is the right granularity — it tests the wiring, not the math.
- Trade-offs: `Math.random` used in roll mode → assert result is in valid range (1–20 + dex bonus) rather than exact value. `window.alert` for invalid dice input → spy with `jest.spyOn(window, 'alert').mockImplementation(() => {})`.

### Decision 5: `CombatInfoIcon` — tooltip toggle + rendered fixture output

- Chosen: Two `describe` blocks: (1) tooltip visibility toggle (click to show, click to hide); (2) rendered output with a known combatant array (assert player/monster group text appears).
- Alternatives considered: Skipping rendered output tests until #274 refactor lands
- Rationale: The grouping logic is baked into the component — we get coverage by exercising the render path with a fixture. Simple, no production changes needed, achieves the 80% target.
- Trade-offs: Tests are slightly coupled to the rendered structure (group labels, combatant names). Acceptable for a coverage goal; can be refined after #274.

### Decision 6: `LairActionsSlot` — two render paths for `isActive`

- Chosen: One `describe` for the inactive pill render, one for the active expanded panel (with spend/restore interactions).
- Alternatives considered: Single describe with `isActive` as a variable
- Rationale: The two paths have completely different rendered output. Separate describes make the intent clear and the tests easier to read.
- Trade-offs: Slight duplication of fixture setup; mitigated by a shared `BASE_COMBATANT` constant.

### Decision 7: `Modal` — thin wrapper, minimal tests

- Chosen: Three tests: renders children, renders title when provided, close button calls `onClose`, renders nothing when `isOpen: false`.
- Alternatives considered: More exhaustive tests on class/style assertions
- Rationale: `Modal` is 53 lines — a pure render wrapper. Four tests cover all meaningful branches. jsdom won't assert CSS so we focus on DOM presence and callback firing.
- Trade-offs: Color/animation branches uncoverable without a real browser; acceptable at this coverage target.

## Proposal to Design Mapping

- Proposal element: One RTL test file per component
  - Design decision: Decision 1 (one file per component)
  - Validation approach: Five new files appear in `tests/unit/components/` after implementation

- Proposal element: Follow PR 272 patterns
  - Design decision: Decision 2 (exact file structure) + Decision 3 (`userEvent.setup()`)
  - Validation approach: Each file opens with `@jest-environment jsdom`, Next.js mocks, RTL imports, BASE fixture, `renderX` helper

- Proposal element: `InitiativeEntry` integration-style
  - Design decision: Decision 4 (three describe blocks, `Math.random` range assertion, `alert` spy)
  - Validation approach: `onSet` called with valid `{ roll, bonus, total, method }` shape

- Proposal element: `CombatInfoIcon` tooltip + rendered output
  - Design decision: Decision 5 (toggle + fixture render)
  - Validation approach: Tooltip hidden on mount, visible after click; combatant names appear in rendered output

- Proposal element: `LairActionsSlot` two render paths
  - Design decision: Decision 6 (separate describes per `isActive`)
  - Validation approach: Inactive path renders pill; active path renders full panel with spend/restore buttons

- Proposal element: `Modal` minimal
  - Design decision: Decision 7 (four tests: children, title, close, isOpen:false)
  - Validation approach: RTL `queryBy*` for hidden state; `toBeInTheDocument` for visible state

## Functional Requirements Mapping

- Requirement: `LegendaryActionsPanel` — spend button decrements remaining count
  - Design element: `userEvent.click` on spend button → assert `onUpdate` called with decremented payload
  - Acceptance criteria reference: specs/legendary-actions-panel/spec.md
  - Testability notes: `decrementLegendaryPool` is deterministic given known fixture; assert exact `onUpdate` arg

- Requirement: `LegendaryActionsPanel` — restore button resets to full count
  - Design element: `userEvent.click` on restore button → assert `onUpdate` called with full count
  - Acceptance criteria reference: specs/legendary-actions-panel/spec.md
  - Testability notes: `data-testid="legendary-action-restore"` already on the restore button in production code

- Requirement: `LairActionsSlot` — inactive render shows pill with name and initiative
  - Design element: Render with `isActive: false` → assert name and initiative text present
  - Acceptance criteria reference: specs/lair-actions-slot/spec.md
  - Testability notes: Straightforward text content assertions

- Requirement: `LairActionsSlot` — active render shows restore-all button
  - Design element: Render with `isActive: true` → `data-testid="lair-action-restore-all"` present
  - Acceptance criteria reference: specs/lair-actions-slot/spec.md
  - Testability notes: `data-testid` already on the restore-all button in production code

- Requirement: `InitiativeEntry` — dice mode validates 1–20 range
  - Design element: Enter value < 1 or > 20 → spy on `window.alert` → assert alert called; `onSet` not called
  - Acceptance criteria reference: specs/initiative-entry/spec.md
  - Testability notes: `jest.spyOn(window, 'alert').mockImplementation(() => {})`

- Requirement: `CombatInfoIcon` — tooltip toggle
  - Design element: Click icon → tooltip visible; click again → tooltip hidden
  - Acceptance criteria reference: specs/combat-info-icon/spec.md
  - Testability notes: Assert on `toBeInTheDocument` / `not.toBeInTheDocument` for tooltip container

- Requirement: `Modal` — hidden when `isOpen: false`
  - Design element: Render with `isOpen: false` → assert modal content not in document
  - Acceptance criteria reference: specs/modal/spec.md
  - Testability notes: `queryByRole('dialog')` or `queryByText(title)` returning null

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: All tests pass in jsdom CI environment
  - Design element: `@jest-environment jsdom` directive in every test file; `localStorage.clear()` in `beforeEach`
  - Acceptance criteria reference: All specs
  - Testability notes: CI runs `npm test`; all five new files must pass

## Risks / Trade-offs

- Risk/trade-off: `Math.random` in `InitiativeEntry` roll mode makes exact assertions impossible
  - Impact: Low — roll mode output is still verifiable as within valid range
  - Mitigation: Assert `total >= 1 + dexBonus` and `total <= 20 + dexBonus + flatBonus`; or spy on `Math.random` to return a fixed value

- Risk/trade-off: `CombatInfoIcon` grouping logic coupled to component — tests brittle if template changes
  - Impact: Low — acceptable for coverage goal; refactor in #274 will decouple
  - Mitigation: Use role/text queries rather than DOM structure; prefer `getByText(combatantName)` over `querySelector`

- Risk/trade-off: Tailwind classes not applied in jsdom
  - Impact: None — no test in scope requires CSS color assertions
  - Mitigation: N/A

## Rollback / Mitigation

- Rollback trigger: CI fails on any of the five new test files
- Rollback steps: Delete the failing test file(s); no production code to revert
- Data migration considerations: None
- Verification after rollback: `npm test` passes without the deleted file(s)

## Operational Blocking Policy

- If CI checks fail: Fix the failing tests before merging; do not merge with failing checks
- If security checks fail: N/A — test-only change
- If required reviews are blocked/stale: Request re-review; do not bypass branch protection with `--admin`
- Escalation path and timeout: If blocked >48h, flag in the Testing Quality Initiative project board

## Open Questions

No open questions. All design decisions are resolved based on PR 272 patterns, component inspection, and issue #257 acceptance criteria.
