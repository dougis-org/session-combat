# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b fix-import-utility-placement` then immediately `git push -u origin fix-import-utility-placement`

## Execution

### Task 1 — Add `ModifierLike` interface and update `isDamageTypeModifier` in `utils.ts`

**File:** `lib/import/utils.ts`

- [x] Remove `import type { DndBeyondModifier } from "../dndBeyondCharacterImport"`
- [x] Add exported interface `ModifierLike { subType?: string | null; friendlySubtypeName?: string | null }`
- [x] Change `isDamageTypeModifier` parameter type from `DndBeyondModifier` to `ModifierLike`
- [x] Verify: `grep -n "dndBeyondCharacterImport\|DndBeyondModifier" lib/import/utils.ts` returns no results

### Task 2 — Move `isPresent`, `escapeRegExp`, `ABILITY_KEYS` to `utils.ts`

**File:** `lib/import/utils.ts`

- [x] Add `isPresent<T>(value: T | null | undefined): value is T` function
- [x] Add `escapeRegExp(string: string): string` function
- [x] Add `ABILITY_KEYS` as `export const ABILITY_KEYS: ReadonlyArray<keyof AbilityScores> = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const`
- [x] Ensure `AbilityScores` is imported from `../types` (already present)

### Task 3 — Remove misplaced generics from `dndBeyond-utils.ts`

**File:** `lib/import/dndBeyond-utils.ts`

- [x] Remove `isPresent` function export
- [x] Remove `escapeRegExp` function export
- [x] Remove `ABILITY_KEYS` export
- [x] If `ABILITY_KEYS` was used internally, add `import { ABILITY_KEYS } from "./utils"`
- [x] Verify: `grep -n "isPresent\|escapeRegExp\|ABILITY_KEYS" lib/import/dndBeyond-utils.ts` shows only any remaining import (not definitions)

### Task 4 — Move `flattenModifiers` to `dndBeyond-utils.ts`

**Files:** `lib/dndBeyondCharacterImport.ts`, `lib/import/dndBeyond-utils.ts`

- [x] Copy `flattenModifiers` function body from `lib/dndBeyondCharacterImport.ts` to `lib/import/dndBeyond-utils.ts`
- [x] Export it from `dndBeyond-utils.ts` with necessary type imports (`DndBeyondCharacterData`, `DndBeyondModifier`)
- [x] In `lib/dndBeyondCharacterImport.ts`: remove the local definition; add `flattenModifiers` to the import from `./import/dndBeyond-utils`
- [x] Verify: `grep -n "flattenModifiers" lib/dndBeyondCharacterImport.ts` shows only the import, not a definition

### Task 5 — Update all import paths broken by the moves

- [x] Run `grep -rn "from.*dndBeyond-utils" --include="*.ts" .` and audit each result
- [x] For any file importing `isPresent`, `escapeRegExp`, or `ABILITY_KEYS` from `dndBeyond-utils`, update the import path to `./utils` or `../import/utils` as appropriate
- [x] Verify no test file still imports these from `dndBeyond-utils`

### Task 6 — Compile and test

- [x] `tsc --noEmit` — must exit 0
- [x] `npm run test:unit` — all tests must pass

## Validation

- [x] `grep -n "dndBeyondCharacterImport\|DndBeyondModifier" lib/import/utils.ts` returns no results
- [x] `grep -n "^export.*isPresent\|^export.*escapeRegExp\|^export.*ABILITY_KEYS" lib/import/dndBeyond-utils.ts` returns no results
- [x] `grep -n "^export.*flattenModifiers" lib/import/dndBeyond-utils.ts` returns a result
- [x] `grep -n "function flattenModifiers" lib/dndBeyondCharacterImport.ts` returns no results (moved)
- [x] `tsc --noEmit` exits 0
- [x] `npm run test:unit` — all tests pass

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `fix-import-utility-placement` to `main`
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any check fails, diagnose and fix, commit, follow Remote push validation, push; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never force-merge**

Ownership metadata:

- Implementer: (assign on start)
- Reviewer(s): (assign on start)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally (Remote push validation) → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/fix-import-utility-placement/` to `openspec/changes/archive/YYYY-MM-DD-fix-import-utility-placement/` **in a single atomic commit** — stage both the new location and the deletion of the old location together
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-import-utility-placement/` exists and `openspec/changes/fix-import-utility-placement/` is gone
- [ ] Commit and push the archive to `main` in one commit
- [ ] Prune merged local branch: `git fetch --prune` and `git branch -d fix-import-utility-placement`
