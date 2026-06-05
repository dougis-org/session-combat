# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/rtl-migration-issue-355` then immediately `git push -u origin test/rtl-migration-issue-355`

## Execution

### File 1 — Migrate `tests/unit/CombatStatsRow.test.tsx`

- [x] Remove imports: `createReactRoot`, `unmountReactRoot`, `Root` from `react-dom/client`, `act` from `react`
- [x] Add imports: `render`, `screen` from `@testing-library/react`
- [x] Remove module-level `container` and `root` variables and `afterEach(() => unmountReactRoot(...))` block
- [x] Replace `renderComponent()` helper (which calls `createReactRoot` + `act(() => root.render(...))`) with inline `render(<CombatStatsRow ... />)` at the top of each test
- [x] Replace `container.textContent.toContain('18')` → `expect(screen.getByText('18')).toBeInTheDocument()`; apply same pattern for all `textContent` assertions
- [x] Verify: `npx jest tests/unit/CombatStatsRow.test.tsx --no-coverage` passes

### File 2 — Migrate `tests/unit/CharacterMiniSummary.test.tsx`

- [x] Remove imports: `createReactRoot`, `unmountReactRoot`, `Root`, `act`
- [x] Add imports: `render`, `screen` from `@testing-library/react`
- [x] Remove module-level `container`/`root` variables and `afterEach` teardown
- [x] Replace `renderComponent()` helper with inline `render(<CharacterMiniSummary ... />)` in each test
- [x] Replace `container.textContent.toContain('X')` with `screen.getByText(/X/)` + `toBeInTheDocument()`; use `not.toBeInTheDocument()` for negative assertions
- [x] Preserve `global.fetch` spy test; confirm it still passes with RTL render
- [x] Verify: `npx jest tests/unit/CharacterMiniSummary.test.tsx --no-coverage` passes

### File 3 — Migrate `tests/unit/LairForm.test.tsx`

- [x] Remove imports: `createReactRoot`, `unmountReactRoot`, `Root`, `act`
- [x] Add imports: `render`, `screen` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`
- [x] Remove `beforeEach`/`afterEach` container lifecycle blocks
- [x] Replace the `render` helper (which wraps `await act(async () => { root.render(...) })`) with a new async helper that calls `render(<LairForm {...merged} />)` synchronously (no `act` wrapper needed)
- [x] Replace `container.querySelector('[data-testid="lair-name-input"]')` → `screen.getByTestId('lair-name-input')`
- [x] Replace `container.querySelectorAll('button').find(b => b.textContent?.includes('Add Lair'))` → `screen.getByRole('button', { name: /Add Lair/i })`
- [x] Replace `btn.click()` interaction with `const user = userEvent.setup(); await user.click(btn)` inside each test that clicks
- [x] Verify: `npx jest tests/unit/LairForm.test.tsx --no-coverage` passes

### File 4 — Migrate `tests/unit/LairActionsSlot.test.tsx`

- [x] Remove imports: `createReactRoot`, `unmountReactRoot`, `Root`, `act`
- [x] Add imports: `render`, `screen` from `@testing-library/react`; `userEvent` from `@testing-library/user-event`
- [x] Remove `beforeEach`/`afterEach` container lifecycle blocks (note: `LairActionsSlot` sets `root` in `beforeEach` — remove entirely)
- [x] Replace `renderSlot()` helper: remove `await act(async () => { root.render(...) })`; use `render(<LairActionsSlot ... />)` synchronously
- [x] Replace `container.querySelector('[data-testid="..."]')` in `clickEl()` helper with `screen.getByTestId('...')`
- [x] Replace `el.click()` in `clickEl()` with `const user = userEvent.setup(); await user.click(el)` — or refactor `clickEl` to accept the user instance
- [x] Replace any remaining `container.querySelector` or `container.textContent` assertions with RTL screen queries
- [x] Verify: `npx jest tests/unit/LairActionsSlot.test.tsx --no-coverage` passes

### Final checks

- [x] Confirm no `reactRoot` imports remain in the 4 migrated files: `grep "reactRoot" tests/unit/LairForm.test.tsx tests/unit/CharacterMiniSummary.test.tsx tests/unit/LairActionsSlot.test.tsx tests/unit/CombatStatsRow.test.tsx` — expect no matches
- [x] Confirm `tests/unit/helpers/reactRoot.ts` still exists (not deleted)
- [x] Confirm `tests/unit/components/CampaignEditor.test.tsx` still imports `reactRoot` (not inadvertently broken)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill targeting the 4 modified test files. The primary agent must automatically address all findings (complexity, duplication, style issues) before committing.

## Validation

- [x] Run full unit test suite: `npm run test:unit` — all tests must pass
- [x] Run type check: `npm run typecheck` (or equivalent) — no new errors
- [x] Run lint: `npm run lint` — no new errors
- [x] Confirm test count is unchanged (no tests removed or newly skipped)
- [x] All tasks in Execution section marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Ensure `openspec-review-code` sub-agent was run and all findings addressed before the final commit
- [ ] Commit all changes to `test/rtl-migration-issue-355` and push to remote
- [ ] Open PR from `test/rtl-migration-issue-355` to `main` with body including `Closes #355`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (never `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address, commit, validate locally, push, wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll via `gh pr checks <PR-URL> --json isRequired,state`; for any required failing check: diagnose, fix, validate locally, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks complete
- [ ] No documentation updates required (test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/migrate-createreactroot-to-rtl/` to `openspec/changes/archive/YYYY-MM-DD-migrate-createreactroot-to-rtl/` in a single commit (copy + delete staged together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-createreactroot-to-rtl/` exists and `openspec/changes/migrate-createreactroot-to-rtl/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-migrate-createreactroot-to-rtl` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-createreactroot-to-rtl`
- [ ] Open PR from doc branch to `main` with title `docs: archive migrate-createreactroot-to-rtl (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d test/rtl-migration-issue-355 doc/archive-YYYY-MM-DD-migrate-createreactroot-to-rtl`
