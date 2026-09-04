# Tasks

Change: `monster-json-import-modal` · Issue-driven: **#626** · Default branch: `main` · Working branch: `monster-json-import-modal` · Worktree: `.worktrees/monster-json-import-modal`

Ownership metadata:

- Implementer: primary agent (opsx:apply)
- Reviewer(s): `openspec-review-code` sub-agent (pre-commit) + `pr-review-toolkit:review-pr` sub-agent (post-PR) + human review if requested on PR
- Required approvals: 0 (main is a squash-only ruleset; `ci-gate` + Codacy are the required checks)
- Approval expectation: auto-merge via `--squash` once required checks pass and the review gate is clean

## Preparation

- [ ] **Step 1 — Sync default branch:** from the primary checkout, `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Confirm working branch is published:** the branch `monster-json-import-modal` and worktree `.worktrees/monster-json-import-modal` were created during propose. Verify with `git worktree list` and `git ls-remote --heads origin monster-json-import-modal`. If the branch is not on remote, from inside the worktree run `git push -u origin monster-json-import-modal`.
- [x] **Step 3 — Confirm `zod` availability:** check `package.json` / `node_modules` for `zod`. If absent, plan to add it (`npm install zod`) as the first Execution step.

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt immediately, tell the user the `pr-review-toolkit` plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.
- [x] **OQ-1/OQ-2/OQ-3 resolved 2026-09-03** — `speed` required, `hp` defaults to `maxHp`; structure doc = inline field table + downloadable example; in-file duplicates = skipped (first wins). No open blockers for apply.
- [x] Confirm `.worktrees/` is in `.gitignore` and all work happens inside `.worktrees/monster-json-import-modal`.

## Execution

All steps run inside `.worktrees/monster-json-import-modal`. Follow strict TDD: write the failing test (from `tests.md`) first, then the implementation, per task.

- [x] **Step 1 — Confirm worktree:** `cd` into `.worktrees/monster-json-import-modal`; confirm it exists (created during propose). If missing, from the primary checkout run `git fetch origin main` then `git worktree add .worktrees/monster-json-import-modal -b monster-json-import-modal origin/main`.
- [x] **Step 2 — Confirm branch pushed:** `git push -u origin monster-json-import-modal` if not already on remote.
- [ ] **Step 3 — Issue lifecycle: mark in-progress** _(issue-driven)_: run `gh issue edit 626 --add-label "in-progress"`. Then discover the linked GitHub Project via `gh project list --owner dougis-org --format json`, resolve the status field option matching "In Progress" via `gh project field-list <project-number> --owner dougis-org --format json`, and move the item with `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, tell the user to run `gh auth refresh -s project` and skip the project-item update (the label update still proceeds).

### Execution: schema and validation (single source of truth)

- [x] **Step 4 — Port existing `monsterUpload` tests:** copy the current `lib/validation/__tests__/monsterUpload*.test.ts` (or wherever they live) expectations into the new test file unchanged, so the Zod rewrite must preserve behavior. Grep every importer of `@/lib/validation/monsterUpload` first and record call sites.
- [x] **Step 5 — Implement `rawMonsterSchema` + `monsterUploadSchema` (Zod)** in `lib/validation/monsterUpload.ts` per design Decision 2. Accept both a bare top-level array and `{ monsters: [...] }`; strip unknown keys; bound string lengths; enforce `hp <= maxHp` with `hp` defaulting to `maxHp`.
- [x] **Step 6 — Reimplement `validateMonsterUploadDocument`** over `safeParse`, mapping `ZodError.issues` to the existing `ValidationError { field: 'monsters[i].path', message, index }` and `ValidationResult { valid, errors }` shape. Keep exported signatures stable.
- [ ] **Step 7 — Reimplement `transformMonsterData(raw, { userId, isGlobal })`** to consume parsed+defaulted output, keep `normalizeAlignment` / `filterToDamageTypes` post-processing, and set `userId`/`isGlobal` from the argument (no more hardcoded `isGlobal: false`).
- [x] **Step 8 — Add `describeMonsterUploadSchema()`** returning `FieldDescriptor[]` (name, type, required, description). Exclude calculated fields.
- [x] **Step 9 — Update all call sites** found in Step 4 to the new `transformMonsterData` signature.

