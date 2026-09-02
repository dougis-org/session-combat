# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/populate-campaigns-g4` then immediately `git push -u origin feature/populate-campaigns-g4`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — SKIPPED: this change is not issue-driven (the original #581 was consumed by populate-campaigns-g3; per maintainer direction G4 carries no issue link).
- [x] Implement sub-tasks in small, testable increments
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch
- [x] Confirm acceptance criteria are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable) — N/A: change adds only campaign seed data (lib/data, lib/scripts CLI) with no runtime/API/UI surface; covered by CI
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
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
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. This change carries no issue link (not issue-driven), so the PR body does NOT include a `Closes #` line. (PR #675)
- [x] **Issue lifecycle: mark in-review** — SKIPPED: not issue-driven (see in-progress step above).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; addressed all in-scope findings (requireCustomMonsterById fail-fast, GLOBAL_USER_ID reference, "Wererat" typo, Mad Mage encounter ordering, ac>0 contract assertion) in commit 0e7e4a5. Pre-existing main bugs (cm-driders/cm-purple-worm typos, cm-relentless-impaler dup) noted for a separate hotfix.
- [x] **Enable auto-merge** after review gate passed: `gh pr merge 675 --auto --squash` (repo ruleset requires squash).
- [x] **Iterate until merged** — PR #675 reached MERGED (squash) with all 13 checks green; no unresolved review threads. — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Doug Hubbard (@dougis)
- Reviewer(s): TBD
- Required approvals: 1 human approval

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch (commit 5b269826 on main)
- [x] Mark all remaining tasks as complete
- [x] Update repository documentation impacted by the change (docs/campaign-encounter-rollout.md updated in PR #675)
- [x] Sync approved spec deltas into `openspec/specs/`: added populate-campaigns-g4 capability spec; merged G4 scenarios into campaign-monsters and campaign-templates.
- [x] Archive the change: moved to openspec/changes/archive/2026-09-02-populate-campaigns-g4/.
- [x] Confirm archive location exists and the active change dir is gone.
- [x] **Create a doc branch**: doc/archive-2026-09-02-populate-campaigns-g4.
- [x] Open docs-only PR from doc/archive-2026-09-02-populate-campaigns-g4 to main.
- [x] Enable auto-merge (squash) on the doc PR.
- [x] Monitor the doc PR until it merges.
- [x] Prune merged local branches.

Required cleanup after archive: `git fetch --prune` and `git branch -D feature/populate-campaigns-g4 doc/archive-YYYY-MM-DD-populate-campaigns-g4`
