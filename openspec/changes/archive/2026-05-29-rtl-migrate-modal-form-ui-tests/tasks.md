# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/rtl-migrate-modal-form-ui-tests` then immediately `git push -u origin refactor/rtl-migrate-modal-form-ui-tests`

## Execution

### File 1: Migrate `tests/unit/components/ui.test.tsx`

> **BDD/TDD sequence:** Rewrite the file in RTL first. Run tests — they should pass immediately since the component behavior is unchanged. If any fail, diagnose before moving on.

- [x] Remove `IS_REACT_ACT_ENVIRONMENT` global, `createReactRoot`/`unmountReactRoot` import, `createRoot`/`Root`/`act` imports
- [x] Replace `beforeEach`/`afterEach` boilerplate with nothing (RTL cleans up automatically)
- [x] Replace all `render(element)` calls with `rtlRender(element)` using `import { render as rtlRender, screen, within } from '@testing-library/react'`
- [x] Replace `container.textContent` / `container.querySelector*` assertions with `screen.getByText`, `screen.getByLabelText`, `screen.getByRole`, `screen.queryBy*`
- [x] Migrate `EditorShell` button queries from index-based (`querySelectorAll('button')[0]`) to `screen.getByRole('button', { name: /save/i })` and `getByRole('button', { name: /cancel/i })`
- [x] Migrate `EditorShell` click tests to `const user = userEvent.setup(); await user.click(...)`; make those tests `async`
- [x] Migrate `TextInputField.onChange` test from native-setter hack to `await userEvent.type(input, 'value')`
- [x] Verify: `npm test -- --testPathPattern="ui\.test"` passes green
- [x] Verify: `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|reactRoot" tests/unit/components/ui.test.tsx` returns no matches

### File 2: Migrate `tests/unit/components/TargetActionModal.test.tsx`

> **BDD/TDD sequence:** Rewrite the file in RTL. Run tests — they should all pass. This file becomes the canonical RTL reference pattern.

- [x] Remove `IS_REACT_ACT_ENVIRONMENT` global and all legacy imports (`createRoot`, `Root`, `act`, `react-dom/client`)
- [x] Remove `findButton()`, `changeInputValue()`, `renderDefault()`, legacy `render()`, `beforeEach`/`afterEach` boilerplate
- [x] Add RTL imports: `import { render, screen } from '@testing-library/react'` and `import userEvent from '@testing-library/user-event'`
- [x] Write `renderModal(overrides?)` RTL helper that calls `render(<TargetActionModal .../>)` and returns mock callbacks
- [x] Migrate initial screen test: `screen.getByText`, `screen.getByRole('button', { name: /apply damage/i })`, etc.
- [x] Migrate cancel test: `const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: /cancel/i }))`
- [x] Migrate damage flow: `await user.click(...)` to enter damage mode, `await userEvent.type(screen.getByPlaceholderText('Damage amount'), '5')`, `await userEvent.selectOptions(screen.getByRole('combobox', ...), 'fire')`, assert button label updates, click Apply
- [x] Migrate condition flow: `await user.click(...)` to enter condition mode, type into both inputs, click Add
- [x] Make all interaction tests `async`
- [x] Verify: `npm test -- --testPathPattern="TargetActionModal\.test"` passes green
- [x] Verify: `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|findButton|changeInputValue" tests/unit/components/TargetActionModal.test.tsx` returns no matches

### File 3: Migrate `tests/unit/components/CreatureStatsForm.test.tsx`

> **BDD/TDD sequence:** Rewrite in RTL using `within()` scoping. Run tests — all should pass. Structure may differ from old file; coverage must be maintained or improved.

