# Tasks

> Issue-driven: GitHub issue **#503** (parent tracking **#499**).
> Default branch: `main` (squash-only ruleset — all merges use `--squash`,
> 0 approvals required, required checks `ci-gate` + Codacy).
> All work happens in the worktree `.worktrees/refactor-storage-issue-503`.

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout,
  `git fetch origin main` (do not `git checkout main` if the primary checkout
  has unrelated uncommitted work; the worktree is branched from `origin/main`).
- [x] **Step 2 — Confirm worktree + branch:** verify
  `.worktrees/refactor-storage-issue-503` exists (created during propose) and is
  on branch `refactor-storage-issue-503` tracking `origin/refactor-storage-issue-503`.
  If missing: `git worktree add .worktrees/refactor-storage-issue-503 -b refactor-storage-issue-503 origin/main`
  then `git -C .worktrees/refactor-storage-issue-503 submodule update --init --recursive`
  then `git -C .worktrees/refactor-storage-issue-503 push -u origin refactor-storage-issue-503`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
  skills list. If it is not listed, halt immediately, inform the user the plugin
  is required, provide installation guidance, and do not proceed until the user
  confirms it is installed.
- [x] **Verify `openspec-review-code` is available** — same halt behavior if missing.
- [x] Confirm `.github/openspec-shared` submodule is checked out in the worktree
  (`openspec validate refactor-storage-issue-503` succeeds).

## Execution

- [x] **Step 1 — Enter worktree:** `cd .worktrees/refactor-storage-issue-503`.
  All subsequent steps run here. Never checkout a branch in the primary checkout.
- [x] **Step 2 — Confirm branch pushed:** `git status` shows the branch tracking
  `origin/refactor-storage-issue-503`; if not, `git push -u origin refactor-storage-issue-503`.
- [x] **Issue lifecycle: mark in-progress:** run
  `gh issue edit 503 --add-label "in-progress"`. Then discover the linked
  GitHub Project (`gh project list --owner dougis-org --format json`), resolve
  the status field option matching "In Progress"
  (`gh project field-list <project-number> --owner dougis-org --format json`),
  and move the item via `gh project item-edit`. If no project item is found, log
  a warning and continue. If the `gh` token lacks `project` scope, tell the user
  to run `gh auth refresh -s project` and skip the project-item update (label
  update still proceeds).

### Sub-task A — Re-verify the inventory (no code changes)

- [x] Cross-check `docs/storage-refactor/inventory.json` against current
  `lib/storage.ts`: confirm the 27 method names, their line numbers, current
  `behavior` classification, and caller lists are still accurate. Record any
  drift in the PR description. Confirm the 10 swallowing methods from the #503
  issue comment still swallow, `getMember` still rethrows, and `addMember` still
  wraps `11000` → `DuplicateMemberError`.
- [x] Enumerate every non-test caller of the 10 converting methods (especially
  `listMembersForCampaign` — 4 callers — and `loadAllMonsterTemplates` — 2). For
  each, note whether it branches on the sentinel as a catch-all; flag any that
  need attention beyond "let the `StorageError` propagate".

### Sub-task B — Foundation: `rethrowAsIs` (Design Decision 1)

- [x] TDD: add failing tests to `tests/unit/lib/storage/runOp.test.ts` for:
  (1) `rethrowAsIs` returns `true` → original error re-thrown unchanged, one
  `logStorageEvent` with `outcome: "error"`; (2) `rethrowAsIs` returns `false` →
  `StorageError` thrown as today; (3) `rethrowAsIs` absent → `StorageError`
  thrown (regression guard).
- [x] Add `rethrowAsIs?: (error: unknown) => boolean` to `RunStorageOpMeta<T>`
  in `lib/storage/runOp.ts`. In the `catch` block, after `logStorageEvent`, if
  `meta.rethrowAsIs?.(error)` is truthy `throw error;` else
  `throw new StorageError(...)` unchanged.
