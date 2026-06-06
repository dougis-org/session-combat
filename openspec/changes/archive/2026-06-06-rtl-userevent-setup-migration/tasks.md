# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b test/rtl-userevent-setup-migration` then immediately `git push -u origin test/rtl-userevent-setup-migration`

## Execution

### AlignmentSelect.test.tsx (inline `const user`)

- [x] In `tests/unit/components/AlignmentSelect.test.tsx`, find the test that calls `userEvent.selectOptions(...)` (line ~57)
- [x] Add `const user = userEvent.setup();` at the top of that test function, before `render`
- [x] Replace `await userEvent.selectOptions(...)` with `await user.selectOptions(...)`
- [x] Verify: `npm run test:unit -- --testPathPattern=AlignmentSelect` passes

### NavBar.test.tsx (inline `const user`)

- [x] In `tests/unit/components/NavBar.test.tsx`, find the test that calls `userEvent.click(...)` (line ~61)
- [x] Add `const user = userEvent.setup();` at the top of that test function, before `render`
- [x] Replace `await userEvent.click(...)` with `await user.click(...)`
- [x] Verify: `npm run test:unit -- --testPathPattern=NavBar` passes

### RegisterPage.test.tsx (inline `const user`)

- [x] In `tests/unit/components/RegisterPage.test.tsx`, find the test (or helper) containing the 4 `userEvent.type(...)` calls (lines ~46–55)
- [x] Add `const user = userEvent.setup();` at the top of the enclosing test function
- [x] Replace all 4 `await userEvent.type(...)` calls with `await user.type(...)`
- [x] Verify: `npm run test:unit -- --testPathPattern=RegisterPage` passes

### CampaignsPage.test.tsx (`beforeEach` pattern)

- [x] In `tests/unit/components/CampaignsPage.test.tsx`, identify the describe block containing the 3 `it` blocks that call `userEvent.click(...)` (lines ~122, ~150, ~175)
- [x] Add `let user: ReturnType<typeof userEvent.setup>;` at describe scope
- [x] Add `beforeEach(() => { user = userEvent.setup(); });` inside that describe block
- [x] Replace all 3 `await userEvent.click(...)` calls with `await user.click(...)`
- [x] Verify: `npm run test:unit -- --testPathPattern=CampaignsPage` passes

### SessionsPage.test.tsx (`beforeEach` pattern)

- [x] In `tests/unit/components/SessionsPage.test.tsx`, identify the describe block containing the 2 `test` blocks that call `userEvent.click(...)` (lines ~109, ~118)
- [x] Add `let user: ReturnType<typeof userEvent.setup>;` at describe scope
- [x] Add `beforeEach(() => { user = userEvent.setup(); });` inside that describe block
- [x] Replace both `await userEvent.click(...)` calls with `await user.click(...)`
- [x] Verify: `npm run test:unit -- --testPathPattern=SessionsPage` passes

### Final verification

- [x] Confirm no static calls remain: `grep -r "userEvent\.\(click\|type\|selectOptions\)" tests/` returns empty
- [x] Run full suite: `npm run test:unit` exits 0

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — build succeeds
- [x] `grep -r "userEvent\.\(click\|type\|selectOptions\)" tests/` — no output

Note: No integration or E2E changes needed — this is a test-only migration.

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `test/rtl-userevent-setup-migration` to `main`. **PR body MUST include `Closes #369`.**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: dougis
- Reviewer(s): (auto-assigned by ruleset)
- Required approvals: per repository ruleset

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on main (`git log --oneline -5`)
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required — test-only change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive the change: move `openspec/changes/rtl-userevent-setup-migration/` to `openspec/changes/archive/2026-06-06-rtl-userevent-setup-migration/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-06-06-rtl-userevent-setup-migration/` exists and `openspec/changes/rtl-userevent-setup-migration/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-06-rtl-userevent-setup-migration` then `git push -u origin doc/archive-2026-06-06-rtl-userevent-setup-migration`
- [x] Open a PR from `doc/archive-2026-06-06-rtl-userevent-setup-migration` to `main` with title `docs: archive rtl-userevent-setup-migration (2026-06-06)` — **do NOT push directly to main**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d test/rtl-userevent-setup-migration doc/archive-2026-06-06-rtl-userevent-setup-migration`
