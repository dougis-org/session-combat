# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/validation-core-156` then immediately `git push -u origin refactor/validation-core-156`
- [x] Grep all import sites for `ValidationError` and `ValidationResult` to confirm no consumer beyond `monsterUpload.ts` exists: `grep -r "from.*monsterUpload" --include="*.ts" .`
- [x] Confirm `validateStringNumberRecord` has zero callers: `grep -r "validateStringNumberRecord" --include="*.ts" .`

## Execution

### E1 — Create `lib/validation/core.ts`

- [x] Create `lib/validation/core.ts`
- [x] Move and export `ValidationError` and `ValidationResult` type definitions
- [x] Move and export `validateString` — apply trim fix: trim leading/trailing whitespace before `minLength` check; return trimmed string as `value`
- [x] Move and export `validateNumber`
- [x] Move and export `validateStringArray`
- [x] Move and export `validateRecord<T>`
- [x] Move and export `validateStringRecord`
- [x] Move and export `validateNumberRecord`
- [x] Do NOT include `validateStringNumberRecord` (deleted)

### E2 — Create `lib/validation/dnd.ts`

- [x] Create `lib/validation/dnd.ts`
- [x] Import `validateString`, `validateNumber` from `./core`
- [x] Move and export `validateAbilityScores`
- [x] Move and export `validateAbility`
- [x] Move and export `validateAbilityArray`

### E3 — Write tests before refactoring `monsterUpload.ts`

- [x] Create `tests/unit/validation/core.test.ts` — unit tests for all exports in `core.ts`:
  - `validateString`: valid, required missing, wrong type, trim scenarios (padded pass, whitespace-only fail, interior space preserved)
  - `validateNumber`: valid, required missing, below min, above max, non-finite
  - `validateStringArray`: valid, null/undefined → empty, non-array, non-string element
  - `validateRecord`: valid, null/undefined → empty, non-object, invalid value type
  - `validateStringRecord`: valid, invalid value type
  - `validateNumberRecord`: valid, invalid value type
- [x] Create `tests/unit/validation/dnd.test.ts` — unit tests for all exports in `dnd.ts`:
  - `validateAbilityScores`: valid full set, missing key, score < 1, score > 30, non-object input
  - `validateAbility`: valid with required fields only, valid with all optional fields, missing name, missing description, non-object input
  - `validateAbilityArray`: valid array, null/undefined → empty, non-array, array with invalid element
- [x] Run new tests — expect failures (modules not yet imported by consumers)

### E4 — Refactor `lib/validation/monsterUpload.ts`

- [x] Remove all private helper function definitions (`validateString`, `validateNumber`, `validateAbilityScores`, `validateStringArray`, `validateRecord`, `validateStringRecord`, `validateNumberRecord`, `validateStringNumberRecord`, `validateAbility`, `validateAbilityArray`)
- [x] Add imports: `import { ValidationError, ValidationResult, validateString, validateNumber, validateStringArray, validateNumberRecord, validateStringRecord } from './core'`
- [x] Add imports: `import { validateAbilityScores, validateAbility, validateAbilityArray } from './dnd'`
- [x] Re-export types for backward compatibility: `export type { ValidationError, ValidationResult } from './core'`
- [x] Refactor `validateMonsterData` inline scalar checks to use helpers:
  - `name` — use `validateString(data.name, ..., { required: true, minLength: 1 })`
  - `maxHp` — use `validateNumber(data.maxHp, ..., { required: true, min: 1 })`
  - `hp` — use `validateNumber` for type check; keep `hp ≤ maxHp` cross-field check inline
  - `ac` — use `validateNumber(data.ac, ..., { min: 0, max: 30 })`
  - `type` — use `validateString(data.type, ..., { minLength: 1 })`
  - `challengeRating` — use `validateNumber(data.challengeRating, ..., { min: 0 })`
  - Keep `size` enum check inline (no helper for enum validation)
  - Keep `legendaryActionCount` integer check inline (no helper for integer validation)

## Validation

- [x] `npx tsc --noEmit` — zero errors
- [x] `jest tests/unit/validation/` — all new tests pass
- [x] `jest tests/unit/monster-upload/` — all existing tests pass unchanged
- [x] Confirm `validateStringNumberRecord` is gone: `grep -r "validateStringNumberRecord" --include="*.ts" .` returns nothing
- [x] Confirm no private helper definitions remain in `monsterUpload.ts`: review file manually
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `jest tests/unit/` — all tests pass
- **Integration tests** — `jest --config jest.integration.config.js` — all tests pass
- **Build** — `npm run build` — succeeds with no errors
- **Type check** — `npx tsc --noEmit` — zero errors

If **ANY** of the above fail, diagnose and fix before pushing.

## PR and Merge

- [x] Run pre-PR self-review per `openspec/changes/refactor-validation-core-156/` checklist
- [x] Commit all changes and push to `refactor/validation-core-156`
- [x] Open PR from `refactor/validation-core-156` to `main` — title: `refactor: Extract validation core and dnd layers (#156)`
- [x] Wait 120 seconds for agentic reviewers
- [x] **Monitor PR comments** — address each comment, commit, validate locally (run all validation commands above), push; repeat until no unresolved comments remain
- [x] Enable auto-merge once no blocking review comments remain
- [x] **Monitor CI checks** — fix any failure, commit, validate locally, push; repeat until all checks pass
- [x] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic review + human
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → run all validation commands → push → re-run checks
- Security finding → remediate → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify `lib/validation/core.ts` and `lib/validation/dnd.ts` appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] No external documentation impacted (no user-facing behaviour changed)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec) if applicable
- [x] Archive: move `openspec/changes/refactor-validation-core-156/` to `openspec/changes/archive/YYYY-MM-DD-refactor-validation-core-156/` — stage both new location and deletion in a single commit
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-refactor-validation-core-156/` exists and `openspec/changes/refactor-validation-core-156/` is gone
- [x] Commit and push archive to `main`
- [x] `git fetch --prune` and `git branch -d refactor/validation-core-156`
