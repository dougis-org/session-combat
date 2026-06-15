# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-monster-stat-editor` then immediately `git push -u origin refactor/extract-monster-stat-editor`

## Execution

### 1. Add MonsterEditableFields to lib/types.ts

- [x] Export `MonsterEditableFields` type from `lib/types.ts` as an intersection of `CreatureStats` and the shared header fields (name, size, type, alignment, speed, challengeRating, source?, description?)
- [x] Verify `Monster` and `MonsterTemplate` are both assignable to `MonsterEditableFields` via `tsc --noEmit`

### 2. Create lib/components/MonsterStatEditor.tsx

- [x] Create `lib/components/MonsterStatEditor.tsx` as a controlled component accepting `value: MonsterEditableFields` and `onChange: (value: MonsterEditableFields) => void`
- [x] Render header fields: name, size, type, alignment (via `AlignmentSelect`), speed, challengeRating, source, description
- [x] Render `CreatureStatsForm` with the `CreatureStats` portion of `value`; merge stat changes into the full `MonsterEditableFields` when calling `onChange`
- [x] Write `tests/unit/components/MonsterStatEditor.test.tsx`:
  - All header fields present on mount
  - `CreatureStatsForm` receives correct `stats` prop
  - Name field change calls `onChange` with updated `MonsterEditableFields`
  - `CreatureStatsForm` `onChange` calls outer `onChange` with merged value

### 3. Refactor app/encounters/MonsterEditor.tsx

- [x] Replace 5-field implementation with `MonsterStatEditor` delegation
- [x] State: hold `MonsterEditableFields` initialized from `monster` prop; on Save, spread onto original `monster` and call `onSave`
- [x] Update `tests/unit/components/MonsterEditor.test.tsx`:
  - Remove assertions for 5-field-only rendering
  - Assert full stat block is present (via `MonsterStatEditor`)
  - Assert `onSave` receives fully merged `Monster`
  - Assert Cancel fires `onCancel`

### 4. Refactor app/monsters/MonsterTemplateEditor.tsx

- [x] Replace header field rendering and `CreatureStatsForm` usage with `MonsterStatEditor` delegation
- [x] Retain: `saving` state, `validationError` state, async `handleSave` with `fetch`, `isGlobal` styling, `isNew` button label logic
- [x] State: hold `MonsterEditableFields` initialized from `template` prop; on save, spread onto original `template` before `fetch`
- [x] Update `tests/unit/components/MonsterTemplateEditor.test.tsx`:
  - Assert `MonsterStatEditor` receives correct `value`
  - Retain existing: validation error on empty name, async save calls fetch and fires onSave, isGlobal styling, isNew/notIsNew button label

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass (MonsterStatEditor, MonsterEditor, MonsterTemplateEditor)
- [x] `tsc --noEmit` — zero new TypeScript errors
- [x] `npm run build` — build succeeds
- [x] All execution tasks marked complete

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `refactor/extract-monster-stat-editor` to `main`. PR body must include `Closes #379`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec delta: copy `openspec/changes/extract-monster-stat-editor/specs/monster-stat-editor/spec.md` to `openspec/specs/monster-stat-editor/spec.md`; update relative links in the copied file from `../../design.md` → `../../changes/archive/YYYY-MM-DD-extract-monster-stat-editor/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-extract-monster-stat-editor/tasks.md`
- [ ] Archive the change: move `openspec/changes/extract-monster-stat-editor/` to `openspec/changes/archive/YYYY-MM-DD-extract-monster-stat-editor/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-monster-stat-editor/` exists and `openspec/changes/extract-monster-stat-editor/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-extract-monster-stat-editor` then `git push -u origin doc/archive-YYYY-MM-DD-extract-monster-stat-editor`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-extract-monster-stat-editor` to `main` with title `docs: archive extract-monster-stat-editor (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D refactor/extract-monster-stat-editor doc/archive-YYYY-MM-DD-extract-monster-stat-editor`
