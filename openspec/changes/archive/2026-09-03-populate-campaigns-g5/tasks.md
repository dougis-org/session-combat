# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Decide on PR split:** Decide whether to split G5 into 2-3 sub-group PRs (G5a, G5b, G5c) for reviewability. Default: split into 3 PRs (top-8 campaigns by popularity; next 10; remaining 7).
- [x] **Step 3 — Create and publish working branches:** For each sub-group PR, create a feature branch (`feature/populate-campaigns-g5a`, etc.) and `git push -u origin <branch>`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** _(skip if change is not issue-driven)_: run `gh issue edit #581 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo, resolve the "In Progress" status field, and move the project item via `gh project item-edit`.
- [x] Implement sub-tasks in small, testable increments (one sub-group at a time)
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch
- [x] Confirm acceptance criteria are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

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

- [x] For each sub-group PR, ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open each PR from working branch to `main`. **The PR body MUST include `Closes #581`** (unconditionally, not as an optional conditional).
- [x] **Issue lifecycle: mark in-review** _(skip if change is not issue-driven)_: run `gh issue edit #581 --add-label "in-review" --remove-label "in-progress"`. Move the project item to "In Review" via `gh project item-edit`.
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] **Iterate until merged** — repeat the priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify the user.

Ownership metadata:

- Implementer: Doug Hubbard (@dougis)
- Reviewer(s): TBD
- Required approvals: 1 human approval

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] After all sub-group PRs are merged: `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (especially `docs/campaign-encounter-rollout.md` status header to "rollout complete")
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location.
- [x] Archive the change: move `openspec/changes/populate-campaigns-g5/` to `openspec/changes/archive/YYYY-MM-DD-populate-campaigns-g5/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-populate-campaigns-g5/` exists and `openspec/changes/populate-campaigns-g5/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-populate-campaigns-g5` then `git push -u origin doc/archive-YYYY-MM-DD-populate-campaigns-g5`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-populate-campaigns-g5` to `main` with title `docs: archive populate-campaigns-g5 (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D feature/populate-campaigns-g5a feature/populate-campaigns-g5b feature/populate-campaigns-g5c doc/archive-YYYY-MM-DD-populate-campaigns-g5`

Required cleanup after archive: `git fetch --prune` and `git branch -D <feature-branches>`.
