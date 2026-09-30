# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose — dedicated worktree `.worktrees/migrate-monster-spell-repo-callers` created from `origin/main`
- [x] **Step 2 — Create and publish working branch:** `migrate-monster-spell-repo-callers` branch created and pushed (`git push -u origin migrate-monster-spell-repo-callers`)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 686 --add-label "in-progress"` (repo `dougis-org/session-combat`). Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **T1 — Confirm repo method inventory before editing.** Re-verify (via `grep`/type-check) that `lib/storage/monsterTemplateRepo.ts` exports `saveMonsterTemplate`, `loadMonsterTemplates`, `loadAllMonsterTemplates`, `loadGlobalMonsterTemplates`, `deleteMonsterTemplate`, `saveManyMonsterTemplates`, `deleteMonsterTemplatesByIds`, `findExistingMonsterKeys`, `findMonsterByNameAndSource`, and `lib/storage/spellRepo.ts` exports `loadSpells`, `loadSpellById`, `saveSpellTemplate`, `deleteSpellTemplate`, `spellExistsByNameAndSource`. Confirms design.md's assumption before any file is edited.
- [x] **T2 — Migrate `lib/import/dedupeEngine.ts`.** Replace `import { storage } from "@/lib/storage"` with `import * as monsterTemplateRepo from "@/lib/storage/monsterTemplateRepo"` and `import * as spellRepo from "@/lib/storage/spellRepo"`. Update `shouldImport`'s spell branch to call `spellRepo.spellExistsByNameAndSource`, its monster branch to call `monsterTemplateRepo.findMonsterByNameAndSource`, `importMonsterSingle` to call `monsterTemplateRepo.saveMonsterTemplate`, and `importSpellsFromOpen5E`'s save callback to call `spellRepo.saveSpellTemplate`. Verify: `grep -n "storage\." lib/import/dedupeEngine.ts` returns nothing.
- [x] **T3 — Migrate `app/api/monsters/route.ts`.** Replace `storage` import with `import * as monsterTemplateRepo from '@/lib/storage/monsterTemplateRepo'`. Update `GET` to call `monsterTemplateRepo.loadAllMonsterTemplates`, `POST` to call `monsterTemplateRepo.saveMonsterTemplate`. Verify: `grep -n "storage\." app/api/monsters/route.ts` returns nothing.
- [x] **T4 — Migrate `app/api/monsters/[id]/route.ts`.** Replace `storage` import with `monsterTemplateRepo`. Update `loadUserTemplate` to call `monsterTemplateRepo.loadMonsterTemplates`, `PUT` to call `monsterTemplateRepo.saveMonsterTemplate`, `DELETE` to call `monsterTemplateRepo.deleteMonsterTemplate`. Verify: `grep -n "storage\." "app/api/monsters/[id]/route.ts"` returns nothing.
- [x] **T5 — Migrate `app/api/monsters/[id]/duplicate/route.ts`.** Replace `storage` import with `monsterTemplateRepo`. Update `POST` to call `monsterTemplateRepo.loadAllMonsterTemplates` and `monsterTemplateRepo.saveMonsterTemplate`. Verify: `grep -n "storage\." "app/api/monsters/[id]/duplicate/route.ts"` returns nothing.
- [x] **T6 — Migrate `app/api/monsters/global/route.ts`.** Replace `storage` import with `monsterTemplateRepo`. Update `GET` to call `monsterTemplateRepo.loadGlobalMonsterTemplates`, `POST` and the seeding `PUT` to call `monsterTemplateRepo.saveMonsterTemplate`. Verify: `grep -n "storage\." app/api/monsters/global/route.ts` returns nothing.
- [x] **T7 — Migrate `app/api/monsters/global/[id]/route.ts`.** Replace `storage` import with `monsterTemplateRepo`. Update `GET`, `PUT` to call `monsterTemplateRepo.loadGlobalMonsterTemplates` and `monsterTemplateRepo.saveMonsterTemplate`, `DELETE` to call `monsterTemplateRepo.deleteMonsterTemplate`. Verify: `grep -n "storage\." "app/api/monsters/global/[id]/route.ts"` returns nothing.
- [x] **T8 — Migrate `app/api/monsters/upload/route.ts`.** Replace `storage` import with `monsterTemplateRepo`. Update `ingest` to call `monsterTemplateRepo.findExistingMonsterKeys`, `monsterTemplateRepo.saveManyMonsterTemplates`, and the compensating-delete path to call `monsterTemplateRepo.deleteMonsterTemplatesByIds`. Verify: `grep -n "storage\." app/api/monsters/upload/route.ts` returns nothing.
- [x] **T9 — Migrate `app/api/spells/route.ts`.** Replace `storage` import with `import * as spellRepo from "@/lib/storage/spellRepo"`. Update `GET` to call `spellRepo.loadSpells`, `POST` to call `spellRepo.saveSpellTemplate`. Verify: `grep -n "storage\." app/api/spells/route.ts` returns nothing.
- [x] **T10 — Migrate `app/api/spells/[id]/route.ts`.** Replace `storage` import with `spellRepo`. Update `GET`, `PUT` to call `spellRepo.loadSpellById` and `spellRepo.saveSpellTemplate`, `DELETE` to call `spellRepo.loadSpellById` and `spellRepo.deleteSpellTemplate`. Verify: `grep -n "storage\." "app/api/spells/[id]/route.ts"` returns nothing.
- [x] **T11 — Update `tests/unit/lib/storage.test.ts`.** Inspect for Monster/Spell Template assertions coupled to `storage`; leave facade-level tests only if they test `storage.ts`'s delegation itself (still valid — the facade still delegates). If any test asserts against production call sites that no longer exist, update or remove per what's actually being tested.
- [x] **T12 — Update `tests/unit/lib/storage.characterization.test.ts`.** Same review as T11 — characterization tests target `storage.ts` behavior directly, which is unchanged; confirm no false assumptions about caller behavior leak in.
- [x] **T13 — Update `tests/unit/import/dedupeEngine.test.ts`.** Update any `jest.mock('@/lib/storage', ...)` to mock `@/lib/storage/monsterTemplateRepo` and `@/lib/storage/spellRepo` instead, matching T2's new imports.
- [x] **T14 — Update `tests/unit/api/monsters/upload.route.test.ts`.** Update any `jest.mock('@/lib/storage', ...)` to mock `@/lib/storage/monsterTemplateRepo`, matching T8's new imports.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — N/A for this task (no new logic; only import/call-site swaps against already-existing repo methods).
- [x] Confirm acceptance criteria are covered — cross-check each scenario in `specs/monster-spell-callers-narrow-imports/spec.md` against the corresponding T2-T14 task.

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `.ts`/`.tsx` files, so the **full path** applies.

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
- [ ] Open PR from `migrate-monster-spell-repo-callers` to `main`. PR body MUST include `Closes #686`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 686 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (per project ruleset: `main` is squash-only; NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (this change)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated) + repo human reviewer (per branch ruleset, 0 required approvals but review gate must pass)
- Required approvals: 0 human approvals required by `main`'s ruleset; `ci-gate` + Codacy checks required

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — N/A expected (no user-facing docs reference `storage.ts` import paths), confirm during review
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/monster-spell-callers-narrow-imports/spec.md` to `openspec/specs/monster-spell-callers-narrow-imports/spec.md`, and update its `design.md` relative link from `../../design.md` to `../../changes/archive/YYYY-MM-DD-migrate-monster-spell-repo-callers/design.md`
- [ ] Archive the change: move `openspec/changes/migrate-monster-spell-repo-callers/` to `openspec/changes/archive/YYYY-MM-DD-migrate-monster-spell-repo-callers/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-migrate-monster-spell-repo-callers/` exists and `openspec/changes/migrate-monster-spell-repo-callers/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-migrate-monster-spell-repo-callers` then `git push -u origin doc/archive-YYYY-MM-DD-migrate-monster-spell-repo-callers`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-migrate-monster-spell-repo-callers` to `main` with title `docs: archive migrate-monster-spell-repo-callers (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D migrate-monster-spell-repo-callers doc/archive-YYYY-MM-DD-migrate-monster-spell-repo-callers`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/migrate-monster-spell-repo-callers`

Required cleanup after archive: `git fetch --prune` and `git branch -D migrate-monster-spell-repo-callers doc/archive-YYYY-MM-DD-migrate-monster-spell-repo-callers`