- [x] Run `tests/unit/lib/storage/runOp.test.ts` → green.
- [x] Run the cluster-1 repo suites (`encounterRepo`, `characterRepo`,
  `combatStateRepo`, `partyRepo` and their existing tests) → still green
  (default path unchanged).

### Sub-task C — Create repo modules

- [x] Create `lib/storage/monsterTemplateRepo.ts`,
  `lib/storage/campaignTemplateRepo.ts`, `lib/storage/campaignRepo.ts`,
  `lib/storage/membershipRepo.ts` with the standard imports (`getDatabase`,
  `runStorageOp`, `StorageError` only if needed directly, types,
  `buildEntityQuery`/`normalizeStoredEntityId` as used). Follow
  `lib/storage/partyRepo.ts` as the reference.
- [x] Move `normalizeCampaign` (module-scope helper in `lib/storage.ts`) into
  `campaignRepo.ts`; export it if any other repo needs it, otherwise keep local.

### Sub-task D — Migrate monster templates (7 methods)

- [x] TDD: write `tests/unit/lib/storage/monsterTemplateRepo.test.ts` covering,
  per method: success, empty/not-found (no throw, correct sentinel), and
  DB-failure (`rejects.toThrow(StorageError)` with correct `op`/`collection`,
  `logStorageEvent` `outcome: "error"`).
- [x] Move `loadMonsterTemplates`, `loadGlobalMonsterTemplates`,
  `loadAllMonsterTemplates`, `saveMonsterTemplate`, `deleteMonsterTemplate`,
  `monsterExistsByNameAndSource`, `findMonsterByNameAndSource` into
  `monsterTemplateRepo.ts`, each DB op wrapped in `runStorageOp`, swallowing
  removed. `loadGlobalMonsterTemplates` and `loadAllMonsterTemplates` call
  sibling functions directly (Design Decision 5). `isEmpty` only on
  `load*Templates` (`res.length === 0`) and `findMonsterByNameAndSource`
  (`res === null`); none on `monsterExistsByNameAndSource`.
- [x] Preserve the `loadAllMonsterTemplates` result semantics verbatim (tidy the
  `[...userTemplates, globalTemplates].flat()` spread only if it stays a
  behavior-identical no-op; otherwise leave it).
- [x] Update `lib/storage.ts`: `import * as monsterTemplateRepo` and replace the
  7 inline methods with one-line delegations, signatures identical.
- [x] `monsterTemplateRepo.test.ts` green.

### Sub-task E — Migrate campaign templates (4 methods)

- [x] TDD: `tests/unit/lib/storage/campaignTemplateRepo.test.ts` (same
  success / not-found / DB-failure matrix).
- [x] Move `loadGlobalCampaignTemplates`, `loadGlobalCampaignTemplateById`,
  `saveCampaignTemplate`, `deleteCampaignTemplate` into
  `campaignTemplateRepo.ts` on `runStorageOp`, swallowing removed.
  `deleteCampaignTemplate` keeps returning `deletedCount > 0` (result boolean —
  no `isEmpty`).
- [x] Update `lib/storage.ts` delegations. Test green.

### Sub-task F — Migrate campaigns (9 methods)

- [x] TDD: `tests/unit/lib/storage/campaignRepo.test.ts`.
- [x] Move `loadCampaigns`, `loadCampaignById`, `saveCampaign`, `deleteCampaign`,
  `setActiveCampaignSession`, `claimActiveCampaignSession`, `loadCampaignByIdAny`,
  `listCampaignsForMember`, `getCampaignsByIds` into `campaignRepo.ts` on
  `runStorageOp`, swallowing removed. `claimActiveCampaignSession` keeps
  returning `modifiedCount === 1` (result boolean — no `isEmpty`).
  `listCampaignsForMember` keeps the early-return `[]` for no memberships as a
  non-throwing path.
- [x] Update `lib/storage.ts` delegations. Test green.