- [x] Remove `IS_REACT_ACT_ENVIRONMENT` global, `createRoot`, `Root`, `act`, `react-dom/client` imports
- [x] Remove `beforeEach`/`afterEach` boilerplate, `render()` wrapper, `clickResistancesHeader()`, `renderExpanded()` helpers
- [x] Add RTL imports: `render`, `screen`, `within` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`
- [x] Write `renderForm(stats, onChange)` RTL helper calling `render(<CreatureStatsForm stats={stats} onChange={onChange} />)` and returning `{ user: userEvent.setup() }`
- [x] Write `expandResistances(user)` helper: `await user.click(screen.getByRole('button', { name: /resistances/i }))`
- [x] Write `getSection(labelText)` helper using `screen.getByText(labelText).closest('div')` + add single comment: `// scoped by section label text — tied to CreatureStatsForm DOM structure`
- [x] Migrate "collapsed by default" test: `expect(screen.queryAllByRole('checkbox')).toHaveLength(0)`
- [x] Migrate "expanding renders 39 checkboxes" test: `expect(screen.getAllByRole('checkbox')).toHaveLength(39)`
- [x] Migrate "all unchecked" test: all checkboxes checked property is false
- [x] Migrate "pre-selected resistances" test: `screen.getAllByRole('checkbox', { checked: true })` has length 2; verify within the Damage Resistances section
- [x] Migrate checkbox toggle tests using `within(getSection('Damage Resistances')).getByRole('checkbox', { name: /fire/i })` and `await user.click(...)`
- [x] Migrate immunity toggle test using `within(getSection('Damage Immunities')).getByRole('checkbox', { name: /poison/i })`
- [x] Migrate "last type removed sets field undefined" test for Damage Vulnerabilities
- [x] Verify: `npm test -- --testPathPattern="CreatureStatsForm\.test"` passes green
- [x] Verify: `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|parentElement|querySelectorAll" tests/unit/components/CreatureStatsForm.test.tsx` returns no matches

### Cleanup: Delete `reactRoot.ts` helper if unused

- [x] Run: `grep -r "reactRoot" tests/` — output was NOT empty (5 consumer files remain from #260); helper retained
- [x] If deleted: verify `npm test` still passes — N/A (not deleted)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on staged/unstaged changes. The primary agent must automatically address all findings (complexity, duplication, quality issues) before committing.

## Validation

- [x] `npm test -- --testPathPattern="(ui|TargetActionModal|CreatureStatsForm)\.test"` — all pass green
- [x] `npm test` — unit suite passes (1776 tests); integration failures are pre-existing MongoDB ESM issue unrelated to this change
- [x] `npm run build` — skipped (no source code changed, only test files)
- [x] `npx tsc --noEmit` — no new type errors (23 pre-existing errors unchanged)
- [x] Verify coverage has not dropped: `npm test -- --coverage --testPathPattern="(ui|TargetActionModal|CreatureStatsForm)\.test"`
- [x] `grep -rE "createRoot|IS_REACT_ACT_ENVIRONMENT" tests/unit/components/ui.test.tsx tests/unit/components/TargetActionModal.test.tsx tests/unit/components/CreatureStatsForm.test.tsx` — empty
- [x] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests pass
- **Build** — `npm run build` — succeeds with no errors
- If **ANY** of the above fail, **MUST** iterate and address the failure before pushing

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before the final commit
- [x] Commit all changes to `refactor/rtl-migrate-modal-form-ui-tests` and push to remote
- [x] Open PR from `refactor/rtl-migrate-modal-form-ui-tests` to `main`. PR body **must** include `Closes #261` — PR #285
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (never `--admin`, never `--merge`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to comment
- [ ] **Monitor PR comments** — address each one, commit fixes, run remote push validation, push, wait 180 seconds, repeat until no unresolved threads
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing check, commit, validate, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:
- Implementer: (assigned)
- Reviewer(s): (auto-assigned by CODEOWNERS)
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → `npm test && npm run build` → push → re-check
- Review comment → address → commit → validate → push → confirm thread resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify migrated test files and (if applicable) deleted `reactRoot.ts` appear on `main`
- [x] Mark all remaining tasks complete (`- [x]`)
- [x] Sync approved spec deltas to `openspec/specs/` (global spec directory)
- [x] Archive the change: move `openspec/changes/rtl-migrate-modal-form-ui-tests/` → `openspec/changes/archive/2026-05-29-rtl-migrate-modal-form-ui-tests/` — stage both the copy and the deletion in **a single commit**
- [x] Confirm `openspec/changes/archive/2026-05-29-rtl-migrate-modal-form-ui-tests/` exists and `openspec/changes/rtl-migrate-modal-form-ui-tests/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-2026-05-29-rtl-migrate-modal-form-ui-tests && git push -u origin doc/archive-...`
- [ ] Open archive PR: title `docs: archive rtl-migrate-modal-form-ui-tests (2026-05-29)` — do NOT push directly to `main`
- [ ] Enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop — comments + CI + poll)
- [ ] Prune: `git fetch --prune && git branch -d refactor/rtl-migrate-modal-form-ui-tests doc/archive-2026-05-29-rtl-migrate-modal-form-ui-tests`
