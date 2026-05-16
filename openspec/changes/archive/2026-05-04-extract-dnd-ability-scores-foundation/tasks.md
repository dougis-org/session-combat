# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/extract-dnd-ability-scores-foundation` then immediately `git push -u origin refactor/extract-dnd-ability-scores-foundation`

## Execution

### 1. Create `lib/import/utils.ts`

- [x] Create `lib/import/utils.ts` exporting `getAbilityModifier` and `getProficiencyBonus`
  - Move `function getAbilityModifier(score: number): number` from `lib/dndBeyondCharacterImport.ts` (line ~983)
  - Move `function getProficiencyBonus(totalLevel: number): number` from `lib/dndBeyondCharacterImport.ts` (line ~979)
  - Both functions are pure math — no imports required

### 2. Create `lib/import/dndBeyond-utils.ts`

- [x] Create `lib/import/dndBeyond-utils.ts` exporting the five DnD Beyond shared helpers
  - Move `const ABILITY_ID_MAP` (line ~31) and `const ABILITY_KEYS` (line ~40) — these depend on `AbilityScores` type from `lib/types.ts`
  - Move `function indexStatValues` (line ~488) — depends on `DndBeyondStatValue` type
  - Move `function resolveAbilityScore` (line ~501) — depends on `AbilityScores`, `createValidationError`
  - Move `function sumModifierBonusesBySubtype` (line ~917) — depends on `DndBeyondModifier` type
  - Add required imports: `AbilityScores` from `lib/types.ts`; DnD Beyond internal types from `lib/dndBeyondCharacterImport.ts` (or wherever they are declared)
  - Note: `resolveAbilityScore` calls `createValidationError` — bring that import too

### 3. Create `lib/import/dndBeyond-ability-scores.ts`

- [x] Create `lib/import/dndBeyond-ability-scores.ts` exporting the three normalizers
  - Move `function normalizeCurrentHp` (lines 391–398)
  - Move `function normalizeAbilityScores` (lines 461–486)
  - Move `function normalizeMaxHp` (lines 579–613)
  - Import `getAbilityModifier` from `lib/import/utils.ts`
  - Import `ABILITY_ID_MAP`, `indexStatValues`, `resolveAbilityScore`, `sumModifierBonusesBySubtype` from `lib/import/dndBeyond-utils.ts`
  - Import any required types (`AbilityScores`, `DndBeyondCharacterData`, `DndBeyondModifier`) from `lib/types.ts` / original file

### 4. Update `lib/dndBeyondCharacterImport.ts` imports

- [x] Remove the local definitions of all extracted functions and constants
- [x] Add imports at the top:
  - `import { getAbilityModifier, getProficiencyBonus } from './import/utils'`
  - `import { ABILITY_ID_MAP, ABILITY_KEYS, indexStatValues, resolveAbilityScore, sumModifierBonusesBySubtype } from './import/dndBeyond-utils'`
  - `import { normalizeAbilityScores, normalizeMaxHp, normalizeCurrentHp } from './import/dndBeyond-ability-scores'`
- [x] Verify no remaining local definitions of the extracted symbols exist in the file

### 5. Verify no breakage in server wrapper

- [x] Open `lib/server/dndBeyondCharacterImport.ts` and confirm it only imports public API functions (`parseDndBeyondCharacterUrl`, `normalizeDndBeyondCharacter`) — no changes needed

## Validation

- [x] `tsc --noEmit` — exits with code 0, no type errors
- [x] `npm test` — all tests pass, zero new failures
- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — build succeeds
- [x] Search `lib/dndBeyondCharacterImport.ts` for `function getAbilityModifier`, `function getProficiencyBonus`, `function normalizeAbilityScores`, `function normalizeMaxHp`, `function normalizeCurrentHp`, `function sumModifierBonusesBySubtype`, `function indexStatValues`, `function resolveAbilityScore`, `const ABILITY_ID_MAP`, `const ABILITY_KEYS` — none should be found (all extracted)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Run the required pre-PR self-review from `skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `refactor/extract-dnd-ability-scores-foundation` to `main` — reference issue #150 in PR body
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] Enable auto-merge: `gh pr merge <PR-URL> --auto --merge`
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously; when any CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated CI + code-review agent
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No documentation updates required (pure structural refactor)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/extract-dnd-ability-scores-foundation/` to `openspec/changes/archive/2026-05-02-extract-dnd-ability-scores-foundation/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [x] Confirm `openspec/changes/archive/2026-05-02-extract-dnd-ability-scores-foundation/` exists and `openspec/changes/extract-dnd-ability-scores-foundation/` is gone
- [x] Commit and push the archive to the default branch in one commit
- [x] Prune merged local feature branches: `git fetch --prune` and `git branch -d refactor/extract-dnd-ability-scores-foundation`
