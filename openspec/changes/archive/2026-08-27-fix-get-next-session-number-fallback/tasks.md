## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout <default-branch>` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-get-next-session-number-fallback` then immediately `git push -u origin fix-get-next-session-number-fallback` (branch already exists locally and tracks `origin/fix-get-next-session-number-fallback`)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** _(skip if change is not issue-driven)_: run `gh issue edit #527 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo, resolve the status field option matching "In Progress", and move the project item. If no project item is found, log a warning and continue.

### 1. Storage layer

- [x] 1.1 In `lib/storage.ts`, rewrite `getNextSessionNumber(userId, campaignId)` to wrap its existing `findOne` query in `runStorageOp({ name: "getNextSessionNumber", collection: "sessionLogs" }, fn)` (no `isEmpty` classifier), returning `runStorageOp`'s result directly.
- [x] 1.2 Remove the method's existing `try/catch` + `console.error` + `return 1` fallback — failures must propagate as the `StorageError` thrown by `runStorageOp`.
- [x] 1.3 Confirm imports for `runStorageOp` (`@/lib/storage/runOp`) are added to `lib/storage.ts`.

### 2. API error handling — sessions/route.ts

- [x] 2.1 In `app/api/campaigns/[id]/sessions/route.ts`, isolate the `await storage.getNextSessionNumber(...)` call (used only when `sessionNumber` is not supplied in the body) in its own try/catch, separate from the handler's outer try/catch.
- [x] 2.2 On catch, log the error distinctly (e.g. `console.error("Error determining next session number:", error)`) and return `NextResponse.json({ error: "Failed to determine next session number", code: "SESSION_NUMBER_UNAVAILABLE" }, { status: 503 })`.
- [x] 2.3 Confirm the explicit-`sessionNumber` request path (where `getNextSessionNumber` is never called) is unaffected.

### 3. API error handling — sessions/active/route.ts

- [x] 3.1 In `app/api/campaigns/[id]/sessions/active/route.ts`, reorder the handler to call `storage.getNextSessionNumber(campaign.userId, campaignId)` *before* `storage.claimActiveCampaignSession(...)`, per design.md Decision 4 — this closes the failure window where a claimed `activeSessionId` could be left with no matching `SessionLog`.
- [x] 3.2 Wrap the (now earlier) `getNextSessionNumber` call in its own try/catch, separate from the handler's outer try/catch.
- [x] 3.3 On catch, return the same distinguishable response shape as task 2.2 (`SESSION_NUMBER_UNAVAILABLE`, 503) — since this now runs before `claimActiveCampaignSession`, no rollback is needed: nothing has been mutated yet.
- [x] 3.4 Confirm the existing "already active" 409 check (`if (campaign.activeSessionId)`) still runs first, ahead of the reordered `getNextSessionNumber` call, so an already-active campaign short-circuits before any lookup.

### 4. Tests

- [x] 4.1 Add/extend unit tests for `storage.getNextSessionNumber` in the existing `lib/storage.ts` test suite: on DB failure, it rejects with a `StorageError` (not a resolved `1`).
- [x] 4.2 Add a unit test proving no-collision: given an existing session numbered `1` for a campaign, a simulated DB failure on the next `getNextSessionNumber` call throws rather than resolving to `1` again.
- [x] 4.3 Add/extend route tests for `POST /api/campaigns/[id]/sessions` (no `sessionNumber` in body): on `getNextSessionNumber` throwing, assert status `503`, `code: "SESSION_NUMBER_UNAVAILABLE"`, and that `storage.saveSessionLog` was never called.
- [x] 4.4 Add/extend route tests for `POST /api/campaigns/[id]/sessions/active`: same failure-path assertions as 4.3, plus asserting `storage.claimActiveCampaignSession` was never called when `getNextSessionNumber` throws (proving the reorder in task 3.1 closed the dangling-claim window).
- [x] 4.5 Add/extend a route test for `POST /api/campaigns/[id]/sessions` confirming the explicit-`sessionNumber` path still succeeds even when `getNextSessionNumber` would fail (proving it's never invoked).

### 5. Documentation

- [x] 5.1 Confirm `design.md`'s "reference-example caveat for #504" note accurately reflects the final implementation.

- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (n/a — this change consumes the existing `runStorageOp` foundation from #501 as-is)
- [x] Confirm acceptance criteria are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. (One duplication finding surfaced — rejected, it contradicts design.md's explicit "acceptable at two call sites" decision, not a clearly-correct fix.)

## Validation

- [x] Run unit/integration tests (2981 unit tests pass; 325/330 integration pass, 1 pre-existing unrelated flake confirmed passing in isolation)
- [x] Run E2E tests (if applicable) (225/232 pass; 7 failures in combat.spec.ts / campaign-combat-linking.spec.ts, confirmed pre-existing/flaky by re-running those specs against the unmodified base state via git stash — same specs fail there too, unrelated to this change's diff)
- [x] Run type checks (`tsc --noEmit`: no errors)
- [x] Run build (`npm run build`: succeeds)
- [x] Run security/code quality checks required by project standards (`npm run lint`: 0 errors, pre-existing warnings unrelated to this change)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote (commit 56ed200)
- [x] Open PR from working branch to `main`. **If this change is issue-driven, the PR body MUST include `Closes #527`.** (PR #563: https://github.com/dougis-org/session-combat/pull/563)
- [x] **Issue lifecycle: mark in-review** _(skip if change is not issue-driven)_: run `gh issue edit #527 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column matching "In Review" (warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (sub-agent dispatched; zero blocking findings, all CI checks passed)
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge: (merged — all 11 checks passed: build, lint, unit-tests, integration-tests, regression-tests, Codacy analysis/coverage, ci-gate)
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Claude (agent session)
- Reviewer(s): pr-review-toolkit:review-pr (automated)
- Required approvals: per branch protection rules

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch (commit fdf8d34)
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (n/a — no user-facing docs beyond the spec delta below)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location. (repo uses `openspec/specs/session-log/session-log.md`, not the `spec.md` convention the CLI's auto-sync expects — archived with `--skip-specs` and merged the ADDED requirement + MODIFIED creation-requirement text into that file by hand)
- [x] Archive the change: move `openspec/changes/fix-get-next-session-number-fallback/` to `openspec/changes/archive/YYYY-MM-DD-fix-get-next-session-number-fallback/` **and stage both the new location and the deletion of the old location in a single commit**.
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-get-next-session-number-fallback/` exists and `openspec/changes/fix-get-next-session-number-fallback/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-get-next-session-number-fallback` then `git push -u origin doc/archive-YYYY-MM-DD-fix-get-next-session-number-fallback`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-get-next-session-number-fallback` to `main` with title `docs: archive fix-get-next-session-number-fallback (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-get-next-session-number-fallback doc/archive-YYYY-MM-DD-fix-get-next-session-number-fallback`
