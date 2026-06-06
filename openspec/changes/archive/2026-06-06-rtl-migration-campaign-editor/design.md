## Context

- Relevant architecture: Component unit tests under `tests/unit/components/`. The legacy `createReactRoot` helper lives in `tests/unit/helpers/reactRoot.ts`. RTL (`@testing-library/react` v16, `@testing-library/user-event` v14, `@testing-library/jest-dom` v6) is already installed and configured in `jest.setup.ts`.
- Dependencies: No production code changes. Test-only change against `tests/unit/components/CampaignEditor.test.tsx`.
- Interfaces/contracts touched: The test file imports `CampaignEditor` from `app/campaigns/CampaignEditor.tsx`. The component's rendered structure (labels, roles, `data-testid` attributes, `aria-label` attributes) forms the implicit contract for RTL queries.

## Goals / Non-Goals

### Goals

- Replace all `createReactRoot` / `act` / `container.*` patterns with `render`, `screen`, and `userEvent.setup()`
- Preserve all 25 existing test cases with identical assertions
- Use accessible queries wherever the component provides them; fall back to `getByTestId` only where labels are not linked
- Use shared local helpers (`renderEditor`, `openChapters`) to avoid repeated setup code

### Non-Goals

- Adding new test cases
- Changing production code
- Migrating the 5 static-API files from issue #369

## Decisions

### Decision 1: Query strategy per element

- Chosen:
  - Campaign Name input → `screen.getByLabelText('Campaign Name *')` (`TextInputField` uses `useId()` + `htmlFor`)
  - Module/Adventure input → `screen.getByLabelText('Module / Adventure')`
  - Status select → `screen.getByTestId('status-select')` (label not linked via `htmlFor`)
  - Notes textarea → `screen.getByTestId('notes-textarea')` (label not linked via `htmlFor`)
  - Chapter title inputs → `screen.getAllByTestId('chapter-title-input')` (have `aria-label` but `getByTestId` matches existing data attributes)
  - Chapter move/remove buttons → `screen.getByTestId('move-up-N')`, `screen.getByTestId('remove-chapter-N')`
  - Current chapter select → `screen.getByTestId('current-chapter-select')`
  - Save/Cancel buttons → `screen.getByRole('button', { name: 'Save Campaign' })`, `screen.getByRole('button', { name: 'Cancel' })`
  - Chapters accordion → `screen.getByRole('button', { name: /chapters/i })`
- Alternatives considered: Using only `getByRole` or only `getByTestId` uniformly.
- Rationale: Prioritise accessible queries (role, label) where the component already provides them; use `getByTestId` only for elements whose labels are not programmatically linked.
- Trade-offs: Mixed query strategy requires slightly more knowledge of the component, but better reflects real accessibility of the component.

### Decision 2: userEvent.setup() scoping

- Chosen: Create one `user` instance per test via `const user = userEvent.setup()` at the top of each `it` block (not shared at describe scope).
- Alternatives considered: Shared `user` via `beforeEach` at describe scope.
- Rationale: Matches the existing pattern in the 18 files that already use `setup()`. Per-test instances avoid cross-test state bleed from pointer/keyboard simulation.
- Trade-offs: Slightly more repetition per test, but each test is self-contained and easier to read in isolation.

### Decision 3: Local helper strategy

- Chosen: Two module-level helpers:
  - `renderEditor(props)` — calls `render(<CampaignEditor .../>)` with defaults spread over BASE_CAMPAIGN, reducing per-test boilerplate.
  - `openChapters()` — async helper that clicks the accordion only if `+ Add Chapter` is not already visible (guards against double-click when `chaptersExpanded` initialises `true`).
- Alternatives considered: No helpers (inline render everywhere); a single unified render helper with userEvent baked in.
- Rationale: Same thing done 8+ times warrants a helper. Keeping `renderEditor` and `openChapters` separate makes each composable and testable independently.
- Trade-offs: Helpers must be maintained alongside the component; however they are small and obvious.

### Decision 4: Chapter display assertion

