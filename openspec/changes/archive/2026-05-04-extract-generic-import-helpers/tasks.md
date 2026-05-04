# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b extract-generic-import-helpers` then immediately `git push -u origin extract-generic-import-helpers`

## Execution

- [x] **Task 1 — Add helpers to `lib/import/utils.ts`**
  - Copy `dedupeStrings` function (lines 763-764 in `lib/dndBeyondCharacterImport.ts`) to `lib/import/utils.ts`
  - Copy `titleize` function (lines 756-761 in `lib/dndBeyondCharacterImport.ts`) to `lib/import/utils.ts`
  - Copy `DAMAGE_TYPE_NAMES` constant (lines 52-66 in `lib/dndBeyondCharacterImport.ts`) to `lib/import/utils.ts`
  - Copy `normalizeModifierCategory` function (lines 612-614 in `lib/dndBeyondCharacterImport.ts`) to `lib/import/utils.ts`
  - Copy `isDamageTypeModifier` function (lines 606-610 in `lib/dndBeyondCharacterImport.ts`) to `lib/import/utils.ts`
  - Import `DndBeyondModifier` type from `../dndBeyondCharacterImport` in `utils.ts` for the `isDamageTypeModifier` signature
  - Export all 5 new functions/constants as named exports

- [x] **Task 2 — Update imports in `lib/dndBeyondCharacterImport.ts`**
  - Add import for `dedupeStrings`, `titleize`, `DAMAGE_TYPE_NAMES`, `isDamageTypeModifier`, `normalizeModifierCategory` from `./import/utils`
  - Remove local definitions of all 5 helpers from the file
  - Verify file still compiles with `tsc --noEmit`

- [x] **Task 3 — Verify no duplicate definitions remain**
  - Search `lib/dndBeyondCharacterImport.ts` for `function dedupeStrings`, `function titleize`, `const DAMAGE_TYPE_NAMES`, `function isDamageTypeModifier`, `function normalizeModifierCategory`
  - Confirm none exist (only imports should reference them)

## Validation

- [x] Run unit tests: `npm test`
- [x] Run integration tests: `npm run test:integration`
- [x] Run type checks: `tsc --noEmit`
- [x] Run build: `npm run build` (if applicable)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — `npm run test:e2e` (if applicable); all tests must pass
- **Build** — `npm run build` (if applicable); build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: AI agent (via openspec-apply-change)
- Reviewer(s): dougis
- Required approvals: 1

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
- [ ] Archive the change: move `openspec/changes/extract-generic-import-helpers/` to `openspec/changes/archive/YYYY-MM-DD-extract-generic-import-helpers/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-generic-import-helpers/` exists and `openspec/changes/extract-generic-import-helpers/` is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d extract-generic-import-helpers`

Required cleanup after archive: `git fetch --prune` and `git branch -d extract-generic-import-helpers`