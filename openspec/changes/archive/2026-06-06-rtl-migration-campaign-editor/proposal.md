## GitHub Issues

- #356

## Why

- Problem statement: `tests/unit/components/CampaignEditor.test.tsx` (387 lines) uses the legacy `createReactRoot` / `act` / `container.querySelectorAll` pattern that predates React Testing Library. The helper `@/tests/unit/helpers/reactRoot` is the last remaining consumer of this pattern.
- Why now: Issue #356 was filed to complete the RTL migration started in #254 and tracked through the archived `rtl-migration-issue-260` change. All other component test files have been migrated; `CampaignEditor.test.tsx` is the last holdout.
- Business/user impact: Consistent test infrastructure across all component tests. Removes the legacy `reactRoot` helper entirely once done.

## Problem Space

- Current behavior: Tests use `createReactRoot` to mount, `act()` to interact, `container.querySelector*` for all DOM queries, and `dispatchEvent` to fire change events on selects and inputs.
- Desired behavior: Tests use `render` + `screen` from `@testing-library/react` and `userEvent.setup()` from `@testing-library/user-event`. DOM queries use accessible roles, labels, and `data-testid` attributes. Event interactions use `user.click()`, `user.selectOptions()`, `user.type()`.
- Constraints:
  - All 25 existing test cases must be preserved — no cases added or removed.
  - Must use `userEvent.setup()` per the standard set in #369 (not the deprecated static API).
  - The `TextInputField` components for Campaign Name and Module/Adventure use `useId()` + `htmlFor`, so `getByLabelText` works without component changes.
  - The status `<select>` and notes `<textarea>` use `data-testid` but their labels are not linked via `htmlFor`, so `getByTestId` is the correct query.
  - Chapter title inputs have `aria-label="Chapter N title"` attributes — `getByLabelText` or `getByTestId` both work.
- Assumptions:
  - No changes to `CampaignEditor.tsx` or `ui.tsx` are needed.
  - `@testing-library/react`, `@testing-library/user-event` v14, and `@testing-library/jest-dom` are already installed and configured.
- Edge cases considered:
  - `chaptersExpanded` initialises to `true` when a campaign already has chapters. The `openChapters()` helper guards against double-clicking the accordion.
  - The "chapter display" test currently checks `container.textContent` for chapter titles, which finds them via `<option>` text. Migrating to `screen.getByDisplayValue()` checks the input values directly — more semantically correct.

## Scope

### In Scope

- Full rewrite of `tests/unit/components/CampaignEditor.test.tsx` to RTL
- Deletion of the `createReactRoot` / `unmountReactRoot` import and all `container`/`root` boilerplate
- Addition of a local `renderEditor()` helper and an `openChapters()` helper to reduce duplication
- Use `userEvent.setup()` per #369 standard

### Out of Scope

- Migration of the other 5 static-API files from #369 (separate issue)
- Deletion of `tests/unit/helpers/reactRoot.ts` itself — only done once confirmed no other consumers remain (verify separately)
- Changes to `CampaignEditor.tsx`, `ui.tsx`, or any production code
- Adding new test cases beyond the existing 25

## What Changes

- `tests/unit/components/CampaignEditor.test.tsx`: full migration to RTL

## Risks

- Risk: A test that passed with `act()` + `dispatchEvent` behaves differently with `userEvent` (timing, synthetic vs. real events).
  - Impact: Test failure or false negative.
  - Mitigation: Run `npm test` after each describe-block migration and fix immediately.

- Risk: `getByLabelText('Campaign Name *')` fails if the label text is rendered differently (e.g. trailing whitespace or asterisk stripped).
  - Impact: Test throws `TestingLibraryElementError`.
  - Mitigation: Verified in explore — `TextInputField` renders `<label htmlFor={id}>Campaign Name *</label>` exactly.

## Open Questions

No unresolved ambiguity exists. All query strategies, helpers, and event patterns were resolved during the explore session for this issue.

## Non-Goals

- Increasing test coverage beyond the existing 25 cases
- Refactoring `CampaignEditor.tsx` for testability
- Standardising the static-API files (tracked in #369)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
