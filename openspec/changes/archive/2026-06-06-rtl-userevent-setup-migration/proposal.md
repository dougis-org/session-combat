## GitHub Issues

- #369

## Why

- Problem statement: 5 test files still use the deprecated static `userEvent` API (e.g. `userEvent.click(el)`) from `@testing-library/user-event` v14. The static API is an internal wrapper around `userEvent.setup()` that offers less control over timing and pointer/keyboard configuration, and is not the standard our other 18 RTL test files follow.
- Why now: Standardizing now keeps the test suite internally consistent and avoids the static API being copy-pasted further as new tests are added. Issue #356 already established that new RTL migrations should use `setup()` from the start.
- Business/user impact: No user-facing impact. Developer impact: consistent, maintainable test patterns across the full unit test suite.

## Problem Space

- Current behavior: 5 files call `userEvent.click(...)`, `userEvent.type(...)`, or `userEvent.selectOptions(...)` directly on the static import.
- Desired behavior: All RTL tests obtain a `userEvent` instance via `userEvent.setup()` before interacting with the DOM.
- Constraints: No logic changes — only the test interaction mechanism changes. All existing assertions remain untouched.
- Assumptions: The 18 files already using `setup()` are the reference implementation; no changes needed there.
- Edge cases considered: Files with multiple tests that each need a user instance should use `beforeEach` to avoid repetition; files with a single interacting test should use inline `const user` to stay self-contained.

## Scope

### In Scope

- `tests/unit/components/AlignmentSelect.test.tsx` — 1 `selectOptions` call → inline `const user`
- `tests/unit/components/NavBar.test.tsx` — 1 `click` call → inline `const user`
- `tests/unit/components/RegisterPage.test.tsx` — 4 `type` calls in one test → inline `const user`
- `tests/unit/components/CampaignsPage.test.tsx` — 3 `click` calls across 3 `it` blocks → `beforeEach` pattern
- `tests/unit/components/SessionsPage.test.tsx` — 2 `click` calls across 2 `test` blocks → `beforeEach` pattern

### Out of Scope

- The 18 test files already using `setup()` — no changes needed
- Any source/production code changes
- Adding new test cases or changing assertions
- ESLint rule enforcement (a follow-on could add a custom rule to ban the static API)

## What Changes

- 5 test files modified: static `userEvent.*()` calls replaced with instance calls on a `user` obtained from `userEvent.setup()`
- Per-file strategy chosen to minimise boilerplate while avoiding unnecessary describe-scope mutation

## Risks

- Risk: A migrated test could become async-timing-sensitive in a new way
  - Impact: Flaky test that was previously passing
  - Mitigation: Run `npm run test:unit` in full after all 5 files are migrated; each file's tests must pass before moving to the next

## Open Questions

No unresolved ambiguity. The per-file strategy (inline vs `beforeEach`) was confirmed during exploration based on the number of tests that need user interaction per file.

## Non-Goals

- Migrating to a different testing library
- Adding lint rules to enforce this pattern automatically
- Changing any component behaviour or test coverage

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
