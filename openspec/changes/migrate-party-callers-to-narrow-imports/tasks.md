# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only` (done from primary checkout before creating the worktree)
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/migrate-party-callers-to-narrow-imports -b migrate-party-callers-to-narrow-imports origin/main`, then `git push -u origin migrate-party-callers-to-narrow-imports` (done)

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 683 --repo dougis-org/session-combat --add-label "in-progress"`. Discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **Confirm working directory:** all remaining steps run inside `.worktrees/migrate-party-callers-to-narrow-imports/`, never the primary checkout.
- [ ] **Relocate campaign-party linking functions (do this first — callers below depend on it):**
  - [ ] In `lib/storage/partyRepo.ts`, add named exports `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns`, copied verbatim from their current bodies in `lib/storage.ts` (same `runStorageOp({ name, collection: "campaigns" }, ...)` wrapper, same `getDatabase()` / `db.collection(...)` calls). Add any missing imports (`runStorageOp` from `./runOp`, `getDatabase` from wherever `lib/storage.ts` currently imports it) to `partyRepo.ts`.
  - [ ] In `lib/storage.ts`, replace the inline bodies of `addPartyToCampaign`, `removePartyFromCampaign`, `removePartyFromAllCampaigns` on the `storage` object with one-line delegations to `partyRepo.addPartyToCampaign(...)` / `partyRepo.removePartyFromCampaign(...)` / `partyRepo.removePartyFromAllCampaigns(...)`, matching the existing delegation style used for `saveParty`/`deleteParty`.
  - [ ] Verify: `git diff` shows the 3 relocated function bodies are byte-identical between their old location (removed) and new location (added), apart from surrounding import/export syntax.
