## Context

- Relevant architecture: Unit tests live under `tests/unit/`. Component tests use RTL (`@testing-library/react`, `@testing-library/user-event`) with Jest + jsdom. The global Jest config (`jest.config.js`) already sets `testEnvironment: "jsdom"` and `jest.setup.ts` sets `IS_REACT_ACT_ENVIRONMENT = true`.
- Dependencies: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (all installed via #254).
- Interfaces/contracts touched: The 4 test files only. No production code changes. `tests/unit/helpers/reactRoot.ts` is untouched (still needed by `CampaignEditor.test.tsx`).

## Goals / Non-Goals

### Goals

- Replace `createReactRoot` / `unmountReactRoot` / `act` boilerplate with RTL `render` in all 4 files
- Adopt semantic RTL queries (`getByRole`, `getByText`, `getByTestId`) in place of `container.textContent` / `container.querySelector`
- Use `userEvent.setup()` per-test for click interactions (project convention)
- All 4 files pass `npm run test:unit` with zero regressions

### Non-Goals

- Migrating `CampaignEditor.test.tsx`
- Deleting `reactRoot.ts`
- Adding new test coverage
- Changing production components

## Decisions

### Decision 1: Query strategy — semantic RTL queries (Option B)

- Chosen: Use `getByRole`, `getByText`, `getByTestId`, `getByLabelText` where applicable. Fall back to `getByTestId` for elements without accessible names.
- Alternatives considered: Option A (minimal swap — `container.textContent.toContain` → `screen.getByText(...).textContent`). Rejected: doesn't improve test quality or accessibility signal.
- Rationale: Role-based queries verify the component renders accessible elements, not just raw DOM text. Consistent with RTL's design philosophy and the project's existing higher-quality tests.
- Trade-offs: Requires understanding each component's DOM structure. If a component lacks accessible names, `getByRole` will throw and `getByTestId` is the fallback.

### Decision 2: Interaction style — `userEvent.setup()` per test

- Chosen: `const user = userEvent.setup()` inside each `test()` block, then `await user.click(element)`.
- Alternatives considered: `fireEvent.click(element)` (synchronous, no setup needed). Rejected: project convention uses `userEvent` (`CombatantCard.callbacks.test.tsx`, `ActiveCombatView.test.tsx`, `LegendaryActionsPanel.test.tsx`).
- Rationale: Consistency with the rest of the test suite. `userEvent` more accurately simulates real browser interactions.
- Trade-offs: Requires `async/await` in tests that have click interactions. Tests that only verify render output (no clicks) don't need `userEvent`.

### Decision 3: Async render wrapping

- Chosen: Drop `async act(() => { root.render(...) })` entirely. Use synchronous `render(<Component />)` from RTL.
- Alternatives considered: Keep `await act(...)` wrappers. Rejected: RTL's `render` wraps in `act` internally; double-wrapping is noise.
- Rationale: RTL handles `act` automatically. Explicit `act` wrapping is only needed for state updates triggered outside of RTL's event system.
- Trade-offs: None — this is strictly simpler.

### Decision 4: `reactRoot.ts` lifecycle

- Chosen: Leave `tests/unit/helpers/reactRoot.ts` untouched. Do not delete.
- Rationale: `tests/unit/components/CampaignEditor.test.tsx` still imports it. Deletion is deferred to the #356 migration.
- Trade-offs: The helper file remains in the codebase temporarily, which is acceptable given it's clearly tagged for removal.

## Proposal to Design Mapping

- Proposal element: Replace `createReactRoot`/`act` setup
  - Design decision: Decision 3 (drop async `act` wrapping, use RTL `render`)
  - Validation approach: Tests compile and pass; no `act` warnings in Jest output

- Proposal element: Replace `container.textContent.toContain` assertions
  - Design decision: Decision 1 (semantic RTL queries)
  - Validation approach: Assertions use `screen.getBy*` + `toBeInTheDocument()` or `toHaveTextContent`

- Proposal element: Replace `querySelectorAll('button').find(...)` in `LairForm`
  - Design decision: Decision 1 (`getByRole('button', { name: /.../ })`)
  - Validation approach: Button queries match accessible name

- Proposal element: Replace `el.click()` / `btn.click()` interactions
  - Design decision: Decision 2 (`userEvent.setup()` + `await user.click()`)
  - Validation approach: Callback mocks receive expected call counts

- Proposal element: Do not delete `reactRoot.ts`
  - Design decision: Decision 4
  - Validation approach: `CampaignEditor.test.tsx` still imports and passes

## Functional Requirements Mapping

- Requirement: All 4 files use RTL `render` / `screen` queries
  - Design element: Decisions 1, 2, 3
  - Acceptance criteria reference: specs/rtl-migration/spec.md — AC1
  - Testability notes: `npm run test:unit` must pass; grep confirms no `createReactRoot` imports remain in the 4 files

- Requirement: No imports from `@/tests/unit/helpers/reactRoot` in the 4 migrated files
  - Design element: Decision 3
  - Acceptance criteria reference: specs/rtl-migration/spec.md — AC2
  - Testability notes: `grep "reactRoot" tests/unit/LairForm.test.tsx tests/unit/CharacterMiniSummary.test.tsx tests/unit/LairActionsSlot.test.tsx tests/unit/CombatStatsRow.test.tsx` returns no matches

- Requirement: `npm test` passes with zero regressions
  - Design element: All decisions
  - Acceptance criteria reference: specs/rtl-migration/spec.md — AC3
  - Testability notes: Full unit test run must be green

## Non-Functional Requirements Mapping

- Requirement category: maintainability
  - Requirement: Tests must follow the same pattern as the rest of the component test suite
  - Design element: Decisions 1 and 2 (query style and `userEvent` convention)
  - Acceptance criteria reference: specs/rtl-migration/spec.md — AC4
  - Testability notes: Code review against `CombatantCard.callbacks.test.tsx` as the reference

## Risks / Trade-offs

- Risk/trade-off: A component may not expose accessible roles/names, causing `getByRole` to throw
  - Impact: Low — all components use standard HTML elements (buttons, inputs) with visible text
  - Mitigation: Fall back to `getByTestId` for elements that lack accessible names; note in tasks

- Risk/trade-off: `userEvent` interactions may expose timing differences vs raw `click()`
  - Impact: Low — all interactions are simple, synchronous button clicks
  - Mitigation: Run tests immediately after each file migration; address any failures before proceeding to next file

## Rollback / Mitigation

- Rollback trigger: Any test file causes regressions that cannot be resolved within the PR
- Rollback steps: Revert the specific file's changes (each file is an independent commit); leave other files migrated
- Data migration considerations: None — test files only
- Verification after rollback: `npm run test:unit` green on the reverted file

## Operational Blocking Policy

- If CI checks fail: Investigate immediately; do not merge with failing tests. Each file is independently committable, so a partial merge is acceptable if one file is blocking.
- If security checks fail: N/A — test-only change with no production code impact.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to maintainer after 48 hours.
- Escalation path and timeout: Author resolves within 3 business days or splits into smaller PRs per file.

## Open Questions

No open questions. All decisions confirmed during exploration.
