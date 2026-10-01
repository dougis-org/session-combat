# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin` (worktree `.worktrees/fix-initiative-set-button-layout` already created off `origin/main`)
- [x] **Step 2 — Confirm working branch is published:** `git push -u origin fix-initiative-set-button-layout` (already pushed during propose)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress:** run `gh issue edit 793 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update.
- [x] 1.1 Confirm work happens in `.worktrees/fix-initiative-set-button-layout`.
- [x] 2.1 (TDD, see tests.md T1) Write failing test: dice-mode input and Set share a parent with "Roll d20" and follow the button row. Then restructure `lib/components/InitiativeEntry.tsx` content container into `grid grid-cols-1 md:grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-start`.
- [x] 2.2 Move mode buttons, Advantage/Flat bonus row, and the `flex items-start gap-2` entry div into a single controls-column wrapper (column 2). Keep the entry div markup unchanged.
- [x] 2.3 Verify total mode and the result readout render in the same column.
- [x] 2.4 Refactor; confirm no behavior or prop changes.
- [x] 2.5 Reuse existing tests/helpers in `tests/unit/components/InitiativeEntry.test.tsx`; do not duplicate setup.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] 3.1 `npx jest tests/unit/components/InitiativeEntry.test.tsx tests/unit/combat/initiativeEntry.test.tsx` — all pass
- [x] 3.2 Visual check in browser at desktop and mobile widths (use a free port, not 3000): Set button visible, left-aligned under "Roll d20"
- [x] 3.3 Run type checks (`npx tsc --noEmit`)
- [x] 3.4 Run build (`npm run build`)
- [x] 3.5 Run security/code quality checks required by project standards
- [x] 3.6 All completed tasks marked complete
- [x] 3.7 All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only origin/main` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `fix-initiative-set-button-layout` to `main`. The PR body MUST include `Closes #793`.
- [x] **Issue lifecycle: mark in-review:** run `gh issue edit 793 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the "In Review" column via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (repo ruleset is squash-only; NEVER use `--admin`)
- [x] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user; never force-merge):
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, validate, push, wait 180 seconds
  3. **CI check failures** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart from step 1

Ownership metadata:

- Implementer: Claude Code agent (assigned to issue owner)
- Reviewer(s): `pr-review-toolkit:review-pr`, Codacy, repo owner
- Required approvals: 0 (ruleset); `ci-gate` + Codacy required checks

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none expected)
- [x] Sync approved spec deltas into `openspec/specs/initiative-entry/spec.md` (hand-merge; `openspec archive` aborts on malformed live specs — use `--skip-specs`). Update relative links into the change directory to `../../changes/archive/YYYY-MM-DD-fix-initiative-set-button-layout/design.md` and `.../tasks.md`.
- [x] Archive: move `openspec/changes/fix-initiative-set-button-layout/` to `openspec/changes/archive/YYYY-MM-DD-fix-initiative-set-button-layout/` in a single commit (copy + deletion together)
- [x] Confirm the archive directory exists and the original is gone
- [x] Create doc branch `doc/archive-YYYY-MM-DD-fix-initiative-set-button-layout`, push with `-u`, open PR titled `docs: archive fix-initiative-set-button-layout (YYYY-MM-DD)` — do NOT push directly to `main`
- [x] Immediately enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`; monitor until merged
- [x] Remove the worktree with `git worktree remove --force .worktrees/fix-initiative-set-button-layout` (submodule requires `--force`), then `git fetch --prune` and `git branch -D fix-initiative-set-button-layout doc/archive-YYYY-MM-DD-fix-initiative-set-button-layout`
