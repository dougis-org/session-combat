# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`, worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** `.worktrees/fix-open5e-challenge-rating-type` created with branch `fix-open5e-challenge-rating-type`, pushed to `origin/fix-open5e-challenge-rating-type` during propose

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed. (Confirmed present in this environment's skill list as of proposal time; re-verify at apply time.)

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 161 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Widen `Open5ECreature.challenge_rating` type from `number` to `number | string` in `lib/import/open5eAdapter.ts`
- [x] Confirm no other consumer of `Open5ECreature.challenge_rating` needs a code change (searched: only `parseChallengeRating(raw.challenge_rating)` in `lib/import/transformMonster.ts`, which already takes `unknown` — no change needed there)
- [x] Add unit test: `transformMonster` with `challenge_rating: "1/2"` → `monster.challengeRating === 0.5` (`tests/unit/import/transformMonster.test.ts`)
- [x] Add unit test: `transformMonster` with `challenge_rating: "1/4"` → `monster.challengeRating === 0.25`
- [x] Add unit test: `transformMonster` with `challenge_rating: "1/8"` → `monster.challengeRating === 0.125`
- [x] Add unit test: `transformMonster` with `challenge_rating: "1/0"` → `monster.challengeRating === 0` (no throw, no `NaN`/`Infinity`)
- [x] Add unit test: `transformMonster` with `challenge_rating: "CR5"` (non-numeric string) → `monster.challengeRating === 0`
- [x] Add unit test: `transformMonster` with `challenge_rating: "5"` (bare numeric string) → `monster.challengeRating === 5`
- [x] Confirm existing numeric `challenge_rating` tests (`0.25`, `10`, `0`) still pass unchanged
- [x] Look for existing tooling or functions in the codebase that can be reused before writing new logic — confirmed `parseChallengeRating` already exists and needs no logic change, only test coverage (Decision 2 in design.md)
- [x] Confirm acceptance criteria in `specs/open5e-adapter/spec.md` are covered by the new tests

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. (Sub-agent ran; zero findings, no fixes needed.)

## Validation

- [x] Run unit/integration tests: `npm run test:unit` (3976 passed) and `npm run test:integration` (357 passed, 4 pre-existing skipped)
- [x] Run E2E tests: `npm run test:regression` — exited 0 (full suite passed)
- [x] Run type checks (project's `tsc`/typecheck script) — clean
- [x] Run build — succeeded
- [x] Run security/code quality checks required by project standards (Verity gate) — advisory Stop-hook review ran automatically; flagged 3 pre-existing/out-of-scope items (test length, type-only import, optional chaining) unrelated to `challenge_rating`; no in-scope findings
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `lib/import/open5eAdapter.ts` and a `.test.ts` file, so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass (note: `tests/integration/api/open5eApiShape.test.ts` remains `.skip`ped and out of scope — do not un-skip it as part of this change)
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-open5e-challenge-rating-type` to `main`. PR body **MUST include `Closes #161`**.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 161 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge; use squash per repo ruleset)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved (per project convention, replies alone don't resolve threads — use the `resolveReviewThread` GraphQL mutation after replying)
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session, on behalf of doug@dougis.com)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent + human PR reviewer
- Required approvals: repo's standard branch-protection required review count

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — internal type/test-only change)
- [ ] Sync approved spec delta from `openspec/changes/fix-open5e-challenge-rating-type/specs/open5e-adapter/spec.md` into `openspec/specs/open5e-adapter/spec.md` (merge the MODIFIED "Transform monster data" requirement into the existing spec). Update any relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-fix-open5e-challenge-rating-type/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/fix-open5e-challenge-rating-type/` to `openspec/changes/archive/YYYY-MM-DD-fix-open5e-challenge-rating-type/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-open5e-challenge-rating-type/` exists and `openspec/changes/fix-open5e-challenge-rating-type/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-fix-open5e-challenge-rating-type` then `git push -u origin doc/archive-YYYY-MM-DD-fix-open5e-challenge-rating-type`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-fix-open5e-challenge-rating-type` to `main` with title `docs: archive fix-open5e-challenge-rating-type (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix-open5e-challenge-rating-type doc/archive-YYYY-MM-DD-fix-open5e-challenge-rating-type`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/fix-open5e-challenge-rating-type`

Required cleanup after archive: `git fetch --prune` and `git branch -D fix-open5e-challenge-rating-type doc/archive-YYYY-MM-DD-fix-open5e-challenge-rating-type`