### Execution: storage layer

- [x] **Step 10 — `saveManyMonsterTemplates(templates)`** in `lib/storage/monsterTemplateRepo.ts` — single `insertMany(docs, { ordered: false })` wrapped in `runStorageOp` (op name `saveManyMonsterTemplates`, collection `monsterTemplates`).
- [x] **Step 11 — `deleteMonsterTemplatesByIds(ids, userId)`** — single `deleteMany({ id: { $in: ids }, userId })` via `runStorageOp`; idempotent.
- [x] **Step 12 — `findExistingMonsterKeys(keys, userId)`** — one query `find({ userId, name: { $in: names } })` projecting `name`+`source`, returning the set of `name|source` keys that already exist. Via `runStorageOp`.
- [x] **Step 13 — Export the new functions through `@/lib/storage`** (the `storage` facade used by routes).

### Execution: API routes

- [x] **Step 14 — `POST /api/monsters/upload/validate`** (`withAuth`): normalize body to `{ monsters }`, run `validateMonsterUploadDocument`, return `200 { valid: true, count, names, isAdmin }` or `400 { valid: false, errors }`. No writes. Enforce the 5 MB body cap.
- [x] **Step 15 — Rework `POST /api/monsters/upload`** (`withAuth`) per design Decision 4: body `{ monsters, scope }`; re-validate; if `scope === 'global'` require admin (reuse the existing admin-check helper) else `403`; compute `targetUserId` (`auth.userId` or `GLOBAL_USER_ID`) and `isGlobal`; in-file dedupe (first wins); `findExistingMonsterKeys` for DB dedupe; `transformMonsterData` survivors; `saveManyMonsterTemplates`; on throw, `deleteMonsterTemplatesByIds(generatedIds, targetUserId)` in `catch`, log `orphanedMonsterIds`, return `500 { reverted: true, errors, orphanedMonsterIds }`. Success → `200 { inserted, skippedDuplicates, reverted: false }`. Remove the old `Promise.all` per-row + 207 path.
- [x] **Step 16 — `GET /api/monsters/import-schema`** (`withAuth` or public — match sibling routes): return `{ jsonSchema, example, fields }` from `describeMonsterUploadSchema()` and a fully-populated one-monster example array.
- [x] **Step 17 — Ensure client-facing errors are generic** (no DB internals); full detail to `console.error`.

### Execution: UI

- [x] **Step 18 — `app/monsters/ImportMonstersModal.tsx`** — client component with state machine `idle → fileSelected → validating → preview → confirming → done | error` per design Decision 6. Includes: schema link (client-side download of example), inline `fields` table with required markers, file picker (`accept=".json,application/json"`, 5 MB client cap), preview (count + names), admin-only Personal/Global radio (default Personal), skipped-duplicates list on `done`, error region with `role="alert"` **and** `data-testid="import-modal-error"`, focus trap + `Esc` close matching the existing editor modal pattern.
- [x] **Step 19 — Wire the modal into `app/monsters/page.tsx`** — add `Import Monster(s)` button (visible to all authed users) near `Add New Monster`; `useState` for open; pass `isAdmin` and a refresh callback that re-runs the library fetch after a successful import.
- [x] **Step 20 — Trim `app/monsters/import/page.tsx`** — remove the "Upload Monster JSON File" form, `handleSubmit`, `fileInputRef`, and now-unused state; keep the open5e "Sync from open5e" panel and `handleSync`.

- [x] **Step 21 — Reuse check:** before writing any new helper, confirm nothing in `lib/` already does it (`normalizeAlignment`, `filterToDamageTypes`, `buildEntityQuery`, existing modal/focus-trap utilities, `GLOBAL_USER_ID`, admin-check helper).
- [x] **Step 22 — Confirm every acceptance scenario in `specs/monster-import/spec.md` is covered by an implemented behavior and a test in `tests.md`.**

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent automatically applies all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, without asking for confirmation. Apply fixes, re-run the affected tests to confirm green, then commit.