- [ ] **Migrate `app/api/parties/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch the `canAddToCampaignParty` call inside `ids.map(charId => storage.canAddToCampaignParty(...))` to `partyRepo.canAddToCampaignParty(...)`.
  - [ ] Switch `storage.saveParty(party)` to `partyRepo.saveParty(party)`.
  - [ ] Switch `storage.addPartyToCampaign(...)` to `partyRepo.addPartyToCampaign(...)`.
  - [ ] Switch `storage.deleteParty(...)` (in the compensating-delete catch path) to `partyRepo.deleteParty(...)`.
  - [ ] Switch `storage.loadParties(auth.userId)` (GET handler) to `partyRepo.loadParties(auth.userId)`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/parties/[id]/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch all 3 `storage.loadParties(...)` calls (GET, PUT, DELETE handlers) to `partyRepo.loadParties(...)`.
  - [ ] Switch `storage.canAddToCampaignParty(...)` inside the `charsToCheck.map(...)` callback to `partyRepo.canAddToCampaignParty(...)`.
  - [ ] Switch `storage.removePartyFromAllCampaigns(...)` to `partyRepo.removePartyFromAllCampaigns(...)`.
  - [ ] Switch both `storage.addPartyToCampaign(...)` calls (including the rollback-on-error path) to `partyRepo.addPartyToCampaign(...)`.
  - [ ] Switch `storage.saveParty(updatedParty)` to `partyRepo.saveParty(updatedParty)`.
  - [ ] Switch `storage.deleteParty(...)` (DELETE handler) to `partyRepo.deleteParty(...)`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/campaigns/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch `storage.saveParty(...)` to `partyRepo.saveParty(...)`.
  - [ ] Switch `storage.deleteParty(...)` to `partyRepo.deleteParty(...)`.
  - [ ] Leave `storage.addMember(...)` on `storage` (membershipRepo domain, out of scope).
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/campaigns/[id]/parties/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch `storage.loadPartiesByCampaign(...)` to `partyRepo.loadPartiesByCampaign(...)`.
  - [ ] Leave `storage.getMember(...)` on `storage`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch `storage.saveParty(...)` to `partyRepo.saveParty(...)`.
  - [ ] Switch `storage.loadPartiesByCampaign(...)` to `partyRepo.loadPartiesByCampaign(...)`.
  - [ ] Leave both `storage.getMember(...)` calls on `storage`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/campaigns/[id]/members/[userId]/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch `storage.setPartyMemberLeftAt(...)` inside `targetShares.map(share => storage.setPartyMemberLeftAt(...))` to `partyRepo.setPartyMemberLeftAt(...)`.
  - [ ] Leave `storage.getMember(...)` (both calls), `storage.updateMemberStatus(...)`, and `storage.listAllSharesForCampaign(...)` on `storage`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/campaigns/[id]/characters/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch `storage.buildSharedCharacterEntries(...)` to `partyRepo.buildSharedCharacterEntries(...)`.
  - [ ] Leave `storage.getMember(...)` (both calls), `storage.addShare(...)`, and `storage.listSharesForCampaign(...)` on `storage`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Migrate `app/api/campaigns/[id]/characters/[cid]/route.ts`:**
  - [ ] Add `import * as partyRepo from '@/lib/storage/partyRepo'`.
  - [ ] Switch `storage.setPartyMemberLeftAt(...)` to `partyRepo.setPartyMemberLeftAt(...)`.
  - [ ] Leave `storage.getMember(...)` and `storage.removeShare(...)` on `storage`.
  - [ ] Confirm no remaining party-method calls reference `storage.` in this file.
- [ ] **Update tests mocking the migrated call sites:** for each test file covering the 8 routes above (under `tests/unit/api/parties/`, `tests/unit/api/campaigns/`, and equivalents), update `jest.mock('@/lib/storage', ...)` / `jest.mock('@/lib/storage/partyRepo', ...)` setups so mocked party-method calls target `partyRepo`, leaving non-party mocks on `storage` unchanged.
- [ ] **Repo-wide verification grep:** run `grep -rn "storage\.\(loadParties\|saveParty\b\|saveParties\|deleteParty\|loadPartiesByCampaign\|buildSharedCharacterEntries\|setPartyMemberLeftAt\|canAddToCampaignParty\|addPartyToCampaign\|removePartyFromCampaign\|removePartyFromAllCampaigns\)" --include="*.ts" --include="*.tsx" app lib components` and confirm the only remaining matches are `lib/storage.ts`'s own delegation lines (`partyRepo.X(...)` calls, not `storage.X`) — i.e. zero matches of `storage.<party-method>` outside `lib/storage.ts` itself.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (n/a here — this task is a pure relocation/import change, no new logic is introduced).
- [ ] Confirm acceptance criteria in `specs/party-callers-narrow-imports/spec.md` are covered by the changes above.

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

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `.ts` files, so the **full path** applies.

**Full path:**

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `migrate-party-callers-to-narrow-imports` to `main`. **The PR body MUST include `Closes #683`.**
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 683 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge --squash` (main is a squash-only ruleset — NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated) + human PR reviewer per repo branch ruleset
- Required approvals: 0 approvals required by ruleset, but required status checks (`ci-gate`, Codacy) must pass before merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — no user-facing or architectural docs describe `storage.ts`'s internal call graph)
- [ ] Sync approved spec deltas into `openspec/specs/party-callers-narrow-imports/spec.md`. After copying, update relative links that pointed into the change directory — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-migrate-party-callers-to-narrow-imports/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/migrate-party-callers-to-narrow-imports/` to `openspec/changes/archive/YYYY-MM-DD-migrate-party-callers-to-narrow-imports/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-party-callers-to-narrow-imports/` exists and `openspec/changes/migrate-party-callers-to-narrow-imports/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-migrate-party-callers-to-narrow-imports` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-party-callers-to-narrow-imports`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-migrate-party-callers-to-narrow-imports` to `main` with title `docs: archive migrate-party-callers-to-narrow-imports (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D migrate-party-callers-to-narrow-imports doc/archive-YYYY-MM-DD-migrate-party-callers-to-narrow-imports`

Required cleanup after archive: `git worktree remove .worktrees/migrate-party-callers-to-narrow-imports`, then `git fetch --prune` and `git branch -D migrate-party-callers-to-narrow-imports doc/archive-YYYY-MM-DD-migrate-party-callers-to-narrow-imports`
