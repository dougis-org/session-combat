# Tasks

Change: `upgrade-mongodb-driver-v7` · Issue: #638 (part of #594, D3) · Branch: `upgrade-mongodb-driver-v7`

## Preparation

- [x] **Step 1 — Sync default branch:** done via `git fetch origin main` from the primary checkout before worktree creation.
- [x] **Step 2 — Create and publish working branch:** dedicated worktree created at `.worktrees/upgrade-mongodb-driver-v7` (branch `upgrade-mongodb-driver-v7`, tracking `origin/main`) and already pushed with `git push -u origin upgrade-mongodb-driver-v7`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list (`pr-review-toolkit:review-pr`, "Comprehensive PR review using specialized agents"). No installation action needed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 638 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found for issue #638, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Pre-work: confirm `@testcontainers/mongodb` v7-compatibility** (Design Decision 1) — check `@testcontainers/mongodb`'s changelog/release notes for the MongoDB server version(s) it provisions and cross-reference against `mongodb` v7's supported server range. Bump `@testcontainers/mongodb` first, in its own commit, if a newer version is needed — before touching the `mongodb` dependency itself, so any resulting integration-test failure can't be confused with a real driver-compatibility bug.
- [ ] **Bump `mongodb` dependency**: update `package.json`'s `mongodb` from `^6.3.0` to `^7.x`, run `npm install` to update the lockfile.
- [ ] **Review the 2 previously-unread call sites** (Proposal Risk: routes not read during exploration) — read `app/api/auth/password/reset/route.ts` and `app/api/campaigns/[id]/members/route.ts` in full; confirm their `mongodb`-imported API usage (expected: `ObjectId`, `findOne`/`updateOne`-style calls) needs no adaptation for v7, or adapt if it does.
- [ ] **Review and adapt the 3 remaining direct call sites for v7 compatibility**: `lib/gridfs.ts`, `lib/permissions.ts`, `lib/server/transport.ts` — apply any adaptation v7 strictly requires (expected: none, per exploration, but confirm against `tsc --noEmit` and the new tests below).
- [ ] **`tsc --noEmit` project-wide** (Design Decision 2) — run and resolve any type errors surfaced across all files consuming `Db`/`Collection` types, including the `lib/storage/*Repo.ts` files that don't import `mongodb` directly.
- [ ] **Write integration test 1 — standalone-mode detection** (spec: "ADDED Standalone MongoDB detection continues to correctly select the polling transport under driver v7") — testcontainers-provisioned standalone MongoDB; trigger `detectReplicaSet()`'s probe; assert the thrown error still matches one of the four existing conditions (message includes `'not running with --replSet'` or `'$changeStream'`, `code === 76`, `code === 40573`); assert `subscribe()` selects the polling transport.
- [ ] **Write integration test 2 — change-stream invalidation recovery** (spec: "ADDED Change-stream invalidation recovery continues to function under driver v7") — testcontainers-provisioned replica-set MongoDB; open a change stream via `openStream()`; drop/rename the watched collection or database to force invalidation; assert `err.name === 'ChangeStreamInvalidatedError'` and that the cursor is automatically reopened.
- [ ] **Write integration test 3 — `$changeStream` pipeline validation** (spec: "ADDED The campaign event stream's `$changeStream` pipeline continues to open cleanly...") — testcontainers-provisioned replica-set MongoDB; open the existing pipeline (`$match` on `ns.coll` + `fullDocument: 'updateLookup'`) via `openStream()`; assert clean open with no server-side stage-option validation error; assert writes to `campaigns`/`campaignMessages`/`campaignRolls` are observed.
- [ ] **Write integration test 4 — GridFS round-trip** (spec: "ADDED GridFS attachment round-trip continues to work correctly under driver v7") — testcontainers-provisioned MongoDB; upload via `uploadAttachment()`, locate via `openDownloadStream()`'s internal `bucket.find()`, download and assert byte-for-byte content match, assert `metadata` round-trips (`campaignId`, `status`, `uploadedAt`, `contentType`), delete via `deleteOrphanedAttachments()`'s `bucket.delete()`, assert `verifyAttachmentCampaign()` returns `false` afterward.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design (Decision 2/3): reuse existing testcontainers integration-test harness/fixtures rather than building new test infrastructure.
- [ ] Confirm acceptance criteria are covered: cross-check each of the 5 "ADDED Requirement" scenarios in `specs/mongodb-driver-upgrade/spec.md` against the tests/tasks above — all 5 must have a corresponding test or verification step before proceeding.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests
- [ ] Run E2E tests
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change is expected to touch `package.json`/lockfile and application/test code, so the **full path** applies.

**Full path:**

- **Unit tests** — `node node_modules/.bin/jest` (per project convention: do not use `npm test`, there is no `test` script; do not rely on the rtk proxy for jest output, invoke jest directly) covering `npm run test:unit`'s scope; all tests must pass
- **Integration tests** — `npm run test:integration` (testcontainers-backed; run via the project harness, not raw jest, per issue #638's gate) — must include the 4 new tests above; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e`; all tests must pass
- **Build** — project build script; must succeed with no errors
- **Lint** — `npm run lint`
- **Typecheck** — `npm run typecheck` (`tsc --noEmit`)

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `upgrade-mongodb-driver-v7` to `main`. PR body **must** include `Closes #638`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 638 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` — **use `--squash`, per this repo's branch-protection ruleset which only allows squash merges; `--merge` causes a BLOCKED state. Never use `--admin` to force past a blocking check — fix the underlying check instead.**
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved (note: this repo also requires resolving threads via the `resolveReviewThread` GraphQL mutation after replying — a plain reply does not mark a thread resolved)
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing this change (Claude Code session), on behalf of doug@dougis.com
- Reviewer(s): `pr-review-toolkit:review-pr` automated review; doug (repo owner) for final human sign-off
- Required approvals: automated review gate must reach zero findings before auto-merge is enabled; repo branch-protection rules (squash-only, no `--admin` bypass) apply

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate (or `verity waive` only with an explicit human-approved reason cited, per this repo's CLAUDE.md policy — never waive on own judgment) → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved (reply **and** resolve via GraphQL `resolveReviewThread`, per this repo's convention)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (if any — expected minimal, since this is an internal dependency bump with no public API change)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/mongodb-driver-upgrade/spec.md` to `openspec/specs/mongodb-driver-upgrade/spec.md`. After copying, update its relative links so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-upgrade-mongodb-driver-v7/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/upgrade-mongodb-driver-v7/` to `openspec/changes/archive/YYYY-MM-DD-upgrade-mongodb-driver-v7/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately (per this repo's convention: doc/archive branches must be docs-only, no code changes mixed in)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-upgrade-mongodb-driver-v7/` exists and `openspec/changes/upgrade-mongodb-driver-v7/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-upgrade-mongodb-driver-v7` then `git push -u origin doc/archive-YYYY-MM-DD-upgrade-mongodb-driver-v7`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-upgrade-mongodb-driver-v7` to `main` with title `docs: archive upgrade-mongodb-driver-v7 (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (squash-only per repo ruleset; never `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D upgrade-mongodb-driver-v7 doc/archive-YYYY-MM-DD-upgrade-mongodb-driver-v7`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/upgrade-mongodb-driver-v7`

Required cleanup after archive: `git fetch --prune`, `git worktree remove .worktrees/upgrade-mongodb-driver-v7`, and `git branch -D upgrade-mongodb-driver-v7 doc/archive-YYYY-MM-DD-upgrade-mongodb-driver-v7`.
