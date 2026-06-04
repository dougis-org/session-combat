## Context

- **Relevant architecture:** Three unit test files under `tests/unit/components/` that test Next.js page-level components. Tests run under Jest with jsdom. RTL (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) is installed. `jest.setup.ts` imports `@testing-library/jest-dom` for matchers.
- **Dependencies:** No production code changes. `tests/unit/helpers/uiTestSetup.ts` is not deleted — other files still use it. `@testing-library/user-event` v14+ uses the `userEvent.setup()` API but direct `userEvent.click()` calls are supported and sufficient here.
- **Interfaces/contracts touched:** Test files only. No API contracts, no component props, no shared fixtures changed.

## Goals / Non-Goals

### Goals

- Eliminate `createRoot`, `act`, and `IS_REACT_ACT_ENVIRONMENT` from the three files
- Replace all DOM traversal queries with `screen` role/text queries
- Replace `btn.click()` inside `act()` with `userEvent.click()`
- Replace `container.textContent.toContain(...)` with `screen` matcher assertions
- Keep all existing test cases intact with no coverage regression

### Non-Goals

- Adding new test cases
- Changing any production component
- Deleting `uiTestSetup.ts`
- Migrating `CampaignEditor.test.tsx` (tracked in #343)

## Decisions

### Decision 1: Migration order

- **Chosen:** SessionsPage → PartiesPage → CampaignsPage
- **Alternatives considered:** Alphabetical order; all three in one pass
- **Rationale:** SessionsPage is smallest (141 lines, fewest interactions), PartiesPage is mid-size (206 lines), CampaignsPage is largest (254 lines, most fetch complexity). Progressive order reduces risk — validate the pattern works before applying to more complex files.
- **Trade-offs:** Slightly longer elapsed time vs. catching pattern mistakes early.

### Decision 2: userEvent import style

- **Chosen:** Import `userEvent` from `@testing-library/user-event` and call `userEvent.click()` / `userEvent.type()` directly (no `userEvent.setup()` per test).
- **Alternatives considered:** `userEvent.setup()` per `beforeEach` (more correct for pointer event simulation, needed for complex drag/hover sequences)
- **Rationale:** None of the three files test hover, drag, or pointer-specific behavior. Direct calls are sufficient and keep the tests concise. Can upgrade to `setup()` pattern later if needed.
- **Trade-offs:** Slightly less realistic pointer simulation vs. simpler test code.

### Decision 3: Async pattern for CampaignsPage fetch tests

- **Chosen:** Use `screen.findByText(...)` / `screen.findByRole(...)` for assertions after async fetch resolution. Keep `mockFetch` / `jsonResponse` from `uiTestSetup.ts` for mocking.
- **Alternatives considered:** `waitFor(() => expect(...))` wrappers
- **Rationale:** `findBy*` is cleaner when waiting for a single element to appear. `waitFor` is better for polling complex conditions — not needed here.
- **Trade-offs:** None meaningful.

### Decision 4: PartiesPage aria-label query migration

- **Chosen:** Replace `querySelectorAll('[aria-label^="Member section:"]')` with `screen.getAllByRole('region', { name: /member section/i })` if the elements have `role="region"`, otherwise `screen.getAllByLabelText(/member section/i)`.
- **Alternatives considered:** Keep the `data-testid` / attribute selector approach
- **Rationale:** RTL prefers role-based queries. The aria-label is already present on the elements so the RTL query is semantically equivalent and tests the accessibility contract.
- **Trade-offs:** Need to confirm actual ARIA role on those elements before writing the query.

### Decision 5: `@jest-environment jsdom` docblock removal

- **Chosen:** Remove from all three files as part of this migration (even though #264 would do it later).
- **Alternatives considered:** Leave it for #264 to clean up
- **Rationale:** Removing it now keeps the PR diff clean and eliminates the boilerplate entirely rather than in two passes.
- **Trade-offs:** Minor overlap with #264, but that issue notes the overlap is fine.

## Proposal to Design Mapping

- Proposal element: Replace `createRoot` + `act` render pattern
  - Design decision: Decision 1 (migration order), Decision 2 (userEvent style)
  - Validation approach: Run `npm run test:unit` after each file; assert test count unchanged

- Proposal element: Replace `querySelectorAll('button').find(textContent)` queries
  - Design decision: Use `screen.getByRole('button', { name: /.../ })`
  - Validation approach: Tests pass; queries are unambiguous (getBy throws if 0 or 2+ found)

- Proposal element: Replace `container.textContent.toContain(...)` assertions
  - Design decision: Use `screen.getByText(...)` + `.toBeInTheDocument()`
  - Validation approach: Tests pass; negative assertions use `queryByText`

- Proposal element: PartiesPage aria-label query
  - Design decision: Decision 4
  - Validation approach: Confirm element count matches old query; role verified against component source

- Proposal element: Async fetch tests in CampaignsPage
  - Design decision: Decision 3
  - Validation approach: Loading state and resolved state both asserted; no act() warnings in test output

## Functional Requirements Mapping

- Requirement: All test cases preserved, passing, count unchanged
  - Design element: All describe/it blocks retained verbatim; only internals change
  - Acceptance criteria reference: specs — each file spec lists preserved test names
  - Testability notes: `npm run test:unit` output shows same pass count before and after

- Requirement: No `createRoot`, `act`, `IS_REACT_ACT_ENVIRONMENT` remaining
  - Design element: Removed from all three files; RTL handles env and cleanup automatically
  - Acceptance criteria reference: specs — boilerplate removal checklist per file
  - Testability notes: `grep -r "createRoot\|IS_REACT_ACT" tests/unit/components/` returns no matches for these three files after migration

- Requirement: All interactions use `userEvent`
  - Design element: Decision 2
  - Acceptance criteria reference: specs — interaction pattern per file
  - Testability notes: No `act()` calls remain; no React act() warnings in test output

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No flaky async tests
  - Design element: `findBy*` with default 1000ms timeout; fetch mocks return `Promise.resolve()`
  - Acceptance criteria reference: CampaignsPage spec — async assertions
  - Testability notes: Run tests 3× in CI; zero intermittent failures

- Requirement category: operability
  - Requirement: CI passes after each file migration
  - Design element: Migration done file by file; each file committed/tested independently
  - Acceptance criteria reference: CI green
  - Testability notes: `npm run test:unit` run locally after each file before pushing

## Risks / Trade-offs

- Risk/trade-off: `screen.getAllByLabelText(/member section/i)` doesn't match PartiesPage elements if the label selector differs from the rendered aria-label value.
  - Impact: Test compile-passes but throws at runtime; caught immediately in local test run.
  - Mitigation: Inspect component source before writing the query; use exact string if partial match is ambiguous.

- Risk/trade-off: `findByText` in CampaignsPage times out if mock fetch isn't resolved before assertion.
  - Impact: Test failure with timeout error.
  - Mitigation: Ensure all `mockFetch` calls resolve synchronously via `Promise.resolve(jsonResponse(...))`.

## Rollback / Mitigation

- **Rollback trigger:** CI fails for a file after migration and the failure is non-trivial to fix quickly.
- **Rollback steps:** Revert the specific file to its pre-migration state using `git checkout -- <file>`; leave other migrated files as-is.
- **Data migration considerations:** None — test files only.
- **Verification after rollback:** `npm run test:unit` passes; reverted file shows no RTL imports.

## Operational Blocking Policy

- **If CI checks fail:** Investigate locally; fix before merging. Do not use `--no-verify` or admin bypass.
- **If security checks fail:** N/A — this change touches test files only.
- **If required reviews are blocked/stale:** Ping reviewer in PR; wait 24h; escalate to repo owner.
- **Escalation path and timeout:** If CI is broken for >48h with no clear path forward, open a follow-up issue and revert the affected file.

## Open Questions

No open questions. All design decisions are resolved based on inspection of the three test files and the installed RTL version.
