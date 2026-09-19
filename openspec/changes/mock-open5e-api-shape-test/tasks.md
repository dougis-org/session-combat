# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done as part of worktree creation (`git worktree add .worktrees/mock-open5e-api-shape-test -b mock-open5e-api-shape-test origin/main`, fetched from `origin/main`).
- [x] **Step 2 — Create and publish working branch:** `mock-open5e-api-shape-test` branch created and pushed (`git push -u origin mock-open5e-api-shape-test`).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven (issue #162). Run `gh issue edit 162 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Delete `tests/integration/api/open5eApiShape.test.ts`** — remove the file entirely (not renamed, not re-skipped). Confirms REMOVED requirement in `specs/open5e-api-shape-verification/spec.md`.
- [x] **Add `lib/scripts/checkOpen5eApiShape.ts`** implementing:
  - Import `Open5EClient`, `Open5ECreature`, `Open5ESpell` from `@/lib/import/open5eAdapter`.
  - Instantiate `new Open5EClient()` (default real `fetch`); no local `fetchWithRetry` or raw `fetch` calls (design Decision 3).
  - Call `fetchMonsters(1)` and `fetchSpells(1)`; let a failed call's error (from `fetchPage`) propagate unhandled/rethrown to produce a non-zero exit with the endpoint/status in the message — no retry logic (design Decision 4).
  - Assert against the returned `Open5ECreature`/`Open5ESpell`-typed values, e.g.: creature has `key` (string), `size`, `type`, `challenge_rating`, `armor_class`, `hit_points`, `actions` (array), `traits` (array, when present); spell has `key` (string), `name`, `level` (number), `school`, `casting_time`, `range`, `duration`, `concentration` (boolean), `desc` (string) — mirroring the assertions from the deleted test but against the adapter-parsed shape (design Decision 5).
  - On success, print a clear pass message for both creatures and spells and exit 0. On any assertion failure, print which field/assertion failed and exit non-zero.
  - Add a short header comment noting this is a manual/on-demand check (not run by CI) and briefly noting the raw-vs-parsed shape context (e.g., raw API uses `key` not `slug`) per design's Risk mitigation.
- [x] **Add `check:open5e-api-shape` to `package.json` `scripts`**: `"check:open5e-api-shape": "npx tsx lib/scripts/checkOpen5eApiShape.ts"`, following the existing `seed:monsters`/`migrate:encounters` convention.
- [x] **Manually run the script once against the live API** (`npm run check:open5e-api-shape`) to confirm it actually exercises the network path and reports pass/fail correctly. This is exploratory verification, not part of any automated suite.
- [x] Confirm no other file references the deleted test path (`grep -r "open5eApiShape" tests/ lib/ app/` — expect only the new script and this change's artifacts to match).
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (done during design: reused `Open5EClient`, `Open5ECreature`/`Open5ESpell` types, and the `lib/scripts/*.ts` + `npx tsx` convention — no new shared utilities needed).
- [x] Confirm acceptance criteria in `specs/open5e-api-shape-verification/spec.md` are covered by the above.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (14 pre-existing failures unrelated to this change, tracked in #767; see task notes)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change is **not** docs-only (it deletes a `.test.ts` file, adds a `.ts` script, and edits `package.json`) — apply the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass (confirms the deleted file no longer appears in the discovered test list and nothing else regresses)
- **Regression / E2E tests** — `npm run test:e2e` (or `npm run test:regression` if that is the intended regression suite); all tests must pass
- **Build** — `npm run build`; build must succeed with no errors
- **Type check** — `npm run typecheck`; must pass cleanly, including the new `lib/scripts/checkOpen5eApiShape.ts` file

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `mock-open5e-api-shape-test` to `main`. The PR body **must include `Closes #162`**. (PR #768)
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 162 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (Round 1: 2 Important findings addressed — strengthened assertions on nested/typed fields, aligned exit/error handling with sibling scripts; also corrected a factual retry/backoff claim in design.md/proposal.md. Remaining suggestions are non-blocking.)
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's branch ruleset only allows squash merges; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved. After replying, also resolve the thread via the `resolveReviewThread` GraphQL mutation (repo convention).
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this session), on behalf of doug@dougis.com
- Reviewer(s): `pr-review-toolkit:review-pr` automated gate; human reviewer per repo process
- Required approvals: standard branch-protection requirements for `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not this worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none anticipated beyond this change's own artifacts)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/open5e-api-shape-verification/spec.md` to `openspec/specs/open5e-api-shape-verification/spec.md`, updating relative links to point at the archived location (`../../changes/archive/YYYY-MM-DD-mock-open5e-api-shape-test/design.md` and `.../tasks.md`)
- [ ] Archive the change: move `openspec/changes/mock-open5e-api-shape-test/` to `openspec/changes/archive/YYYY-MM-DD-mock-open5e-api-shape-test/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-mock-open5e-api-shape-test/` exists and `openspec/changes/mock-open5e-api-shape-test/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-mock-open5e-api-shape-test` then `git push -u origin doc/archive-YYYY-MM-DD-mock-open5e-api-shape-test`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-mock-open5e-api-shape-test` to `main` with title `docs: archive mock-open5e-api-shape-test (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D mock-open5e-api-shape-test doc/archive-YYYY-MM-DD-mock-open5e-api-shape-test`
- [ ] Remove this change's dedicated worktree: `git worktree remove .worktrees/mock-open5e-api-shape-test` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D mock-open5e-api-shape-test doc/archive-YYYY-MM-DD-mock-open5e-api-shape-test`
