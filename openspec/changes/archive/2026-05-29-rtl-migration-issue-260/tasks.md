# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/rtl-migration-issue-260` then immediately `git push -u origin test/rtl-migration-issue-260`

## Execution

### Task 1: Migrate AlignmentSelect.test.tsx

- [x] Replace `tests/unit/components/AlignmentSelect.test.tsx` with RTL version (see `docs/superpowers/plans/2026-05-29-rtl-migration-issue-260.md` Task 1 for complete file)
  - Remove `createRoot`, `Root`, `act`, `beforeEach`/`afterEach` boilerplate
  - Add `render`, `screen` from `@testing-library/react` and `userEvent` from `@testing-library/user-event`
  - Replace `container.querySelector('select')` → `screen.getByRole('combobox', { name: 'Alignment' })`
  - Replace `container.querySelectorAll('option')` → `screen.getAllByRole('option')`
  - Replace `dispatchEvent` → `await userEvent.selectOptions(...)`
  - Replace `.disabled` check → `expect(combobox).toBeDisabled()`
- [x] Run `npx jest tests/unit/components/AlignmentSelect.test.tsx --no-coverage` — expect 10 tests pass

### Task 2: Migrate NavBar.test.tsx

- [x] Replace `tests/unit/components/NavBar.test.tsx` with RTL version (see `docs/superpowers/plans/2026-05-29-rtl-migration-issue-260.md` Task 2 for complete file)
  - Keep `jest.mock('next/link', ...)` and `jest.mock('@/lib/hooks/useAuth', ...)` above all imports
  - Replace link queries with `screen.getByRole('link', { name: '...' })`
  - Replace `querySelector('[data-testid="logout-button"]')` with `screen.queryByTestId` / `screen.getByTestId`
  - Replace `.click()` with `await userEvent.click(...)`
- [x] Run `npx jest tests/unit/components/NavBar.test.tsx --no-coverage` — expect 5 tests pass

### Task 3: Migrate CreatureStatBlock.test.tsx

- [x] Replace `tests/unit/components/CreatureStatBlock.test.tsx` with RTL version (see `docs/superpowers/plans/2026-05-29-rtl-migration-issue-260.md` Task 3 for complete file)
  - Remove `createRoot`, `act`, `beforeEach`/`afterEach` boilerplate
  - Add `render`, `screen` from `@testing-library/react`
  - Replace `container.textContent` contains checks → `screen.getByText(...)` / `screen.queryByText(...)`
  - Add `renderBlock` helper for DRY rendering
- [x] Run `npx jest tests/unit/components/CreatureStatBlock.test.tsx --no-coverage` — expect 6 tests pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit tests: `npm run test:unit` — all suites pass
- [x] Run build: `npm run build` — succeeds with no errors
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `test/rtl-migration-issue-260` to `main`. PR body must include `Closes #260`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; address, commit, push, wait 180 seconds, repeat until no unresolved comments remain
- [x] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, push, repeat
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): Project maintainer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation if impacted
- [x] Sync approved spec deltas into `openspec/specs/`
- [x] Archive the change: move `openspec/changes/rtl-migration-issue-260/` to `openspec/changes/archive/2026-05-29-rtl-migration-issue-260/` in a single atomic commit
- [x] Confirm `openspec/changes/archive/2026-05-29-rtl-migration-issue-260/` exists and `openspec/changes/rtl-migration-issue-260/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-2026-05-29-rtl-migration-issue-260` then push
- [x] Open a PR from the doc branch to `main` with title `docs: archive rtl-migration-issue-260 (2026-05-29)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR (NEVER use `--admin`)
- [x] Monitor the doc PR until it merges; address any comments or CI failures
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d test/rtl-migration-issue-260 doc/archive-2026-05-29-rtl-migration-issue-260`