### Sub-task G — Migrate membership (7 methods) + `addMember` contract

- [x] TDD: `tests/unit/lib/storage/membershipRepo.test.ts` covering:
  - `addMember`: success; `11000` insert error → rejects with
    `DuplicateMemberError` (NOT `StorageError`); non-`11000` insert error →
    `StorageError`.
  - `getMember`: success; `null` when absent (no throw); DB failure →
    `StorageError` (not `null`, not raw).
  - `listMembersForCampaign`: success; `[]` for member-less campaign (no throw,
    `outcome: "not_found"`); DB failure → `StorageError`. Header comment lists
    the 4 callers and their post-change behavior.
  - `updateMemberStatus`, `listInvitationsForUser`, `getUserById`,
    `getUsersByIds`: success / not-found / DB-failure matrix.
- [x] Move all 7 into `membershipRepo.ts` on `runStorageOp`. `addMember` detects
  `error.code === 11000` inside `fn` and throws
  `new DuplicateMemberError(member.campaignId, member.userId)`; its `meta`
  passes `rethrowAsIs: (e) => e instanceof DuplicateMemberError`.
- [x] Update `lib/storage.ts` delegations. Test green.
- [x] Verify the 3 `DuplicateMemberError` call sites still compile and branch
  correctly: `app/api/campaigns/[id]/members/route.ts`,
  `app/api/campaigns/global/[id]/copy/route.ts`, `app/api/campaigns/route.ts`.

### Sub-task H — `getMember` / `assertCampaignAccess` verification (AC headline)

- [x] Add a test (in `membershipRepo.test.ts` or a dedicated
  `tests/unit/lib/utils/campaign.assertCampaignAccess.test.ts`) asserting:
  with `storage.getMember` mocked to reject with `StorageError`,
  `assertCampaignAccess` rejects/throws (does NOT return the 404 `notFound()`
  response) and does not fall through to `loadCampaignByIdAny`.
- [x] Add/extend one representative campaign-scoped route test asserting a
  `getMember` `StorageError` surfaces as HTTP 500 with the `StorageError`
  logged — not a 404, not an unhandled crash.

### Sub-task I — Facade shape guardrail

- [x] Add an assertion (unit test) comparing the count of own-enumerable methods
  on `storage` to the pre-change count (must be equal). Confirm
  `storage.savedContent.*` nesting is untouched.
- [x] `git grep` the import statements of the ~36 `storage` consumers before and
  after — zero diff.

### Sub-task J — General

- [x] Look for existing tooling/helpers to reuse before writing new logic
  (`buildEntityQuery`, `normalizeStoredEntityId`, existing test factories in
  `tests/` — `test-helper-factories`, `test-user-factory`).
- [x] Confirm every acceptance scenario in
  `openspec/changes/refactor-storage-issue-503/specs/**/spec.md` is covered by a
  test or an explicit verification step.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. The primary agent must automatically apply all
  clearly-correct findings directly to the code — without stopping, without
  presenting the findings list to the user, and without asking for confirmation.
  Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests (project command per `CLAUDE.md` / `package.json`)
- [x] Run E2E tests if the change touches runtime paths that E2E exercises
      (campaign access, member management) — otherwise note why skipped
- [x] Run type checks (`tsc --noEmit` / project typecheck script)
- [x] Run build
- [x] Run security / code-quality checks required by project standards
      (Verity pre-commit/pre-push gate, Codacy). Fix findings — do not `verity
      waive` on agent judgment; waive only to relay a human-accepted risk with
      `--reason` citing the source.
- [x] All completed tasks marked complete
- [x] All steps in [Remote push validation]

## Remote push validation

Determine docs-only: `git diff --name-only origin/main...HEAD` — if every changed
file ends in `.md`, use the docs-only path; otherwise the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — full unit suite must pass
- **Integration tests** — full integration suite must pass
- **Regression / E2E tests** — full E2E/regression suite must pass
- **Build** — build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — must succeed
- Skip integration and E2E

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings
  addressed before the final commit
