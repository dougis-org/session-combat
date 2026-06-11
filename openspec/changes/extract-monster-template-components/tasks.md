# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-monster-template-components` then immediately `git push -u origin refactor/extract-monster-template-components`

## Execution

### 1. Extract MonsterTemplateCard

- [ ] Create `app/monsters/MonsterTemplateCard.tsx` with a named export of the `MonsterTemplateCard` function (cut from `app/monsters/page.tsx` lines ~353–437)
- [ ] Ensure all required type imports (`MonsterTemplate`) are present in the new file
- [ ] In `app/monsters/page.tsx`, replace the inline `MonsterTemplateCard` definition with an import from `./MonsterTemplateCard`
- [ ] Verify: `tsc --noEmit` passes

### 2. Extract MonsterTemplateEditor

- [ ] Create `app/monsters/MonsterTemplateEditor.tsx` with a named export of the `MonsterTemplateEditor` function (cut from `app/monsters/page.tsx` lines ~438–end of function)
- [ ] Rename the inline `normalizeSpeed` helper inside the new file to `formatSpeedValue`
- [ ] Ensure all required imports are present: `MonsterTemplate`, `CreatureStatsForm`, `AlignmentSelect`, `EditorShell`, `normalizeAlignment`, `useState`
- [ ] Add a comment above `formatSpeedValue` noting: handles already-stored speed values (string or legacy object); differs from `lib/import/transformMonster.ts:normalizeSpeed` which processes raw API input
- [ ] In `app/monsters/page.tsx`, replace the inline `MonsterTemplateEditor` definition with an import from `./MonsterTemplateEditor`
- [ ] Verify: `tsc --noEmit` passes
- [ ] Verify: `grep -r "normalizeSpeed" app/monsters/` returns no results

### 3. Move and update the page test

- [ ] Move `tests/unit/monstersPage.test.tsx` → `tests/unit/components/MonstersPage.test.tsx` (`git mv`)
- [ ] Verify all imports inside the moved file still resolve (update relative paths if needed)
- [ ] Run: `npx jest --testPathPattern=MonstersPage` — all tests must pass

### 4. Add MonsterTemplateEditor unit test

- [ ] Create `tests/unit/components/MonsterTemplateEditor.test.tsx`
- [ ] Cover scenarios from spec: render with template data, empty-name validation, onSave called with updated data, onCancel called, isGlobal styling applied
- [ ] Use `MonsterEditor.test.tsx` (`tests/unit/components/MonsterEditor.test.tsx`) as the structural template
- [ ] Run: `npx jest --testPathPattern=MonsterTemplateEditor` — all tests must pass

### 5. Final verification

- [ ] Run full monsters test suite: `npx jest --testPathPattern=monsters` — compare test count to pre-change baseline
- [ ] Run: `npx tsc --noEmit` — zero errors
- [ ] Run: `npm run build` — build succeeds

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npx jest --testPathPattern=monsters` — all tests pass, count matches pre-change baseline
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build` — succeeds
- [ ] `grep -r "normalizeSpeed" app/monsters/` — no results
- [ ] `ls app/monsters/MonsterTemplateEditor.tsx app/monsters/MonsterTemplateCard.tsx` — both files exist
- [ ] `ls tests/unit/components/MonsterTemplateEditor.test.tsx tests/unit/components/MonstersPage.test.tsx` — both files exist
- [ ] `ls tests/unit/monstersPage.test.tsx` — file does NOT exist (moved)
- [ ] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npx jest` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — zero errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `refactor/extract-monster-template-components` to `main`. PR body must include: **"Closes #378"**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation, push, wait 180 seconds, repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, validate locally, push, wait 180 seconds, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: (assigned agent)
- Reviewer(s): (project maintainer)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec delta: copy `openspec/changes/extract-monster-template-components/specs/monster-template-editor-extraction/spec.md` → `openspec/specs/monster-template-editor-extraction/spec.md`
- [ ] Archive the change: move `openspec/changes/extract-monster-template-components/` to `openspec/changes/archive/YYYY-MM-DD-extract-monster-template-components/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-monster-template-components/` exists and `openspec/changes/extract-monster-template-components/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-extract-monster-template-components` then `git push -u origin doc/archive-YYYY-MM-DD-extract-monster-template-components`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive extract-monster-template-components (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d refactor/extract-monster-template-components doc/archive-YYYY-MM-DD-extract-monster-template-components`