- Chosen: `screen.getByDisplayValue('Arrival')` (and similar) to verify chapter titles in the expanded chapters section.
- Alternatives considered: `screen.getByText(/Arrival/)` (finds the option text in the select dropdown).
- Rationale: `getByDisplayValue` directly asserts the input has the right value, which is the semantically correct assertion. The previous `container.textContent` approach incidentally found chapter titles in `<option>` elements, which is indirect.
- Trade-offs: Requires chapters section to be expanded for the input to be in the DOM — `renderEditor` with `chapters` prop ensures `chaptersExpanded` starts `true`.

### Decision 5: beforeEach / afterEach boilerplate

- Chosen: Remove entirely. RTL registers its own `afterEach(cleanup)` automatically.
- Alternatives considered: Keep `afterEach(() => jest.clearAllMocks())`.
- Rationale: `jest.clearAllMocks()` is already in `jest.config.js`'s `clearMocks` setting (or called globally). Verify and remove redundant teardown.
- Trade-offs: If global `clearMocks` is not set, mocks may leak. Mitigation: confirm `jest.config.js` setting; add `afterEach(() => jest.clearAllMocks())` only if needed.

## Proposal to Design Mapping

- Proposal element: Replace `findButton(text)` helper
  - Design decision: Decision 1 (role-based button queries)
  - Validation approach: Each test using `getByRole('button', ...)` is verified by the test passing

- Proposal element: Replace `getInput(type, index)` helper
  - Design decision: Decision 1 (`getByLabelText` for name/moduleName)
  - Validation approach: `screen.getByLabelText('Campaign Name *')` must resolve without error

- Proposal element: Replace `openChapters()` helper
  - Design decision: Decision 3 (local `openChapters()` RTL version)
  - Validation approach: All 8 tests that call `openChapters()` pass

- Proposal element: Chapter display test using `container.textContent`
  - Design decision: Decision 4 (`getByDisplayValue`)
  - Validation approach: `screen.getByDisplayValue('Arrival')` resolves in expanded state

- Proposal element: Use `userEvent.setup()` per #369
  - Design decision: Decision 2 (per-test `user` instance)
  - Validation approach: No static `userEvent.*` calls remain

## Functional Requirements Mapping

- Requirement: All 25 existing test cases preserved
  - Design element: Direct 1:1 migration of each `it(...)` block
  - Acceptance criteria reference: `npm test` passes with no failures or skips
  - Testability notes: Run test suite before and after; diff test count

- Requirement: No imports from `@/tests/unit/helpers/reactRoot`
  - Design element: Decision 5 (remove boilerplate); Decision 1 (RTL queries replace DOM queries)
  - Acceptance criteria reference: `grep -r 'reactRoot' tests/` returns no results in this file
  - Testability notes: Static analysis / grep after migration

- Requirement: Chapter display assertion uses input values not option text
  - Design element: Decision 4
  - Acceptance criteria reference: `getByDisplayValue` used in chapter display test
  - Testability notes: Test passes and assertion is on input, not container.textContent

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No flakiness introduced by event timing
  - Design element: Decision 2 (per-test `userEvent.setup()` with proper async/await)
  - Acceptance criteria reference: All async tests `await` every user interaction
  - Testability notes: Run test suite 3× in CI to confirm consistent pass rate

## Risks / Trade-offs

- Risk/trade-off: `getByRole('button', { name: /chapters/i })` matches emoji-prefixed button text `📖 Chapters (N)`
  - Impact: Test throws if regex doesn't match computed accessible name
  - Mitigation: Verified in explore — emoji is part of text content, `/chapters/i` matches the span text

- Risk/trade-off: `jest.clearAllMocks()` teardown may be needed if global config doesn't cover it
  - Impact: Mock state bleeds between tests
  - Mitigation: Check `jest.config.js` for `clearMocks: true`; add `afterEach` if absent

## Rollback / Mitigation

- Rollback trigger: More than 1 test case fails after migration with no clear fix path
- Rollback steps: Revert `tests/unit/components/CampaignEditor.test.tsx` to pre-migration state via `git checkout`
- Data migration considerations: None (test-only change)
- Verification after rollback: `npm test` passes with original file

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test before opening PR.
- If security checks fail: Not applicable (test-only change touches no production code).
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo maintainer after 48 hours.
- Escalation path and timeout: Maintainer (@dougis) has final merge authority after 48 hours of stale review.

## Open Questions

No open questions. All design decisions were resolved during the explore session for issue #356.
