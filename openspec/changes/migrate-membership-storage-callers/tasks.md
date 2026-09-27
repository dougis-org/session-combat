# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose — `git fetch origin main` was run from the primary checkout before creating the worktree.
- [x] **Step 2 — Create and publish working branch:** done during propose — `.worktrees/migrate-membership-storage-callers` created from `origin/main`, branch `migrate-membership-storage-callers` pushed to `origin`.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — this change is issue-driven (#685). Run `gh issue edit 685 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item for issue #685 via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Confirm inventory is still accurate before editing.** Re-run the discovery greps from the proposal against the current `main`/worktree HEAD (methods may have gained/lost callers since exploration):
  - `grep -rn "storage\.\(addMember\|updateMemberStatus\|listMembersForCampaign\|getMember\|listInvitationsForUser\|getUserById\|getUsersByIds\)(" --include='*.ts' --include='*.tsx'` across the repo, filtering out `.verity/.snapshot/`.
  - If the file list differs from the 15 files below, update `proposal.md`, `design.md`, and `specs/membership-storage-callers/spec.md` accordingly before proceeding (per Change Control in proposal.md).
- [ ] **Full-swap files (8) — remove `storage` import, add `membershipRepo` import, rewrite call sites:**
  - [ ] `lib/utils/campaign.ts` — `getMember`
  - [ ] `lib/server/transport.ts` — `listMembersForCampaign`
  - [ ] `app/api/campaigns/[id]/parties/route.ts` — `getMember`
  - [ ] `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts` — `getMember`
  - [ ] `app/api/campaigns/route.ts` — `addMember`
  - [ ] `app/api/me/invitations/route.ts` — `getUsersByIds`, `listInvitationsForUser`
  - [ ] `app/api/campaigns/[id]/members/route.ts` — `addMember`, `getMember`, `listMembersForCampaign`, `updateMemberStatus` (preserve the existing `instanceof DuplicateMemberError` catch around `addMember` unchanged)
  - [ ] `app/api/campaigns/[id]/members/me/route.ts` — `getMember`, `updateMemberStatus`
- [ ] **Partial-swap files (7) — add `membershipRepo` import alongside the retained `storage` import, rewrite only the membership call sites:**
  - [ ] `lib/storage/partyRepo.ts` — `getMember` via relative `./membershipRepo` import (sibling module); leave `storage.listAllSharesForCampaign`, `storage.loadCharacterById`, `storage.loadPartiesByCampaign`, `storage.saveParty` untouched
  - [ ] `app/api/campaigns/[id]/characters/[cid]/route.ts` — `getMember`; leave `storage.removeShare` untouched
  - [ ] `app/api/campaigns/[id]/characters/route.ts` — `getMember`; leave `storage.addShare`, `storage.listSharesForCampaign` untouched
  - [ ] `app/api/campaigns/[id]/members/[userId]/route.ts` — `getMember`, `updateMemberStatus`; leave `storage.listAllSharesForCampaign` untouched
  - [ ] `app/api/campaigns/[id]/rolls/route.ts` — `getMember`, `getUserById`, `listMembersForCampaign`; leave `storage.listCampaignRolls`, `storage.saveCampaignRoll` untouched
  - [ ] `app/api/campaigns/[id]/messages/route.ts` — `getMember`, `getUserById`, `listMembersForCampaign`; no other storage calls to preserve, but keep this file's other imports intact
  - [ ] `app/api/campaigns/global/[id]/copy/route.ts` — `addMember`; leave `storage.loadGlobalCampaignTemplateById` untouched
- [ ] **After each file edit**, check for import-name collisions (e.g. a local symbol already named `getMember`) before finalizing the named import; rename via `import { getMember as membershipGetMember }` only if a collision exists (none expected per current inventory).
- [ ] **Update test mocks for all 15 production files** — for each file's corresponding test file(s), change any mock of `@/lib/storage`'s migrated methods to mock `@/lib/storage/membershipRepo` instead (or add a second mock target for partial-swap files that still mock `storage` for the retained calls).
- [ ] **Repo-wide test-file discovery sweep** — run `grep -rn "storage\.\(addMember\|updateMemberStatus\|listMembersForCampaign\|getMember\|listInvitationsForUser\|getUserById\|getUsersByIds\)(" tests/` (or equivalent test root) to find any test mock/assertion referencing these methods on `storage` beyond the 15 production files' own tests, and update each to target `membershipRepo` where the corresponding production code has migrated.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — not applicable here beyond reusing `membershipRepo`'s existing exports (no new logic is written).
- [ ] Confirm acceptance criteria are covered: all 15 files migrated, mixed-domain files retain non-membership `storage` calls, zero remaining non-test `storage.<membershipMethod>(` matches, all existing tests pass unmodified in assertions.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests
- [ ] Run E2E tests (if applicable)
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] Run the final grep sweep: confirm zero matches for `storage\.(addMember|updateMemberStatus|listMembersForCampaign|getMember|listInvitationsForUser|getUserById|getUsersByIds)\(` outside `tests/**` and `.verity/.snapshot/**`
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `.ts`/`.tsx` production and test files, so the **full path** applies.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `migrate-membership-storage-callers` to `main`. The PR body MUST include `Closes #685`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 685 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated gate) + repo owner (@dougis) for human approval per branch-protection rules
- Required approvals: per repo ruleset for `main` — 0 required human approvals, `ci-gate` + Codacy required checks must pass (see [[project_main_branch_squash_only_ruleset]])

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected beyond this change's own artifacts — no user-facing docs reference the storage facade's membership methods by name)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/membership-storage-callers/spec.md` to `openspec/specs/membership-storage-callers/spec.md`, updating the relative link `../../design.md` to `../../changes/archive/YYYY-MM-DD-migrate-membership-storage-callers/design.md` (and similarly for any `../../tasks.md` reference)
- [ ] Archive the change: move `openspec/changes/migrate-membership-storage-callers/` to `openspec/changes/archive/YYYY-MM-DD-migrate-membership-storage-callers/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-membership-storage-callers/` exists and `openspec/changes/migrate-membership-storage-callers/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-migrate-membership-storage-callers` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-membership-storage-callers`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-migrate-membership-storage-callers` to `main` with title `docs: archive migrate-membership-storage-callers (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D migrate-membership-storage-callers doc/archive-YYYY-MM-DD-migrate-membership-storage-callers`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/migrate-membership-storage-callers` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D migrate-membership-storage-callers doc/archive-YYYY-MM-DD-migrate-membership-storage-callers`
