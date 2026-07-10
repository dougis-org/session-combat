# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b 479-backfill-default-party` then immediately `git push -u origin 479-backfill-default-party`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 479 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **T1 — Write the candidate query.** In `lib/scripts/backfillDefaultParties.ts`, implement the aggregation from design.md Decision 1: `db.collection('campaigns').aggregate([{ $lookup: { from: 'parties', localField: 'id', foreignField: 'campaignId', as: 'linkedParties' } }, { $match: { linkedParties: { $size: 0 } } }])`, projecting out `linkedParties` before use so downstream code works with plain `Campaign` objects.
- [x] **T2 — Construct the default Party.** For each candidate campaign, build a `Party` object exactly matching `app/api/campaigns/route.ts:64-73`: `{ id: crypto.randomUUID(), userId: campaign.userId, name: 'Main Party', description: '', members: [], campaignId: campaign.id, createdAt: now, updatedAt: now }`, where `now` is captured once per script run (design.md Decision 2).
- [x] **T3 — Insert with per-campaign error isolation.** Wrap each `Party` insert in its own try/catch so one failure logs and continues rather than aborting the run (design.md Reliability NFR); accumulate counts of backfilled vs. failed vs. skipped.
- [x] **T4 — Logging.** Print one line per backfilled campaign (name and id) and a final summary line with total backfilled / skipped / failed counts, mirroring the `Inserted:` / `Skipping:` / `Done. Inserted: X, Skipped: Y` style already used in `lib/scripts/seedCampaignTemplates.ts`.
- [x] **T5 — Script entry point.** Add the same `seedCampaignTemplates().then(...).catch(...)` / `process.exit` invocation pattern so the script can be run directly (e.g. `npx tsx lib/scripts/backfillDefaultParties.ts`), matching the existing script's invocation style.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed reuse: `getDatabase()`, the `Campaign`/`Party` types from `lib/types.ts`, and the console-logging/exit pattern from `lib/scripts/seedCampaignTemplates.ts` (see design.md Decision 3).
- [x] **T6 — Integration test.** Following the `migrateGlobalMonsters.ts` precedent (`openspec/specs/scripts/migrate-global-monsters.md`), write a small integration test covering: a party-less campaign gets a correctly-shaped default party; a campaign that already has a party is untouched; a second run is a no-op (idempotency); `Campaign` documents are never modified. This test is deleted alongside the script per design.md Decision 4.
- [x] **T7 — Manual verification.** Run the script against a local/dev database seeded with a mix of campaigns (some with an existing party, some without). Confirm: only party-less campaigns get a new `Party`; the new `Party` shape matches T2 exactly; running the script a second time reports zero additional backfills (idempotency, per specs/scripts/spec.md).
- [x] Confirm acceptance criteria in `specs/scripts/spec.md` are covered by both the integration test (T6) and manual verification (T7)

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable — not expected to be affected by this change, but confirm the suite still passes)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed — expected here, since `lib/scripts/backfillDefaultParties.ts` is a code file):

- **Unit tests** — run `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md). Note: this repo has no `npm test` script — always use `npm run test:unit`.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST include `Closes #479`.**
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 479 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge; this repo's branch protection ruleset only allows squash merges — using `--merge` will leave the PR BLOCKED)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved. Note: after replying to a comment, also resolve the thread via the `resolveReviewThread` GraphQL mutation — replying alone does not resolve it.
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Doug (via Claude Code)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated gate); Doug (final approval)
- Required approvals: zero unresolved `pr-review-toolkit:review-pr` findings before auto-merge is enabled

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved (reply + `resolveReviewThread`)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`, including `lib/scripts/backfillDefaultParties.ts`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (if any; this is a one-off internal script, so no user-facing docs are expected to need updates)
- [ ] Sync approved spec deltas into `openspec/specs/`. After copying `specs/scripts/spec.md` to `openspec/specs/scripts/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-backfill-default-party/design.md`, and similarly for `../../tasks.md`
- [ ] Archive the change: move `openspec/changes/backfill-default-party/` to `openspec/changes/archive/YYYY-MM-DD-backfill-default-party/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-backfill-default-party/` exists and `openspec/changes/backfill-default-party/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-backfill-default-party` then `git push -u origin doc/archive-YYYY-MM-DD-backfill-default-party`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-backfill-default-party` to `main` with title `docs: archive backfill-default-party (YYYY-MM-DD)` — **do NOT push directly to `main`**. This PR must be docs-only (no code changes); if a code fix is discovered while archiving, put it on a separate hotfix branch instead of mixing it into this branch.
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D 479-backfill-default-party doc/archive-YYYY-MM-DD-backfill-default-party`
- [ ] **Reminder (manual, human follow-up, not automated by this task list):** once the script has been run successfully against all target environments (dev/staging/prod as applicable), delete `lib/scripts/backfillDefaultParties.ts` **and its integration test (T6)** in a small follow-up PR — per proposal.md Non-Goals, this script is intentionally deletable and not meant to be kept as a permanent fixture like `seedCampaignTemplates.ts`.

Required cleanup after archive: `git fetch --prune` and `git branch -D 479-backfill-default-party doc/archive-YYYY-MM-DD-backfill-default-party`
