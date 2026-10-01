# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** worktree `.worktrees/fix-initiative-entry-clipping` on branch `fix-initiative-entry-clipping`, pushed with `git push -u origin fix-initiative-entry-clipping`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] `cd .worktrees/fix-initiative-entry-clipping`; confirm the branch is pushed to remote
- [x] **Issue lifecycle: mark in-progress** (#802): run `gh issue edit #N --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner <owner> --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner <owner> --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] 1. (TDD) Add failing tests in `tests/unit/combat/initiativeEntry.test.tsx` per `tests.md`; then in `lib/components/InitiativeEntry.tsx` change the scroll container `pr-1` to `p-1` (keep `max-h-[70vh] overflow-y-auto mb-4`)
- [x] 2. (TDD) Add `w-full min-w-0` to the entry row and each mode's inner `div.flex`, and `min-w-0 flex-1` to the inputs in `lib/components/InitiativeEntry.tsx`; keep the row `flex` (not `flex-col`)
- [x] 3. (TDD) Add optional `onModeChange` prop to `InitiativeEntry` called when `entryMode` changes
- [x] 4. (TDD) In `lib/hooks/useInitiativeModal.ts` extract the clamp into a reusable function and expose a re-measure; wire `onModeChange` -> re-measure in `lib/components/ActiveCombatView.tsx`; add hook test in `tests/unit/`
- [x] 5. Look for existing helpers to reuse before adding new logic
- [x] 6. Verify in browser (Playwright, free port, not 3000): focus the entry input at narrow card width and near viewport bottom; confirm no clipping and no blank space
- [x] 7. Confirm acceptance criteria in `specs/modal-initiative-entry/spec.md` are covered

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
- [x] Open PR from working branch to `<default-branch>`. **If this change is issue-driven, the PR body MUST include `Closes #N` for each linked issue** (unconditionally, not as an optional conditional).
- [x] **Issue lifecycle: mark in-review** _(skip if change is not issue-driven)_: run `gh issue edit #N --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Claude (agent) for dougis
- Reviewer(s):
- Required approvals:

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout <default-branch>` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-<name>/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [x] Archive the change: move `openspec/changes/<name>/` to `openspec/changes/archive/YYYY-MM-DD-<name>/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-<name>/` exists and `openspec/changes/<name>/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-<name>` then `git push -u origin doc/archive-YYYY-MM-DD-<name>`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-<name>` to `<default-branch>` with title `docs: archive <name> (YYYY-MM-DD)` — **do NOT push directly to `<default-branch>`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D <feature-branch> doc/archive-YYYY-MM-DD-<name>`

Required cleanup after archive: `git fetch --prune` and `git branch -D <feature-branch> doc/archive-YYYY-MM-DD-<name>`
