# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/495-build-test-comments` then immediately `git push -u origin feat/495-build-test-comments`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed. (Satisfied via the `pr-reviewer` skill in the agent configuration used for this change; treat this as a check for *some* PR-review-automation tooling, not a hard dependency on that exact skill name.)

## Execution

- [x] **Issue lifecycle: mark in-progress** : run `gh issue edit 495 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds). (Label updated successfully; project update skipped due to missing `read:project` scope).
- [x] **TDD Setup**: Define test scenarios and expected behaviors in `tests.md` before implementing code changes.
- [x] **Implement Workflow Comments Logic**: Update the `ci-gate` job in `.github/workflows/build-test.yml` to:
  - Add `contents: read` and `issues: write` permissions.
  - Add the `actions/github-script` block with logic to find, create, update (prepend history), or delete comments on success or failure, wrapped in a graceful `try-catch` block.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch
- [x] Confirm acceptance criteria are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. (Sub-agent executed, applied line ending normalization to body checks, and externalized workflow logic to eliminate duplication; all unit tests pass).

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
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
- [x] Open PR from working branch to `main`. **The PR body MUST include `Closes #495`** (unconditionally).
- [x] **Issue lifecycle: mark in-review** : run `gh issue edit 495 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found). (Labels updated successfully; project update skipped due to missing scope).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (Satisfied by spawning `pr-reviewer` sub-agent on PR 497).
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge) (used `--squash` per repo default merge method; PR #497 merged).
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none found referencing `build-test.yml`/`ci-gate` outside the change's own artifacts).
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/build-test-comments/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/2026-07-11-build-test-failure-comments/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [x] Archive the change: move `openspec/changes/build-test-failure-comments/` to `openspec/changes/archive/2026-07-11-build-test-failure-comments/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-07-11-build-test-failure-comments/` exists and `openspec/changes/build-test-failure-comments/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-07-11-build-test-failure-comments` then `git push -u origin doc/archive-2026-07-11-build-test-failure-comments`
- [ ] Open a PR from `doc/archive-2026-07-11-build-test-failure-comments` to `main` with title `docs: archive build-test-failure-comments (2026-07-11)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/495-build-test-comments doc/archive-2026-07-11-build-test-failure-comments`

Required cleanup after archive: `git fetch --prune` and `git branch -D feat/495-build-test-comments doc/archive-2026-07-11-build-test-failure-comments`
