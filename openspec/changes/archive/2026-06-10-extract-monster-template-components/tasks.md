# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-monster-template-components` then immediately `git push -u origin refactor/extract-monster-template-components`

## Execution

### 1. Extract MonsterTemplateCard

- [x] Create `app/monsters/MonsterTemplateCard.tsx` with a named export of the `MonsterTemplateCard` function (cut from `app/monsters/page.tsx` lines ~353–437)
- [x] Ensure all required type imports (`MonsterTemplate`) are present in the new file
- [x] In `app/monsters/page.tsx`, replace the inline `MonsterTemplateCard` definition with an import from `./MonsterTemplateCard`
- [x] Verify: `tsc --noEmit` passes

### 2. Extract MonsterTemplateEditor

- [x] Create `app/monsters/MonsterTemplateEditor.tsx` with a named export of the `MonsterTemplateEditor` function (cut from `app/monsters/page.tsx` lines ~438–end of function)
- [x] Rename the inline `normalizeSpeed` helper inside the new file to `formatSpeedValue`
- [x] Ensure all required imports are present: `MonsterTemplate`, `CreatureStatsForm`, `AlignmentSelect`, `EditorShell`, `normalizeAlignment`, `useState`
- [x] Add a comment above `formatSpeedValue` noting: handles already-stored speed values (string or legacy object); differs from `lib/import/transformMonster.ts:normalizeSpeed` which processes raw API input
- [x] In `app/monsters/page.tsx`, replace the inline `MonsterTemplateEditor` definition with an import from `./MonsterTemplateEditor`
- [x] Verify: `tsc --noEmit` passes
- [x] Verify: `grep -r "normalizeSpeed" app/monsters/` returns no results

### 3. Move and update the page test

- [x] Move `tests/unit/monstersPage.test.tsx` → `tests/unit/components/MonstersPage.test.tsx` (`git mv`)
- [x] Verify all imports inside the moved file still resolve (update relative paths if needed)
- [x] Run: `npx jest --testPathPattern=MonstersPage` — all tests must pass

### 4. Add MonsterTemplateEditor unit test

- [x] Create `tests/unit/components/MonsterTemplateEditor.test.tsx`
- [x] Cover scenarios from spec: render with template data, empty-name validation, onSave called with updated data, onCancel called, isGlobal styling applied
- [x] Use `MonsterEditor.test.tsx` (`tests/unit/components/MonsterEditor.test.tsx`) as the structural template
- [x] Run: `npx jest --testPathPattern=MonsterTemplateEditor` — all tests must pass

### 5. Final verification

- [x] Run full monsters test suite: `npx jest --testPathPattern=monsters` — compare test count to pre-change baseline
- [x] Run: `npx tsc --noEmit` — zero errors
- [x] Run: `npm run build` — build succeeds

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx jest --testPathPattern=monsters` — all tests pass, count matches pre-change baseline
- [x] `npx tsc --noEmit` — zero errors
- [x] `npm run build` — succeeds
- [x] `grep -r "normalizeSpeed" app/monsters/` — no results
- [x] `ls app/monsters/MonsterTemplateEditor.tsx app/monsters/MonsterTemplateCard.tsx` — both files exist
- [x] `ls tests/unit/components/MonsterTemplateEditor.test.tsx tests/unit/components/MonstersPage.test.tsx` — both files exist
- [x] `ls tests/unit/monstersPage.test.tsx` — file does NOT exist (moved)
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — zero errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `refactor/extract-monster-template-components` to `main`. PR body must include: **"Closes #378"**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation, push, wait 180 seconds, repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, validate locally, push, wait 180 seconds, repeat
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: (assigned agent)
- Reviewer(s): (project maintainer)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec delta: copy `openspec/changes/extract-monster-template-components/specs/monster-template-editor-extraction/spec.md` → `openspec/specs/monster-template-editor-extraction/spec.md`
- [x] Archive the change: move `openspec/changes/extract-monster-template-components/` to `openspec/changes/archive/2026-06-10-extract-monster-template-components/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-06-10-extract-monster-template-components/` exists and `openspec/changes/extract-monster-template-components/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-2026-06-10-extract-monster-template-components` then `git push -u origin doc/archive-2026-06-10-extract-monster-template-components`
- [x] Open a PR from the doc branch to `main` with title `docs: archive extract-monster-template-components (2026-06-10)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d refactor/extract-monster-template-components doc/archive-2026-06-10-extract-monster-template-components`
