# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose — worktree branched from `origin/main` at creation time.
- [x] **Step 2 — Create and publish working branch:** done during propose — `.worktrees/migrate-encounter-storage-callers` created on branch `migrate-encounter-storage-callers`, pushed to `origin/migrate-encounter-storage-callers`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt, inform the user the plugin is required, and do not proceed until confirmed installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 684 --add-label "in-progress"`. Discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item for issue #684 via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (label update still proceeds).
- [x] **1. Fix `lib/storage/encounterRepo.ts` self-call (do first — unblocks a clean baseline for caller diffs):**
  - [x] 1.1 In `saveEncounters`, replace `await storage.saveEncounter(encounter);` with `await saveEncounter(encounter);`
  - [x] 1.2 Remove `import { storage } from "@/lib/storage";` from the file (confirm via `grep -n "storage\." lib/storage/encounterRepo.ts` that no other `storage.` reference remains)
  - [x] 1.3 Run `npx jest --testPathPatterns tests/unit/lib/storage/encounterRepo.test.ts` and confirm it passes unmodified
- [x] **2. Migrate pure-Encounter caller: `app/api/encounters/[id]/route.ts`:**
  - [x] 2.1 Add `import { loadEncounters, saveEncounter, deleteEncounter } from "@/lib/storage/encounterRepo";`
  - [x] 2.2 Replace all `storage.loadEncounters(...)`, `storage.saveEncounter(...)`, `storage.deleteEncounter(...)` call sites with the unqualified imports
  - [x] 2.3 Remove `import { storage } from "@/lib/storage";` and confirm via `grep -n "storage\." "app/api/encounters/[id]/route.ts"` that no reference remains
- [x] **3. Migrate pure-Encounter caller: `app/api/encounters/route.ts`:**
  - [x] 3.1 Add `import { loadEncounters, saveEncounter, addEncounterToCampaign } from "@/lib/storage/encounterRepo";`
  - [x] 3.2 Replace `storage.loadEncounters(...)`, `storage.saveEncounter(...)`, `storage.addEncounterToCampaign(...)` call sites
  - [x] 3.3 Remove `import { storage } from "@/lib/storage";` and confirm via grep that no reference remains
- [x] **4. Migrate pure-Encounter caller: `app/api/campaigns/[id]/encounters/route.ts`:**
  - [x] 4.1 Add `import { loadEncountersByIds, addEncounterToCampaign } from "@/lib/storage/encounterRepo";`
  - [x] 4.2 Replace `storage.loadEncountersByIds(...)` (×2) and `storage.addEncounterToCampaign(...)` call sites
  - [x] 4.3 Remove `import { storage } from "@/lib/storage";` and confirm via grep that no reference remains
- [x] **5. Migrate pure-Encounter caller: `lib/scripts/backfillCampaignEncounters.ts`:**
  - [x] 5.1 Add `import { loadEncountersByIds, saveEncounter } from "@/lib/storage/encounterRepo";`
  - [x] 5.2 Replace `storage.loadEncountersByIds(...)` and `storage.saveEncounter(...)` call sites
  - [x] 5.3 Remove `import { storage } from "@/lib/storage";` and confirm via grep that no reference remains
- [x] **6. Migrate mixed-domain caller: `app/api/campaigns/global/[id]/copy/route.ts`:**
  - [x] 6.1 Add `import { saveEncounter } from "@/lib/storage/encounterRepo";`
  - [x] 6.2 Replace only the `storage.saveEncounter(...)` call site with `saveEncounter(...)`
  - [x] 6.3 Keep `import { storage } from "@/lib/storage";` (still used for `storage.loadGlobalCampaignTemplateById` and `storage.addMember`) — confirm via `grep -n "storage\." "app/api/campaigns/global/[id]/copy/route.ts"` that exactly those two calls remain and `saveEncounter` is no longer prefixed
- [x] **7. Update test mock: `tests/unit/scripts/backfillCampaignEncounters.test.ts`:**
  - [x] 7.1 Add `jest.mock("@/lib/storage/encounterRepo")` following the existing `jest.mock("@/lib/storage/campaignRepo")` pattern already in this file
  - [x] 7.2 Move the `loadEncountersByIds` and `saveEncounter` mock setup/assertions from the `storage` mock to the new `encounterRepo` mock (update `(storage.loadEncountersByIds as jest.Mock)` → `(encounterRepo.loadEncountersByIds as jest.Mock)`, `expect(storage.saveEncounter)` → `expect(encounterRepo.saveEncounter)`)
  - [x] 7.3 Leave any other `storage.*` mocks in this file untouched
  - [x] 7.4 Run `npx jest --testPathPatterns tests/unit/scripts/backfillCampaignEncounters.test.ts` and confirm it passes with unchanged assertions (only the mock target renamed)
- [x] **8. Update test mock: `tests/unit/api/campaigns/[id]/encounters/route.test.ts`:**
  - [x] 8.1 Add `jest.mock("@/lib/storage/encounterRepo", () => ({ ... }))` following the existing `jest.mock("@/lib/storage/campaignRepo", () => ({ ... }))` pattern already in this file
  - [x] 8.2 Move the `loadEncountersByIds` and `addEncounterToCampaign` mock properties out of the `mockedStorage` typed object into a new `mockedEncounterRepo` typed object (mirroring the existing `mockedCampaignRepo` pattern), and update all `mockedStorage.loadEncountersByIds`/`mockedStorage.addEncounterToCampaign` references to `mockedEncounterRepo.*`
  - [x] 8.3 Run `npx jest --testPathPatterns "tests/unit/api/campaigns/\[id\]/encounters/route.test.ts"` and confirm it passes with unchanged assertions
- [x] **8b. (Discovered during apply, not in original proposal scope) Update test mocks for two more Encounter-caller test files whose `jest.mock("@/lib/storage")` the proposal missed:** `tests/unit/api/encounters/route.test.ts` and `tests/unit/api/encounters/id.test.ts` both fully mocked `@/lib/storage` for `loadEncounters`/`saveEncounter`/`deleteEncounter`/`addEncounterToCampaign`. Split these onto `@/lib/storage/encounterRepo` mocks (keeping `getMember` on the `storage` mock where still used), following the same split-mock pattern as tasks 7-8.
- [x] **9. Confirm untouched files stay untouched:** run `git diff --stat -- lib/storage.ts tests/unit/lib/storage.test.ts tests/unit/lib/storage.campaignEncounters.test.ts tests/unit/storage/storage.test.ts tests/unit/lib/storage/facadeShape.test.ts` and confirm zero output (no diff) before proceeding
- [x] Confirm acceptance criteria in `specs/encounter-storage-callers/spec.md` are covered by the above steps

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npx jest --testPathPatterns "tests/unit/(lib/storage|api/campaigns|api/encounters|scripts/backfillCampaignEncounters)"` at minimum, then the full suite (full suite: 4048/4049 unit tests pass; the 1 failure — `d4EnginePatch.test.ts` — is a pre-existing baseline failure unrelated to this change, confirmed by stashing this change's diff and re-running)
- [x] Run E2E tests (if applicable) — not expected to be affected (no route contract changes); not run in this session — `MONGODB_URI` is unset in this worktree environment (same pre-existing gap as the integration suite, which also fails with "MONGODB_URI not set" independent of this change) and playwright's `globalSetup` requires it
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: project's build script (e.g. `npm run build`) — blocked in this worktree by a pre-existing Turbopack limitation (`Could not find the Next.js package`): this worktree has no local `node_modules` and relies on Node's ancestor-directory module resolution (which Jest/tsc/npx use fine), but Next.js 16's Turbopack build resolves `next` relative to its own filesystem root only, not up the tree. Unrelated to this change — `npx tsc --noEmit` and the full Jest suite are the load-bearing verification here.
- [ ] Run security/code quality checks required by project standards (Verity gate; Codacy if reachable)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. This change touches `.ts`/`.tsx`-adjacent source and test files, so the **full path** applies.

**Full path:**

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `migrate-encounter-storage-callers` to `main`. PR body MUST include `Closes #684`.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 684 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column matching "In Review" via `gh project item-edit` (same discovery pattern as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's `main` branch ruleset is squash-only per `.verity/memory` — use `--squash`, not `--merge`; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved (never merge with unresolved comments)
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks (`ci-gate` and Codacy are the required checks on this repo per `.verity/memory`), commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing this change (opsx:apply)
- Reviewer(s): `dougis` (issue #684 author) via required PR review; `pr-review-toolkit:review-pr` sub-agent as automated first pass
- Required approvals: per `main`'s squash-only ruleset — `ci-gate` + Codacy required checks, 0 human approvals strictly required by the ruleset, but do not merge with unresolved review comments per project feedback memory

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan (never self-waive; if a finding looks like an accepted risk, it must cite an explicit human decision per this repo's CLAUDE.md policy)
- Review comment → address → commit → validate locally → push → confirm resolved (never merge with an unresolved comment thread)

## Post-Merge

- [ ] `git checkout main` (from the primary checkout, not this worktree) and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — no README/CLAUDE.md content describes per-file storage import wiring at this granularity)
- [ ] Sync approved spec delta into `openspec/specs/`: copy `specs/encounter-storage-callers/spec.md` to `openspec/specs/encounter-storage-callers/spec.md`; this delta has no relative links into the change directory (design.md is referenced only in the file's own header comment, matching the template convention), but the archive step below must still update that header comment's relative path
- [ ] Archive the change: move `openspec/changes/migrate-encounter-storage-callers/` to `openspec/changes/archive/YYYY-MM-DD-migrate-encounter-storage-callers/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-encounter-storage-callers/` exists and `openspec/changes/migrate-encounter-storage-callers/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-migrate-encounter-storage-callers` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-encounter-storage-callers`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-migrate-encounter-storage-callers` to `main` with title `docs: archive migrate-encounter-storage-callers (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D migrate-encounter-storage-callers doc/archive-YYYY-MM-DD-migrate-encounter-storage-callers`
- [ ] Remove the change's dedicated worktree: from the primary checkout, `git worktree remove .worktrees/migrate-encounter-storage-callers` (use `--force` if the openspec-shared submodule blocks plain removal, per this repo's known worktree-submodule gotcha)

Required cleanup after archive: `git fetch --prune` and `git branch -D migrate-encounter-storage-callers doc/archive-YYYY-MM-DD-migrate-encounter-storage-callers`
