## GitHub Issues

- dougis-org/session-combat#260

## Why

- Problem statement: Three component test files (`AlignmentSelect.test.tsx`, `NavBar.test.tsx`, `CreatureStatBlock.test.tsx`) use a manual `createRoot`/`act`/`container.querySelectorAll` pattern that is verbose, brittle, and inconsistent with the project's adopted RTL standard.
- Why now: The RTL infrastructure (#254) has been merged and is ready to use. These are the smallest, simplest files — ideal first candidates for migration.
- Business/user impact: Cleaner, more maintainable tests; consistent query semantics; reduced boilerplate; aligns codebase test style going forward.

## Problem Space

- Current behavior: Tests use imperative DOM manipulation (`createRoot`, `act`, `container.querySelector*`, `dispatchEvent`). Manual `beforeEach`/`afterEach` lifecycle for mount/unmount.
- Desired behavior: Tests use `render`, `screen.*` queries, and `userEvent` from RTL. Cleanup is automatic. No `createRoot`/`act` boilerplate.
- Constraints: Must preserve all existing test cases and coverage; CI must pass.
- Assumptions: RTL (`@testing-library/react` v16) and `@testing-library/user-event` v14 are already installed (per #254). `jest.setup.ts` configures `@testing-library/jest-dom` globally.
- Edge cases considered: `NavBar.test.tsx` has `jest.mock()` calls that must remain before imports; `AlignmentSelect` uses a `useId`-based label association; `CreatureStatBlock.test.tsx` has no interactions — only render assertions.

## Scope

### In Scope

- Migrate `tests/unit/components/AlignmentSelect.test.tsx` to RTL
- Migrate `tests/unit/components/NavBar.test.tsx` to RTL
- Migrate `tests/unit/components/CreatureStatBlock.test.tsx` to RTL
- Verify all three files pass after migration
- Verify no regressions in full unit test suite

### Out of Scope

- Migrating any other test files (other component tests are addressed in separate issues)
- Adding new test cases beyond what is needed to reach parity
- Modifying source components

## What Changes

- `tests/unit/components/AlignmentSelect.test.tsx` — replace manual root/container pattern with RTL `render`/`screen`/`userEvent`
- `tests/unit/components/NavBar.test.tsx` — same migration; preserve `jest.mock` call order
- `tests/unit/components/CreatureStatBlock.test.tsx` — same migration; render-only assertions use `screen.getByText`

## Risks

- Risk: Mock ordering in `NavBar.test.tsx` (`jest.mock` before imports) may conflict with ESLint import rules
  - Impact: Lint failure or test breakage
  - Mitigation: Keep `jest.mock` calls above imports exactly as in the current file; verify lint passes
- Risk: `AlignmentSelect` label association relies on `useId()` — `screen.getByLabelText` may resolve differently from `screen.getByRole('combobox', { name: 'Alignment' })`
  - Impact: Query mismatch in tests
  - Mitigation: Use `screen.getByRole('combobox', { name: 'Alignment' })` which resolves via both `aria-label` and `<label>` association

## Open Questions

No unresolved ambiguity. The migration pattern is fully defined in issue #260 and the existing RTL reference file `tests/unit/CombatStatsRow.rtl.test.tsx`.

## Non-Goals

- Increasing coverage beyond the current baseline for these files
- Refactoring source components
- Migrating any test file not listed in issue #260

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
