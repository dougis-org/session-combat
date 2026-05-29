## Context

- Relevant architecture: Jest 29 with jsdom environment; `@testing-library/react` v16 and `@testing-library/user-event` v14 installed via #254. `jest.setup.ts` imports `@testing-library/jest-dom` globally so all `toBeInTheDocument()` matchers are available without per-file imports.
- Dependencies: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` (already installed).
- Interfaces/contracts touched: Three test files only — no source components, APIs, or configuration files are modified.

## Goals / Non-Goals

### Goals

- Replace `createRoot`/`act`/`container.querySelector*` pattern with `render`/`screen`/`userEvent` in three files
- Preserve all existing test assertions (parity migration)
- Keep the `@jest-environment jsdom` pragma in each file
- CI unit suite passes with zero regressions

### Non-Goals

- Adding new test cases beyond parity
- Modifying source components or configuration
- Migrating any test file outside the three named in scope

## Decisions

### Decision 1: Query strategy per component

- Chosen: Semantic role-based queries (`getByRole`) where available; `getByText` for plain text nodes; `queryBy*` variants for absence assertions; `getByTestId` only for `data-testid` attributes that already exist.
- Alternatives considered: `getByLabelText` for `AlignmentSelect` — valid but `getByRole('combobox', { name: 'Alignment' })` is more explicit and works via both `aria-label` and `<label>` association.
- Rationale: Matches the project's established RTL style in `tests/unit/CombatStatsRow.rtl.test.tsx`; role-based queries are most resilient to markup changes.
- Trade-offs: Slightly more verbose than `getByLabelText`, but unambiguous.

### Decision 2: jest.mock placement in NavBar.test.tsx

- Chosen: Keep `jest.mock('next/link', ...)` and `jest.mock('@/lib/hooks/useAuth', ...)` calls above all other imports.
- Alternatives considered: Moving mocks below imports — not viable, Jest hoists `jest.mock` calls to top of file regardless.
- Rationale: Preserves existing mock behavior; avoids lint/hoisting issues.
- Trade-offs: None — this is the required pattern for Jest module mocking.

### Decision 3: `@jest-environment jsdom` pragma retention

- Chosen: Keep `/** @jest-environment jsdom */` at the top of each file.
- Alternatives considered: Relying on global jest config — the project's `jest.config.js` may not default to jsdom for all files.
- Rationale: Explicit pragma ensures the correct environment regardless of config changes; consistent with existing RTL test files.
- Trade-offs: Slight redundancy if global config already sets jsdom, but harmless.

## Proposal to Design Mapping

- Proposal element: Remove `createRoot`/`act` boilerplate
  - Design decision: Decision 1 — use `render()` from RTL
  - Validation approach: Test files compile and run without `createRoot`/`react-dom/client` imports

- Proposal element: Replace `container.querySelector*` queries
  - Design decision: Decision 1 — semantic `screen.*` queries
  - Validation approach: All test assertions pass with the new query forms

- Proposal element: Replace `dispatchEvent`/`.click()` with `userEvent`
  - Design decision: Decision 1 — `userEvent.click` / `userEvent.selectOptions`
  - Validation approach: Interaction tests confirm `onChange`/`logout` callbacks are called

- Proposal element: Preserve `jest.mock` order in NavBar
  - Design decision: Decision 2
  - Validation approach: NavBar tests pass; no hoisting lint errors

## Functional Requirements Mapping

- Requirement: AlignmentSelect — all 9 default option tests pass
  - Design element: `screen.getAllByRole('option')`, `screen.getByRole('combobox', { name: 'Alignment' })`
  - Acceptance criteria reference: specs/rtl-migration/spec.md — AlignmentSelect section
  - Testability notes: Option count via `getAllByRole('option').length`; selected value via `(element as HTMLSelectElement).value`

- Requirement: NavBar — logout button visibility tests pass
  - Design element: `screen.queryByTestId('logout-button')` / `screen.getByTestId('logout-button')`
  - Acceptance criteria reference: specs/rtl-migration/spec.md — NavBar section
  - Testability notes: `not.toBeInTheDocument()` for absent; `toBeInTheDocument()` for present

- Requirement: CreatureStatBlock — stat display tests pass
  - Design element: `screen.getByText`, `screen.queryByText`
  - Acceptance criteria reference: specs/rtl-migration/spec.md — CreatureStatBlock section
  - Testability notes: Text presence/absence assertions; compact mode hides ability score labels

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regressions in full unit suite
  - Design element: Run `npm run test:unit` after all three migrations
  - Acceptance criteria reference: CI passes
  - Testability notes: Full suite run confirms no side effects from import changes

## Risks / Trade-offs

- Risk/trade-off: `userEvent` async API may require `async/await` in tests that were previously synchronous
  - Impact: Test structure change (minor)
  - Mitigation: Mark interaction tests `async`; use `await userEvent.*`

## Rollback / Mitigation

- Rollback trigger: Any test failure that cannot be resolved within the migration
- Rollback steps: `git checkout tests/unit/components/<file>.test.tsx` to restore the original
- Data migration considerations: None — test files only
- Verification after rollback: Run `npx jest tests/unit/components/<file>.test.tsx --no-coverage`

## Operational Blocking Policy

- If CI checks fail: Investigate the specific failure in the migration; do not merge until all unit tests pass
- If security checks fail: Not applicable to this change (test files only)
- If required reviews are blocked/stale: Ping reviewer in PR; escalate after 2 business days
- Escalation path and timeout: Tag project maintainer after 2-day stale review window

## Open Questions

No open questions. All design decisions are resolved.
