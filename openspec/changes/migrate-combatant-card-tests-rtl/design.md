## Context

- Relevant architecture: Jest + jsdom test environment; RTL already installed and configured via `jest.setup.ts` (completed in #254). `CombatantCard.hp.test.tsx` is the established RTL pattern for this component.
- Dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` — all already in `devDependencies`.
- Interfaces/contracts touched: Test files only. `CombatantCard.tsx` source is not modified.

## Goals / Non-Goals

### Goals

- Replace legacy `createRoot + act + querySelector` pattern with RTL in all `CombatantCard` tests
- Decompose 486-line monolith into 3 focused files + 1 shared helpers file
- Consolidate Undo HP tests into `CombatantCard.hp.test.tsx`
- Remove `IS_REACT_ACT_ENVIRONMENT = true` from migrated files

### Non-Goals

- Adding new test coverage
- Changing `CombatantCard.tsx` source
- Migrating other component test files

## Decisions

### Decision 1: Shared test-helpers file for BASE fixture and renderCard

- Chosen: `tests/unit/components/CombatantCard.test-helpers.ts` exports `BASE` and `renderCard(overrides, onUpdate, extra)`
- Alternatives considered: Duplicate helpers in each file; inline fixtures per test
- Rationale: `BASE` is identical across all files; `renderCard` signature is identical to `CombatantCard.hp.test.tsx`'s existing helper. Centralising prevents drift and eliminates ~30 lines of duplication across 4 files.
- Trade-offs: Adds one level of indirection; mitigated by the file being trivially small and co-located in the same directory.

### Decision 2: jest.mock blocks stay per-file

- Chosen: Each test file repeats the `jest.mock('next/link', ...)` and `jest.mock('next/navigation', ...)` blocks
- Alternatives considered: Shared mock file, `__mocks__` directory
- Rationale: Jest hoists `jest.mock` calls before imports at compile time. They cannot be re-exported from a shared module and still apply to the correct test file's module registry.
- Trade-offs: ~8 lines of duplication per file (4 files = ~32 lines). Acceptable given the hard constraint.

### Decision 3: userEvent over fireEvent for interactions

- Chosen: `userEvent.setup()` + `await user.click()` / `await user.type()` for all user interactions
- Alternatives considered: `fireEvent` (synchronous, lower fidelity)
- Rationale: Matches the pattern already established in `CombatantCard.hp.test.tsx`. `userEvent` simulates full browser event sequences (pointerdown, mousedown, click, etc.) and is the RTL-recommended approach.
- Trade-offs: Tests become async; all interaction tests require `async/await`. This is the standard tradeoff — higher fidelity, slightly more verbose.

### Decision 4: Undo HP tests move to CombatantCard.hp.test.tsx

- Chosen: 6 Undo HP tests appended to `CombatantCard.hp.test.tsx`
- Alternatives considered: New `CombatantCard.undo.test.tsx`; keep in `callbacks.test.tsx`
- Rationale: Undo HP is part of the HP lifecycle — it reads/restores `hp` and `tempHp`. The hp file already has `applyDamageHelper` which Undo HP tests build on. Colocation reduces duplication and improves cohesion.
- Trade-offs: `CombatantCard.hp.test.tsx` grows from 399 to ~470 lines. Still well within readable range.

### Decision 5: File naming convention

- Chosen: `CombatantCard.<concern>.test.tsx` pattern (e.g. `badges`, `effects-panel`, `callbacks`)
- Alternatives considered: Numeric suffix, subdirectory per component
- Rationale: Consistent with `CombatantCard.hp.test.tsx` already in place. Jest picks up all `*.test.tsx` files automatically.
- Trade-offs: None significant.

## Proposal to Design Mapping

- Proposal element: Migrate 35 tests from old pattern to RTL
  - Design decision: Decision 3 (userEvent), shared renderCard (Decision 1)
  - Validation approach: All 35 tests pass under `npm run test:unit`

- Proposal element: Decompose monolith into focused files
  - Design decision: Decision 5 (naming), Decision 4 (Undo HP placement)
  - Validation approach: `CombatantCard.test.tsx` deleted; 4 files exist; combined test count = 35 + existing hp tests

- Proposal element: Remove `IS_REACT_ACT_ENVIRONMENT = true`
  - Design decision: Decision 3 (RTL handles act internally)
  - Validation approach: Flag absent in all new files; tests pass without it

- Proposal element: Shared helpers to eliminate duplication
  - Design decision: Decision 1 (test-helpers.ts), Decision 2 (jest.mock per-file)
  - Validation approach: `BASE` and `renderCard` defined once; imported in badges, effects-panel, callbacks, hp files

## Functional Requirements Mapping

- Requirement: All 35 existing tests preserved and passing
  - Design element: RTL render + screen queries replacing DOM traversal
  - Acceptance criteria reference: specs/test-migration/spec.md — all tests green
  - Testability notes: `npm run test:unit` is the verification command; no new tooling required

- Requirement: Coverage for `CombatantCard.tsx` does not decrease
  - Design element: Test logic unchanged — only render/query primitives swapped
  - Acceptance criteria reference: specs/test-migration/spec.md — coverage gate
  - Testability notes: `npm run test:unit -- --coverage` reports statement/branch/function %

- Requirement: No `createRoot`, `react-dom/client`, or `IS_REACT_ACT_ENVIRONMENT` in migrated files
  - Design element: RTL imports only in all new files
  - Acceptance criteria reference: specs/test-migration/spec.md — import audit
  - Testability notes: `grep -r "createRoot" tests/unit/components/` returns no results after migration

## Non-Functional Requirements Mapping

- Requirement category: operability
  - Requirement: Test files individually runnable and independently understandable
  - Design element: Each file self-contained (own jest.mock, own fixtures or shared import); no cross-file test state
  - Acceptance criteria reference: Each file runs in isolation via `jest <filename>`
  - Testability notes: Run each file individually; no failures from missing global setup

- Requirement category: maintainability
  - Requirement: Single source of truth for BASE fixture and renderCard
  - Design element: `CombatantCard.test-helpers.ts`
  - Acceptance criteria reference: No duplicate BASE definitions across test files
  - Testability notes: `grep -r "const BASE" tests/unit/components/CombatantCard` returns one result

## Risks / Trade-offs

- Risk/trade-off: Old synchronous `findButton('x').click()` pattern → async `await user.click(screen.getByRole(...))`
  - Impact: Tests that don't await may pass but silently miss state updates
  - Mitigation: All interaction tests use `async/await` with `userEvent.setup()`; follow `applyDamageHelper` pattern from hp file exactly

- Risk/trade-off: `screen.getByRole` queries require correct ARIA roles on rendered elements
  - Impact: Tests may need `screen.getByText` or `data-testid` fallbacks for elements without semantic roles
  - Mitigation: Audit each query during migration; add `data-testid` to `CombatantCard.tsx` only where no role/label query is viable (minimal surface)

## Rollback / Mitigation

- Rollback trigger: More than 2 tests cannot be expressed in RTL without source changes; or CI fails after migration
- Rollback steps: Restore `CombatantCard.test.tsx` from git history (`git checkout HEAD -- tests/unit/components/CombatantCard.test.tsx`); delete new files
- Data migration considerations: None — test files only
- Verification after rollback: `npm run test:unit` green on main branch

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing tests before opening the PR.
- If security checks fail: Not applicable — this change is test files only with no production code or dependency changes.
- If required reviews are blocked/stale: Request re-review after 24 hours; escalate to repo owner if still blocked after 48 hours.
- Escalation path and timeout: Tag `dougis` on the PR after 48 hours of no review activity.

## Open Questions

No open questions. All decisions confirmed during exploration session.
