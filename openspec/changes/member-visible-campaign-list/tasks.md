# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `main` was fetched from `origin` immediately before branching (`git fetch origin main`).
- [x] **Step 2 — Create and publish working branch:** dedicated worktree created at `.worktrees/member-visible-campaign-list` off `origin/main`, branch `member-visible-campaign-list` created and pushed (`git push -u origin member-visible-campaign-list`) during `/opsx:propose`.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — this change is issue-driven (GitHub Issues: #714, owner `dougis-org`, repo `session-combat`). Run `gh issue edit 714 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] Confirm working directory is `.worktrees/member-visible-campaign-list` before touching any files (per Execution Step 1 rule — worktree already exists from Preparation; just `cd` into it, do not recreate).

### Sub-task 1: Repo layer — membership-based campaign query (Decision 1)

- [ ] In `lib/storage/campaignRepo.ts`, rewrite `loadCampaigns(userId)` to join the caller's `campaignMembers` rows (`status in ['active', 'invited']`) to `campaigns`, returning each matched `Campaign` annotated with `memberRole` and `memberStatus` from that row (reuse/adapt the existing two-query shape already proven in `listCampaignsForMember`).
- [ ] Delete `listCampaignsForMember` and the `CampaignMemberSummary` type (`lib/types.ts`) — confirmed unused elsewhere via repo-wide grep during design; remove its re-export in `lib/storage.ts` (`storage.listCampaignsForMember`) too.
- [ ] Write/adjust unit tests in `tests/unit/storage/campaignRepo.test.ts` (or equivalent) covering: DM-owned row (`memberRole: "dm"`), active-player row, invited-player row, exclusion of `declined` rows, exclusion of `removed` rows, and a campaign the caller has zero membership in (absent from results).

### Sub-task 2: API route — return annotated list (Decision 1, Decision 2)

- [ ] Update `GET /api/campaigns` (`app/api/campaigns/route.ts`) to call the rewritten `campaignRepo.loadCampaigns` and return its result as-is (flat array, additive `memberRole`/`memberStatus` fields — no wrapper object).
- [ ] Add/adjust an integration or route-level test asserting the response shape and that declined/removed/unrelated campaigns are excluded (mirrors the new `campaign-crud` spec scenarios).

### Sub-task 3: Shared card decomposition (Decision 3)

- [ ] Extract the DM card's shared, non-DM-specific presentational pieces (title + status badge row, module name line, chapter info line) out of the inline JSX in `app/campaigns/page.tsx` into a small shared component (e.g. `CampaignCardHeader` in `lib/components/`), used by both the existing full card and the new lighter card.
- [ ] Confirm the existing DM card (Edit/Delete/Members/Session Log/Prompt Builder/Library/Encounters/Start Combat actions, notes snippet, party roster) is unchanged in behavior after extraction — no visual or functional regression for DM users.

### Sub-task 4: New player-facing campaign card (Decision 3)

- [ ] Create a new component (e.g. `lib/components/PlayerCampaignCard.tsx`) that composes the shared header pieces from Sub-task 3 plus a role/status badge ("Player" or "Invited") and role-appropriate actions:
  - `memberStatus: "active"`, `memberRole: "player"` → link to Session Log only (no Edit/Delete/Members).
  - `memberStatus: "invited"` → Accept/Decline buttons only, no navigation links (per spec scenario "Invited entries do not link to the campaign detail page").
- [ ] Write an RTL test for `PlayerCampaignCard` asserting the correct badge and action set render for each of the active-player and invited-player prop combinations.

### Sub-task 5: Wire accept/decline (Decision 4)

- [ ] In `PlayerCampaignCard` (or a handler passed down from `app/campaigns/page.tsx`), wire Accept to `PATCH /api/campaigns/[id]/members/me` with `{ action: "accept" }` and Decline with `{ action: "decline" }`, following the existing `saveCampaign`/`deleteCampaign` pattern in `app/campaigns/page.tsx` (call endpoint, then `loadAll()` to refresh the list on success).
- [ ] Write an RTL test simulating both Accept and Decline clicks, asserting the correct PATCH body is sent and the list is re-fetched on success.

### Sub-task 6: Page-level grouping (Decisions 2, 3)

- [ ] Update `app/campaigns/page.tsx` (`CampaignsContent`) to split the single `GET /api/campaigns` response by `memberRole`/`memberStatus` into three groupings: DM (existing full card, unchanged), Player (new `PlayerCampaignCard`, active), Invited (new `PlayerCampaignCard`, invited variant). Keep the DM section visually primary/first, consistent with today's "Active Campaigns" + full-list ordering (per design.md risk mitigation).
- [ ] Write/adjust an RTL test on `CampaignsContent` rendering all three groupings from a mocked `GET /api/campaigns` response (DM row, active-player row, invited row, declined/removed rows absent).

### Sub-task 7: Spec-adjacent consumers sanity check

- [ ] Re-run existing tests for `app/parties/page.tsx` (unaffected consumer of `GET /api/campaigns`, reads only `id`/`name`) to confirm no regression from the additive response fields.
- [ ] No changes planned for `lib/components/ActiveCampaignBanner.tsx` — its `data.campaigns` read is a pre-existing, unrelated bug (out of scope per proposal.md Non-Goals); confirm no new regression is introduced there either.

- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (re-confirm no other consumer of the deleted `listCampaignsForMember` surfaced during implementation that grep missed).
- [ ] Confirm acceptance criteria in `specs/campaign-crud/spec.md` are covered by the above sub-tasks.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests
- [ ] Run E2E tests (if applicable)
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change modifies application code (`lib/storage/campaignRepo.ts`, `app/api/campaigns/route.ts`, `app/campaigns/page.tsx`, new components), so it takes the **full path**:

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `member-visible-campaign-list` to `main`. PR body **must include `Closes #714`** (unconditionally — this change is issue-driven).
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 714 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge; per repo convention, squash merge is the only allowed strategy — `--squash` not `--merge` if the CLI default disagrees with the ruleset)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved (per project convention, resolve threads via the `resolveReviewThread` GraphQL mutation after replying)
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` (automated gate) + repository code owners per branch protection
- Required approvals: per repository branch protection rules on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved (reply, then resolve via GraphQL mutation)

## Post-Merge

- [ ] `git checkout main` (in the primary checkout, not the worktree) and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none anticipated beyond the spec sync below — no README/CLAUDE.md sections describe campaign-list ownership semantics)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/member-visible-campaign-list/specs/campaign-crud/spec.md`'s ADDED/MODIFIED content into `openspec/specs/campaign-crud/spec.md` (merge, don't overwrite — this capability has prior accumulated requirements from earlier changes). Update any relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-member-visible-campaign-list/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/member-visible-campaign-list/` to `openspec/changes/archive/YYYY-MM-DD-member-visible-campaign-list/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-member-visible-campaign-list/` exists and `openspec/changes/member-visible-campaign-list/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-member-visible-campaign-list` then `git push -u origin doc/archive-YYYY-MM-DD-member-visible-campaign-list`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-member-visible-campaign-list` to `main` with title `docs: archive member-visible-campaign-list (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D member-visible-campaign-list doc/archive-YYYY-MM-DD-member-visible-campaign-list`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/member-visible-campaign-list`

Required cleanup after archive: `git fetch --prune` and `git branch -D member-visible-campaign-list doc/archive-YYYY-MM-DD-member-visible-campaign-list`
