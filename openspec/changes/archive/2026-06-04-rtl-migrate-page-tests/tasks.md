# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/rtl-migrate-page-tests` then immediately `git push -u origin refactor/rtl-migrate-page-tests`

## Execution

### Confirm RTL is available

- [x] Verify `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` are listed in `package.json` devDependencies
- [x] Run `npm run test:unit -- --testPathPattern="SessionsPage"` and confirm current tests pass (baseline)

### Migrate SessionsPage.test.tsx (smallest — do first)

- [x] Remove `@jest-environment jsdom` docblock (lines 1-3)
- [x] Remove `(globalThis as ...).IS_REACT_ACT_ENVIRONMENT = true`
- [x] Remove `import { createRoot } from 'react-dom/client'` and `import { act } from 'react'`
- [x] Remove `import { setupUiTest } from '@/tests/unit/helpers/uiTestSetup'`
- [x] Add `import { render, screen } from '@testing-library/react'`
- [x] Add `import userEvent from '@testing-library/user-event'`
- [x] Replace `setupUiTest()` + `createRoot` render block with `render(<SessionsPage />)` inside each test or a `beforeEach`-free inline render
- [x] Replace all `ctx.container.textContent.toContain(...)` with `expect(screen.getByText(...)).toBeInTheDocument()`
- [x] Replace `Array.from(ctx.container.querySelectorAll('button')).find(b => b.textContent?.includes('New Session'))` with `screen.getByRole('button', { name: /new session/i })`
- [x] Replace all `await act(async () => { btn.click() })` with `await userEvent.click(btn)`
- [x] Run `npm run test:unit -- --testPathPattern="SessionsPage"` — all tests must pass, zero act() warnings

### Migrate PartiesPage.test.tsx

- [x] Remove `@jest-environment jsdom` docblock
- [x] Remove `IS_REACT_ACT_ENVIRONMENT` global mutation
- [x] Remove `createRoot`, `act`, and `setupUiTest` imports
- [x] Add `render`, `screen` from `@testing-library/react`; add `userEvent` from `@testing-library/user-event`
- [x] Replace `setupUiTest()` / `createReactRoot()` render pattern with `render(<PartiesPage />)`
- [x] Inspect component source to confirm ARIA role on `[aria-label^="Member section:"]` elements (run `grep -n "role\|aria-label" src/...` or read the component)
- [x] Replace `ctx.container.querySelectorAll('[aria-label^="Member section:"]')` with `screen.getAllByRole('region', { name: /member section/i })` or `screen.getAllByLabelText(/member section/i)` — confirm element count matches
- [x] Replace all `ctx.container.textContent.toContain(...)` with `expect(screen.getByText(...)).toBeInTheDocument()`
- [x] Replace any `act(() => { btn.click() })` with `await userEvent.click(...)`
- [x] Run `npm run test:unit -- --testPathPattern="PartiesPage"` — all tests must pass, zero act() warnings

### Migrate CampaignsPage.test.tsx (most complex — do last)

- [x] Remove `@jest-environment jsdom` docblock
- [x] Remove `IS_REACT_ACT_ENVIRONMENT` global mutation
- [x] Remove `createRoot`, `Root`, `act` imports
- [x] Add `render`, `screen` from `@testing-library/react`; add `userEvent` from `@testing-library/user-event`
- [x] Replace `createRoot` render block with `render(<CampaignsPage />)`
- [x] Replace all `container.textContent.toContain(...)` with `expect(screen.getByText(...)).toBeInTheDocument()`
- [x] Replace negative `not.toContain('📖 Current Chapter:')` with `expect(screen.queryByText(/current chapter/i)).not.toBeInTheDocument()`
- [x] Replace `Array.from(container.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Copy')` with `screen.getByRole('button', { name: /copy/i })`
- [x] Replace heading order check via `querySelectorAll('h1, h2')` with `screen.getAllByRole('heading')` and assert order via returned array index
- [x] Replace nested `act()` async fetch patterns with `await screen.findByText(...)` / `await screen.findByRole(...)`
- [x] Replace loading button check (finding "Copying..." button) with `await screen.findByRole('button', { name: /copying/i })`
- [x] Run `npm run test:unit -- --testPathPattern="CampaignsPage"` — all tests must pass, zero act() warnings

### Final validation

- [x] Run full unit test suite: `npm run test:unit` — all tests pass
- [x] Confirm no `createRoot`, `IS_REACT_ACT`, or `@jest-environment jsdom` remain in the three files: `grep -n "createRoot\|IS_REACT_ACT\|@jest-environment" tests/unit/components/SessionsPage.test.tsx tests/unit/components/PartiesPage.test.tsx tests/unit/components/CampaignsPage.test.tsx` — expect no matches

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — no build errors
- [x] `npx tsc --noEmit` — no type errors
- [x] Confirm test counts for the three files match pre-migration (use `--verbose` flag)
- [x] Confirm zero `act()` or `IS_REACT_ACT_ENVIRONMENT` warnings in test output
- [x] All tasks in Execution section checked off

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration` if applicable; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [x] Commit all changes to `refactor/rtl-migrate-page-tests` and push
- [x] Open PR from `refactor/rtl-migrate-page-tests` to `main`. PR body must include: `Closes #263`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow Remote push validation, push; wait 180 seconds; repeat until no unresolved comments remain
- [x] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, push; wait 180 seconds; repeat until all required checks pass
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: assigned agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Review comment → address → resolve thread → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the three migrated test files appear on `main` with RTL imports
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required — test-only change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive the change: move `openspec/changes/rtl-migrate-page-tests/` to `openspec/changes/archive/2026-06-04-rtl-migrate-page-tests/` **in a single commit** (copy + delete staged together — never split)
- [x] Confirm `openspec/changes/archive/2026-06-04-rtl-migrate-page-tests/` exists and `openspec/changes/rtl-migrate-page-tests/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-2026-06-04-rtl-migrate-page-tests` then `git push -u origin doc/archive-2026-06-04-rtl-migrate-page-tests`
- [x] Open a PR from the doc branch to `main` with title `docs: archive rtl-migrate-page-tests (2026-06-04)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [x] Monitor the doc PR until merged (same loop: address comments and CI failures, push to doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d refactor/rtl-migrate-page-tests doc/archive-2026-06-04-rtl-migrate-page-tests`