## Validation

- [x] Run unit + integration tests (`npm test` or the project's documented command) — all pass
- [x] Run E2E / Playwright tests for the monster import flow — all pass (use a free port, not 3000, for the E2E server)
- [x] Run type checks (`npm run typecheck` or documented equivalent) — clean
- [x] Run the build (`npm run build`) — succeeds with no errors
- [ ] Run security / code-quality checks required by project standards (Verity pre-push gate, Codacy). Fix findings — do not waive except to relay a human-accepted risk per `CLAUDE.md`.
- [ ] All completed tasks marked `- [x]`
- [ ] All steps in [Remote push validation] pass

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only main...HEAD`; if every changed file ends in `.md`, use the docs-only path, else the full path. This change touches `.ts`/`.tsx` → **full path** expected.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit suite; all pass
- **Integration tests** — run the project's integration suite; all pass
- **Regression / E2E tests** — run the project's E2E/regression suite; all pass
- **Build** — run the project's build script; succeeds with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; succeeds
- Skip integration and E2E

If **ANY** required step fails, iterate and fix before pushing. Use the project's documented commands (see `README` / `CLAUDE.md`).

## PR and Merge

- [ ] Confirm the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit all changes to `monster-json-import-modal` and push to remote
- [ ] Open PR from `monster-json-import-modal` to `main`. **PR body MUST include `Closes #626`** (unconditional). Search for a PR template (`.github/PULL_REQUEST_TEMPLATE*`) and follow it.
- [ ] **Issue lifecycle: mark in-review** _(issue-driven)_: `gh issue edit 626 --add-label "in-review" --remove-label "in-progress"`, then move the project item to the "In Review" status column (same project/field/option discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, run [Remote push validation], push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (main is squash-only; NEVER use `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (if `CLOSED`, exit and notify the user); never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all [Remote push validation] steps; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, run [Remote push validation], push, wait 180s; repeat until all resolved
  3. **CI check failures** — after comments are resolved, poll `gh pr checks <PR-URL>`; fix failing required checks (`ci-gate`, Codacy), commit, run [Remote push validation], push, wait 180s; restart from step 1

Blocking resolution flow:

- CI failure → diagnose → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan (do not waive on agent judgment)
- Review comment → address → commit → validate locally → push → confirm thread resolved
- Stall (3+ iterations, no progress) → report remaining items to the user, wait for guidance

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (README / any monster-import docs, `.wolf/anatomy.md` for new files, `.wolf/memory.md`)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/monster-import/spec.md` to `openspec/specs/monster-import/spec.md` and update relative links — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-monster-json-import-modal/design.md` (and similarly for `tasks.md` / any other path into the change directory). Reconcile MODIFIED/REMOVED requirements against existing capabilities (`import-sync`, `monster-open5e-sync`, `modal`).
- [ ] Archive the change: move `openspec/changes/monster-json-import-modal/` to `openspec/changes/archive/YYYY-MM-DD-monster-json-import-modal/` and stage both the new location and the deletion of the old in a **single** commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-monster-json-import-modal/` exists and `openspec/changes/monster-json-import-modal/` is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-monster-json-import-modal` then `git push -u origin doc/archive-YYYY-MM-DD-monster-json-import-modal`
- [ ] Open a PR from that doc branch to `main`, title `docs: archive monster-json-import-modal (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Remove the worktree: `git worktree remove .worktrees/monster-json-import-modal --force` (`--force` needed due to the openspec-shared submodule)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D monster-json-import-modal doc/archive-YYYY-MM-DD-monster-json-import-modal`
- [ ] Post-task reflection: ask the user the one-question reflection from `CLAUDE.md` and run `verity reflect --user-input "<response>"` if they answer.

## Completion checklist

- [ ] All acceptance scenarios in `specs/monster-import/spec.md` implemented and tested
- [ ] Docs updated (README / anatomy / memory)
- [ ] Approved spec deltas synced to `openspec/specs/`
- [ ] Change archived in a single atomic commit
- [ ] Dedicated worktree removed and merged local branches pruned
- [ ] Issue #626 closed by the merged PR
