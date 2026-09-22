# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`)
- [x] **Step 2 — Create and publish working branch:** done during propose — `.worktrees/migrate-character-repo-callers` created from `origin/main` on branch `migrate-character-repo-callers`, pushed to `origin/migrate-character-repo-callers`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — not listed in this session's skills; user confirmed substituting the available `pr-reviewer` skill for PR-review steps (tasks 3 and 27).

## Execution

- [x] **Issue lifecycle: mark in-progress** — issue #682 labeled `in-progress`; project item moved to "In progress" in project #7 (Session Combat).
- [x] **T1 — `app/api/characters/route.ts` (pure):** replace `import { storage } from '@/lib/storage'` with `import { loadCharacters, saveCharacter } from '@/lib/storage/characterRepo'`; update the two call sites (`storage.loadCharacters(auth.userId)` → `loadCharacters(auth.userId)`, `storage.saveCharacter(character)` → `saveCharacter(character)`). Verify no other `storage.*` calls remain in this file before removing the import.
- [x] **T2 — `app/api/characters/[id]/route.ts` (pure):** replace `import { storage } from "@/lib/storage"` with `import { loadCharacters, saveCharacter, deleteCharacter } from "@/lib/storage/characterRepo"`; update the four call sites (two `loadCharacters`, one `saveCharacter`, one `deleteCharacter`). Verify no other `storage.*` calls remain before removing the import.
- [x] **T3 — `app/api/characters/import/route.ts` (pure):** replace `import { storage } from "@/lib/storage"` with `import { loadCharacters, saveCharacter } from "@/lib/storage/characterRepo"`; update the two call sites. Verify no other `storage.*` calls remain before removing the import.
- [x] **T4 — `app/api/campaigns/[id]/characters/[cid]/route.ts` (mixed):** keep the existing `import { storage } from '@/lib/storage'`; add `import { loadCharacterById } from '@/lib/storage/characterRepo'`; update only the `storage.loadCharacterById(characterId)` call site to `loadCharacterById(characterId)`. Leave `storage.getMember`, `storage.removeShare`, `storage.setPartyMemberLeftAt` untouched.
- [x] **T5 — `app/api/campaigns/[id]/characters/route.ts` (mixed):** keep the existing `import { storage } from '@/lib/storage'`; add `import { loadCharacterById } from '@/lib/storage/characterRepo'`; update only the `storage.loadCharacterById(characterId)` call site. Leave `storage.getMember`, `storage.addShare`, `storage.listSharesForCampaign`, `storage.buildSharedCharacterEntries` untouched.
- [x] **T6 — `app/api/campaigns/[id]/members/[userId]/parties/[partyId]/route.ts` (mixed):** keep the existing `import { storage } from '@/lib/storage'`; add `import { loadCharacters } from '@/lib/storage/characterRepo'`; update only the `storage.loadCharacters(memberId)` call site. Leave `storage.getMember` (both call sites), `storage.loadPartiesByCampaign`, `storage.saveParty` untouched.
- [x] **T7 — Regression tests:** for each of the six routes above, locate (or create, following the existing test file's conventions) the Jest test suite under `tests/`, and add/update test cases asserting: (a) an unauthenticated request returns 401, (b) a request scoped to a character/resource not owned by `auth.userId` returns 404 (not the other user's data). Update any test mocks that referenced `storage.loadCharacters`/`storage.saveCharacter`/`storage.loadCharacterById`/`storage.deleteCharacter` to instead mock the equivalent `lib/storage/characterRepo` export, matching how the production code now imports it.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — no new logic is expected for T1–T6 (pure import/call-site rename); T7 should reuse each file's existing test mocking pattern rather than introducing a new one.
- [x] Confirm acceptance criteria are covered: every "In Scope" bullet in proposal.md and every scenario in `specs/character-storage-wiring/spec.md` maps to a completed task above.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit. Findings: 2 quality issues (misnamed `mockedStorage` var in the two "pure" test files after `storage` import removal), both fixed; 71/71 tests pass.

## Validation

- [x] Run unit/integration tests: `npm run test:unit` and `npm run test:integration` — 318/318 suites, 4042/4042 tests (unit); 39/39 suites, 359/359 tests (integration). Required a worktree-local `npm install` first (this worktree had no local `node_modules`, so Node was resolving a stale/parent copy via directory walk-up — a pre-existing environment gap, not a code issue).
- [x] Run E2E tests (if applicable): `tests/e2e/characters.spec.ts` and `tests/e2e/combat-import.spec.ts` directly exercise the touched character routes (creation, editing, deletion, gender field, D&D Beyond import) — ran both: 56/56 passed (chromium + firefox).
- [x] Run type checks: `npm run typecheck` — zero errors
- [x] Run build: `npm run build` — succeeds
- [ ] Run security/code quality checks required by project standards: Verity pre-commit/pre-push gate (runs automatically on commit/push per this repo's hooks); do not waive findings without an explicitly cited human-approved reason per `CLAUDE.md`
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `.ts` route files plus `openspec/**/*.md`, so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:regression` if any touched route has E2E coverage; otherwise note as not applicable
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `migrate-character-repo-callers` to `main`. **PR body MUST include `Closes #682`.**
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 682 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's `main` branch is a squash-only ruleset — use `--squash`, not `--merge`; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks (`ci-gate` and Codacy are required per this repo's ruleset), commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (via `/opsx:apply`), on behalf of doug@dougis.com
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated) + required human review per branch ruleset
- Required approvals: 0 formal approvals required by `main`'s squash-only ruleset, but all PR comments must be resolved per project convention (see CLAUDE.md "Resolve PR comments")

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan (waive only per `CLAUDE.md`'s `verity waive` policy, citing an explicit human-approved source)
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — this is an internal wiring change with no public API/docs surface)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/character-storage-wiring/spec.md` to `openspec/specs/character-storage-wiring/spec.md`, then update its relative links — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-migrate-character-repo-callers/design.md`
- [ ] Archive the change: move `openspec/changes/migrate-character-repo-callers/` to `openspec/changes/archive/YYYY-MM-DD-migrate-character-repo-callers/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-character-repo-callers/` exists and `openspec/changes/migrate-character-repo-callers/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-migrate-character-repo-callers` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-character-repo-callers`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-migrate-character-repo-callers` to `main` with title `docs: archive migrate-character-repo-callers (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D migrate-character-repo-callers doc/archive-YYYY-MM-DD-migrate-character-repo-callers`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/migrate-character-repo-callers` (use `--force` if it fails due to the `openspec-shared` submodule, per this repo's known worktree-submodule-removal quirk)
- [ ] File the follow-up issue for `characterRepo.saveCharacters`'s internal `storage.saveCharacter` self-reference (Non-Goal from proposal.md), referencing epic #499

Required cleanup after archive: `git fetch --prune` and `git branch -D migrate-character-repo-callers doc/archive-YYYY-MM-DD-migrate-character-repo-callers`