- [x] Commit all changes to `refactor-storage-issue-503` and push
- [x] Open PR from `refactor-storage-issue-503` to `main`. **PR body MUST include
  `Closes #503`.** Include a "Behavior changes" section listing every
  swallow→rethrow conversion and any inventory drift found in Sub-task A.
- [x] **Issue lifecycle: mark in-review:** run
  `gh issue edit 503 --add-label "in-review" --remove-label "in-progress"`, then
  move the project item to the "In Review" column (same discovery pattern; warn
  and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, push, re-run) until zero remain. If findings persist after
  3+ iterations with no progress, report the stall with remaining findings and
  wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes (zero findings):**
  `gh pr merge <PR-URL> --auto --squash` (squash-only ruleset; NEVER `--admin`,
  NEVER bypass branch protection)
- [x] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state`
  returns `MERGED`; if `CLOSED`, exit and notify the user. Never wait for a
  human to report the merge; never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures, commit,
     push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address
     every unresolved thread, commit, validate, push, wait 180s; repeat until
     all resolved
  3. **CI check failures** — only after comments resolved, poll
     `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy),
     commit, validate, push, wait 180s; restart from step 1

Ownership metadata:

- Implementer: dougis
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent gate; human review optional
- Required approvals: 0 (per `main` ruleset); required checks `ci-gate` + Codacy

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] From the primary checkout: `git fetch origin main` and confirm the squash
  commit for #503 is on `origin/main`
- [x] Verify the merged changes appear on `main` (`git log origin/main`)
- [x] Mark all remaining tasks complete (`- [x]`)
- [x] Update repository documentation impacted by the change
  (`docs/storage-refactor/` notes; any storage-layer doc referencing the god
  object)
- [x] Sync approved spec deltas into `openspec/specs/`: merge
  `specs/storage-domain-decomposition/spec.md` to
  `openspec/specs/storage-domain-decomposition/spec.md` (new capability), and
  merge `specs/storage-op-telemetry-foundation/spec.md`'s ADDED/MODIFIED
  requirements into `openspec/specs/storage-op-telemetry-foundation/spec.md`.
  After copying, rewrite relative links: `../../design.md` →
  `../../changes/archive/YYYY-MM-DD-refactor-storage-issue-503/design.md`,
  `../../tasks.md` likewise. (Known gotcha: several
  `openspec/specs/*/spec.md` are malformed and `openspec archive` may abort —
  use `--skip-specs` and hand-merge if needed.)
- [x] Archive: move `openspec/changes/refactor-storage-issue-503/` to
  `openspec/changes/archive/YYYY-MM-DD-refactor-storage-issue-503/` and stage
  both the new location and the deletion in a **single** commit
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-refactor-storage-issue-503/`
  exists and `openspec/changes/refactor-storage-issue-503/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-refactor-storage-issue-503`
  then `git push -u origin doc/archive-YYYY-MM-DD-refactor-storage-issue-503`
  (do NOT push directly to `main`)
- [x] Open a PR from the doc branch to `main` titled
  `docs: archive refactor-storage-issue-503 (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [x] Monitor the doc PR until merged (same loop as the implementation PR)
- [x] Remove the worktree and prune branches:
  `git worktree remove .worktrees/refactor-storage-issue-503 --force` (the
  `--force` is required — the `openspec-shared` submodule blocks a plain
  removal), then `git fetch --prune` and
  `git branch -D refactor-storage-issue-503 doc/archive-YYYY-MM-DD-refactor-storage-issue-503`

Required cleanup after archive:
`git worktree remove .worktrees/refactor-storage-issue-503 --force`,
`git fetch --prune`, and
`git branch -D refactor-storage-issue-503 doc/archive-YYYY-MM-DD-refactor-storage-issue-503`
