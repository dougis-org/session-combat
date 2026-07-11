# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b cascade-delete-campaign-children` then immediately `git push -u origin cascade-delete-campaign-children`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 480 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Update `lib/storage.ts` `deleteCampaign(id, userId)`: before the existing `campaigns.deleteOne({ id, userId })` call, add a `Promise.all` of seven `deleteMany` calls:
  - `parties.deleteMany({ campaignId: id })`
  - `campaignMembers.deleteMany({ campaignId: id })`
  - `sessionLogs.deleteMany({ campaignId: id, userId })`
  - `campaignRolls.deleteMany({ campaignId: id })`
  - `campaignCharacterShares.deleteMany({ campaignId: id })`
  - `savedContent.deleteMany({ campaignId: id })`
  - `campaignMessages.deleteMany({ campaignId: id })`
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reuse the exact filter shapes already used elsewhere in `lib/storage.ts` for each collection (e.g. lib/storage.ts:731, :818, :921, :1234) rather than inventing new query shapes; mirror the `Promise.all` structure already used in `storage.clear()` (lib/storage.ts:1256-1272).
- [x] Write/extend unit tests in `tests/unit/storage/campaigns.test.ts` (`describe("storage.deleteCampaign", ...)`) per the acceptance scenarios in `openspec/changes/cascade-delete-campaign-children/specs/campaign-deletion/spec.md`:
  - Cascade deletes matching `Party` rows, leaves unrelated-campaign parties untouched
  - Cascade deletes `CampaignMember` rows across multiple `userId`s for the same campaign
  - Cascade deletes `SessionLog`, `CampaignRoll`, `CampaignCharacterShare`, `SavedContent`, `CampaignMessage` rows
  - No-op (no throw) when a campaign has zero children in some/all collections
  - Existing "nonexistent campaign resolves without throwing" and "underlying delete failure rejects" tests (tests/unit/storage/campaigns.test.ts:149, :155) still pass unmodified
- [x] Confirm acceptance criteria in `specs/campaign-deletion/spec.md` are covered by the new/updated tests

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit` (repo has no `npm test` script — do not use it)
- [x] Run E2E tests: not applicable — this is a storage-layer-only change with no UI or route contract change
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] Run lint: `npm run lint`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed — expected here, since `lib/storage.ts` and `tests/unit/storage/campaigns.test.ts` are non-`.md`):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — not applicable for this change (no UI/route contract change); skip
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `cascade-delete-campaign-children` to `main`. PR body **must** include `Closes #480`.
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 480 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's branch ruleset only allows squash merges — use `--squash`, not `--merge`; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; after replying, also resolve the thread via the `resolveReviewThread` GraphQL mutation; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis
- Reviewer(s): pr-review-toolkit:review-pr (automated), dougis (final approval)
- Required approvals: 1 (repo owner / auto-merge gate)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved (reply + resolve thread via GraphQL)

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (`lib/storage.ts` cascade logic and updated tests present)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — none identified beyond this change's own artifacts (no README/CLAUDE.md sections describe `deleteCampaign` behavior)
- [ ] Sync approved spec deltas into `openspec/specs/campaign-deletion/spec.md`. After copying `spec.md`, update relative links that pointed into the change directory: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-cascade-delete-campaign-children/design.md`, and similarly for any `../../tasks.md` references.
- [ ] Archive the change: move `openspec/changes/cascade-delete-campaign-children/` to `openspec/changes/archive/YYYY-MM-DD-cascade-delete-campaign-children/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-cascade-delete-campaign-children/` exists and `openspec/changes/cascade-delete-campaign-children/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-cascade-delete-campaign-children` then `git push -u origin doc/archive-YYYY-MM-DD-cascade-delete-campaign-children` — this branch must be docs-only (no code changes); if a code fix is discovered during archival, put it on a separate hotfix branch instead
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-cascade-delete-campaign-children` to `main` with title `docs: archive cascade-delete-campaign-children (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D cascade-delete-campaign-children doc/archive-YYYY-MM-DD-cascade-delete-campaign-children`

Required cleanup after archive: `git fetch --prune` and `git branch -D cascade-delete-campaign-children doc/archive-YYYY-MM-DD-cascade-delete-campaign-children`
