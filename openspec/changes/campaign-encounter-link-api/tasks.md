# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git checkout ad04fdf` state == `origin/main` tip)
- [x] **Step 2 — Create and publish working branch:** `git checkout -b campaign-encounter-link-api` then `git push -u origin campaign-encounter-link-api` (already done during propose)

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 536 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Confirm working directory** — confirm current directory is the dedicated worktree for this change (per this session's reconciliation, that's the branch `campaign-encounter-link-api` checked out directly in `.worktrees/add-campaign-encounter-ids`, not a separate `.worktrees/campaign-encounter-link-api` tree — see design.md Context note / session log). Do not switch branches inside the primary checkout.
- [ ] **TDD: storage layer** — write failing tests first (`lib/storage.test.ts` or equivalent), then implement in `lib/storage.ts`:
  - `loadEncountersByIds(ids: string[], ownerUserId: string): Promise<Encounter[]>` — `find({ id: { $in: ids }, userId: ownerUserId })`; returns `[]` without querying when `ids.length === 0`
  - `addEncounterToCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void>` — `updateOne({ id: campaignId, userId: dmUserId }, { $addToSet: { encounterIds: encounterId } })`
  - `removeEncounterFromCampaign(campaignId: string, encounterId: string, dmUserId: string): Promise<void>` — `updateOne({ id: campaignId, userId: dmUserId }, { $pull: { encounterIds: encounterId } })`
- [ ] **TDD: GET /api/campaigns/[id]/encounters** — write failing integration tests per spec.md scenarios ("DM fetches linked encounters", "Player member fetches the same linked encounters", "Non-member is rejected", "Empty encounterIds returns empty list"), then implement `app/api/campaigns/[id]/encounters/route.ts` `GET` handler: `withAuthAndParams` → `assertCampaignAccess(id, auth.userId)` (any active role) → `storage.loadEncountersByIds(campaign.encounterIds, campaign.userId)` → `NextResponse.json(...)`
- [ ] **TDD: POST /api/campaigns/[id]/encounters** — write failing tests per spec.md scenarios ("DM links an owned encounter", "Linking the same encounter twice is idempotent", "Linking an encounter you don't own is rejected", "Player member cannot link"), then implement the `POST` handler in the same route file: `assertCampaignAccess` → `role !== 'dm'` → 404 → verify encounter ownership (`storage.loadEncountersByIds([encounterId], auth.userId)`, empty → 404) → `storage.addEncounterToCampaign(id, encounterId, auth.userId)` → `NextResponse.json(...)`
- [ ] **TDD: DELETE /api/campaigns/[id]/encounters/[encounterId]** — write failing tests per spec.md scenarios ("DM unlinks a linked encounter", "Unlinking an encounter that isn't linked is a no-op success", "Player member cannot unlink"), then implement `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` `DELETE` handler: `assertCampaignAccess` → `role !== 'dm'` → 404 → `storage.removeEncounterFromCampaign(id, encounterId, auth.userId)` → `NextResponse.json({ message: 'Encounter unlinked successfully' })`
- [ ] **TDD: POST /api/encounters campaignId extension** — write failing tests per spec.md scenarios ("Create and link succeeds", "campaignId omitted behaves exactly as before", "Requester is not the campaign's DM", "Encounter creation succeeds but linking fails"), then modify `app/api/encounters/route.ts` `POST`: if `campaignId` present, `assertCampaignAccess(campaignId, auth.userId)` + DM check before creating; on success, `storage.saveEncounter(...)` then `try { await storage.addEncounterToCampaign(...) } catch (linkError) { return NextResponse.json({ ...encounter, linkWarning: '...' }, { status: 201 }) }`
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (confirmed during design: reuse `assertCampaignAccess`, `buildEntityQuery`/`normalizeStoredEntityId` patterns already in `lib/storage.ts`; no new abstractions needed)
- [ ] Confirm all acceptance criteria in `specs/campaign-encounter-linking/spec.md` are covered by at least one test

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests (`npm test` or project equivalent — covers new storage methods and all four route handlers)
- [ ] Run E2E tests (if applicable — this change is API-only, no UI; skip unless an existing E2E suite happens to exercise these routes indirectly)
- [ ] Run type checks (`npm run typecheck` or equivalent)
- [ ] Run build (`npm run build`)
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change modifies `.ts` route/storage files, so it is **not** docs-only — apply the full path.

**Full path**:

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `campaign-encounter-link-api` to `main`. PR body MUST include `Closes #536`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 536 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` (automated gate) + repo owner (doug) for final human approval
- Required approvals: 1 (doug), per existing repo branch protection; no `--admin` bypass permitted (standing project policy)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none anticipated beyond this OpenSpec change itself — this is an API-only slice of the larger campaign-encounter-linking design; UI docs land with later issues)
- [ ] Sync approved spec deltas into `openspec/specs/campaign-encounter-linking/spec.md`. After copying, update relative links that pointed into the change directory — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-campaign-encounter-link-api/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/campaign-encounter-link-api/` to `openspec/changes/archive/YYYY-MM-DD-campaign-encounter-link-api/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-encounter-link-api/` exists and `openspec/changes/campaign-encounter-link-api/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-campaign-encounter-link-api` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-encounter-link-api`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-campaign-encounter-link-api` to `main` with title `docs: archive campaign-encounter-link-api (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D campaign-encounter-link-api doc/archive-YYYY-MM-DD-campaign-encounter-link-api`

Required cleanup after archive: `git fetch --prune` and `git branch -D campaign-encounter-link-api doc/archive-YYYY-MM-DD-campaign-encounter-link-api`
