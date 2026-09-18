# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal (`git fetch origin main`)
- [x] **Step 2 — Create and publish working branch:** `.worktrees/fix-resize-test-opendock-shadow` created from `origin/main`, branch `fix-resize-test-opendock-shadow` pushed to remote

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 568 --add-label "in-progress"`. Discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] In `tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx`: rename the local `async function openDock()` (line 68) to `async function openDockLocal()`
- [x] Update the 4 call sites in the same file (lines 132, 168, 174, 197) from `openDock()` to `openDockLocal()`
- [x] In `tests/unit/components/CampaignChat/helpers.tsx`: add a one-line comment near the exported helpers (e.g. above `openDock` at line 78, or as a file-level note near the top of the exports) stating that local test-file helpers in sibling `CampaignChat.*.test.tsx` files must not reuse a `helpers.tsx` export name
- [x] Confirm no existing tooling/lint already covers this (checked during exploration — no ESLint rule for this exists in the repo; confirmed no reuse opportunity)
- [x] Confirm acceptance criteria in `openspec/changes/fix-resize-test-opendock-shadow/specs/testing-conventions/spec.md` are covered by the above edits

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npx jest tests/unit/components/CampaignChat/CampaignChat.resize.test.tsx` — all 7 tests must pass (13 tests in this file now pass; count grew since the spec was written, none failing)
- [x] Run the full `CampaignChat` test directory to confirm no other file references the renamed local function: `npx jest tests/unit/components/CampaignChat/` (91 passed)
- [x] Run E2E tests (not applicable — no runtime/UI behavior changed)
- [x] Run type checks: `npm run typecheck` (clean)
- [x] Run build: `npm run build` (succeeded)
- [ ] Run security/code quality checks required by project standards (Codacy/Verity gate)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only origin/main` and check whether every changed file ends in `.md`. This change touches `.tsx` files, so the **full path** applies.

**Full path:**

- **Unit tests** — `npx jest tests/unit/components/CampaignChat/` — all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass (none specific to this change, but the gate still runs)
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-resize-test-opendock-shadow` to `main`. PR body **must include `Closes #568`**.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 568 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery pattern as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (per repo's squash-only branch ruleset; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: doug (or delegated agent)
- Reviewer(s): pr-review-toolkit:review-pr sub-agent + human reviewer per branch protection
- Required approvals: 0 (per `main` squash-only ruleset — `ci-gate` + Codacy required checks must pass)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — test-only change)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/testing-conventions/spec.md` to `openspec/specs/testing-conventions/spec.md` (create the capability if it doesn't already exist), updating any relative links to point to `../../changes/archive/YYYY-MM-DD-fix-resize-test-opendock-shadow/design.md` and `.../tasks.md`
- [ ] Archive the change: move `openspec/changes/fix-resize-test-opendock-shadow/` to `openspec/changes/archive/YYYY-MM-DD-fix-resize-test-opendock-shadow/`, staging both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-resize-test-opendock-shadow/` exists and `openspec/changes/fix-resize-test-opendock-shadow/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-resize-test-opendock-shadow` then `git push -u origin doc/archive-YYYY-MM-DD-fix-resize-test-opendock-shadow`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-resize-test-opendock-shadow` to `main` with title `docs: archive fix-resize-test-opendock-shadow (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-resize-test-opendock-shadow doc/archive-YYYY-MM-DD-fix-resize-test-opendock-shadow`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-resize-test-opendock-shadow` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-resize-test-opendock-shadow doc/archive-YYYY-MM-DD-fix-resize-test-opendock-shadow`
