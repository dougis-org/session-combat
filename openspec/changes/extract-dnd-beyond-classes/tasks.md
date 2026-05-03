# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-dnd-beyond-classes` then immediately `git push -u origin refactor/extract-dnd-beyond-classes`

## Execution

### 1. Verify `createValidationError` exists in `dndBeyond-utils.ts`

- [x] Open `lib/import/dndBeyond-utils.ts`
- [x] Confirm `createValidationError` is already exported there (extracted in issue 150)
- [x] If not present, add the function to `dndBeyond-utils.ts` before proceeding

### 2. Create `lib/import/dndBeyond-classes.ts`

- [x] Create `lib/import/dndBeyond-classes.ts` exporting `normalizeClasses`, `normalizeClassEntry`, `normalizeRace`
- [x] Move `function normalizeClasses` (lines 407–434 from `lib/dndBeyondCharacterImport.ts`)
  - Imports: `CharacterClass` from `lib/types.ts`; `isPresent` from `lib/import/dndBeyond-utils.ts`; `createValidationError` from `lib/import/dndBeyond-utils.ts`
- [x] Move `function normalizeClassEntry` (lines 436–455 from `lib/dndBeyondCharacterImport.ts`)
  - Imports: `DnDClass`, `VALID_CLASSES` from `lib/types.ts`
- [x] Move `function normalizeRace` (lines 457–499 from `lib/dndBeyondCharacterImport.ts`)
  - Imports: `DnDRace`, `VALID_RACES` from `lib/types.ts`
- [x] Import `isPresent` from `lib/import/dndBeyond-utils.ts`
- [x] Import `createValidationError` from `lib/import/dndBeyond-utils.ts`
- [x] Import `DnDClass`, `DnDRace`, `VALID_CLASSES`, `VALID_RACES`, `CharacterClass` from `lib/types.ts`

### 3. Update `lib/dndBeyondCharacterImport.ts` imports

- [x] Remove the local definitions of `normalizeClasses`, `normalizeClassEntry`, and `normalizeRace`
- [x] Add import: `import { normalizeClasses, normalizeClassEntry, normalizeRace } from './import/dndBeyond-classes'`
- [x] Verify no remaining local definitions of the extracted functions exist in the file

### 4. Verify server wrapper is unaffected

- [x] Open `lib/server/dndBeyondCharacterImport.ts`
- [x] Confirm it only imports public API functions (`parseDndBeyondCharacterUrl`, `normalizeDndBeyondCharacter`) — no changes needed

## Validation

- [x] `tsc --noEmit` — exits with code 0, no type errors
- [x] `npm test` — all tests pass, zero new failures
- [ ] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — build succeeds
- [x] Search `lib/dndBeyondCharacterImport.ts` for `function normalizeClasses`, `function normalizeClassEntry`, `function normalizeRace` — none should be found (all extracted)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `refactor/extract-dnd-beyond-classes` to `main` — reference issue #151 in PR body
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates required (pure structural refactor)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/extract-dnd-beyond-classes/` to `openspec/changes/archive/YYYY-MM-DD-extract-dnd-beyond-classes/` and stage both the new location and the deletion of the old location in a single commit
- [ ] Confirm archive exists and active change directory is gone
- [ ] Commit and push the archive to the default branch in one commit
- [ ] Prune merged local feature branches: `git fetch --prune` and `git branch -d refactor/extract-dnd-beyond-classes`

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + code-review agent
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved