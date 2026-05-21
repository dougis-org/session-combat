# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-query-helper-storage-157` then immediately `git push -u origin refactor/extract-query-helper-storage-157`

## Execution

- [x] **Add `QueryableEntity` interface** — add a private interface near the top of `lib/storage.ts` (after imports) capturing `{ _id?: string; id: string; userId: string }`
- [x] **Add `buildEntityQuery` helper** — add the private function directly below the interface, returning `Filter<Document>`; verify `Filter` is imported from `mongodb`
- [x] **Update `saveEncounter`** (line ~187) — replace the `let query: any` block with `const query = buildEntityQuery(encounter)`
- [x] **Update `saveCharacter`** (line ~230) — replace the `let query: any` block with `const query = buildEntityQuery(character)`
- [x] **Update `saveCombatState`** (line ~269) — replace the `let query: any` block with `const query = buildEntityQuery(combatState)`
- [x] **Update `saveMonsterTemplate`** (line ~389) — replace the `let query: any` block with `const query = buildEntityQuery(template)`
- [x] **Update `saveSpellTemplate`** (line ~462) — replace the `Record<string, unknown>` block with `const query = buildEntityQuery(spell)`
- [x] **Verify `saveParty` is untouched**
- [x] Review for duplication and unnecessary complexity
- [x] Confirm all acceptance criteria from issue #157 are covered

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `refactor/extract-query-helper-storage-157` to `main` — reference `Closes #157` in the PR body
- [x] Wait for 120 seconds for the Agentic reviewers to post their comments
- [x] **Monitor PR comments** — when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; repeat until all checks pass
- [x] Wait for the PR to merge — **never force-merge**; if a human force-merges, continue to Post-Merge

The comment and CI resolution loops are iterative: address → validate locally → push → sleep for 120 seconds → re-check → repeat until the PR is fully clean. If a human force-merges before the PR is clean, proceed directly to Post-Merge steps.

Ownership metadata:

- Implementer:
- Reviewer(s):
- Required approvals:

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/extract-query-helper-storage/` to `openspec/changes/archive/2026-05-20-extract-query-helper-storage/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-05-20-extract-query-helper-storage/` exists and `openspec/changes/extract-query-helper-storage/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d refactor/extract-query-helper-storage-157`

Required cleanup after archive: `git fetch --prune` and `git branch -d refactor/extract-query-helper-storage-157`
