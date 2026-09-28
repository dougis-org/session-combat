# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal — fetched `origin/main` before creating the worktree.
- [x] **Step 2 — Create and publish working branch:** done during proposal — worktree created at `.worktrees/fix-challenge-rating-nan` on branch `fix-challenge-rating-nan`, tracking `origin/main`, and pushed with `git push -u origin fix-challenge-rating-nan`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list for this session. Proceed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven (#757). Run `gh issue edit 757 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Look for existing tooling or functions in the codebase that can be reused before writing new logic — confirmed during proposal: no reusable finite-number-check helper exists elsewhere in `lib/import/`; `Number.isFinite` (standard library) is the correct, minimal primitive.
- [x] **Implement fix** in `lib/import/transformMonster.ts`: change the `"/"` branch of `parseChallengeRating` from
  ```ts
  return den > 0 ? num / den : 0;
  ```
  to
  ```ts
  return den > 0 && Number.isFinite(num) ? num / den : 0;
  ```
- [x] **Add regression tests** to the existing `transformMonster` test file (the suite added by the archived `fix-open5e-challenge-rating-type` change) covering:
  - `challenge_rating: "x/2"` → `monster.challengeRating === 0` (the bug case from issue #757)
  - `challenge_rating: "2/x"` → `monster.challengeRating === 0` (already-correct denominator case, locked in as regression coverage)
  - Assert `Number.isFinite(monster.challengeRating)` is `true` for both cases, per the reliability NFAC in `specs/monster-import/spec.md`
- [x] Confirm acceptance criteria are covered: all three functional scenarios and the one NFAC scenario in `specs/monster-import/spec.md` have a corresponding passing test.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit tests: `node node_modules/.bin/jest lib/import/transformMonster` (or the specific test file covering `transformMonster`) — must pass
- [x] Run full unit suite: `npm run test:unit` — must pass
- [x] E2E tests: not applicable — this is a pure-function fix inside the import pipeline with no UI or route surface change
- [x] Run type checks: `npx tsc --noEmit` (or project's documented typecheck script) — must pass
- [x] Run build: project's documented build script — must succeed with no errors
- [x] Run security/code quality checks required by project standards (e.g. Codacy CLI analysis) — must pass or findings triaged
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only origin/main` and check whether every changed file ends in `.md`. This change modifies `lib/import/transformMonster.ts` and a test file, so it is **not** docs-only — use the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass (expected unaffected by this change, but must still be green)
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-challenge-rating-nan` to `main`. PR body **must** include `Closes #757`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 757 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same discovery pattern as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (repo ruleset only allows squash merges; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, resolve the thread via the `resolveReviewThread` GraphQL mutation after replying, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent gate; human maintainer (dougis) via standard PR review
- Required approvals: repo branch protection default (squash-merge only, per repo ruleset)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved (reply + `resolveReviewThread` mutation)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — none expected; this is an internal bug fix with no public-facing docs to update
- [ ] Sync the approved spec delta from `specs/monster-import/spec.md` into `openspec/specs/monster-import/spec.md` (merge the MODIFIED requirement into the existing capability spec). Update relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-challenge-rating-nan/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-challenge-rating-nan/` to `openspec/changes/archive/YYYY-MM-DD-fix-challenge-rating-nan/`, staging both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-challenge-rating-nan/` exists and `openspec/changes/fix-challenge-rating-nan/` is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-fix-challenge-rating-nan` then `git push -u origin doc/archive-YYYY-MM-DD-fix-challenge-rating-nan`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-challenge-rating-nan` to `main` with title `docs: archive fix-challenge-rating-nan (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] Immediately enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches and remove the dedicated worktree: `git worktree remove .worktrees/fix-challenge-rating-nan`, then `git fetch --prune` and `git branch -D fix-challenge-rating-nan doc/archive-YYYY-MM-DD-fix-challenge-rating-nan`

Required cleanup after archive: `git worktree remove .worktrees/fix-challenge-rating-nan`, `git fetch --prune`, `git branch -D fix-challenge-rating-nan doc/archive-YYYY-MM-DD-fix-challenge-rating-nan`
