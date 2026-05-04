---
name: tests
description: Tests for extract-dnd-ability-scores-foundation
---

# Tests

## Overview

This is a pure no-op structural refactor. The primary validation strategy is:

1. **Compilation** — TypeScript must compile cleanly (`tsc --noEmit`)
2. **Existing tests** — All existing tests for `dndBeyondCharacterImport` must pass without modification
3. **No-duplication check** — Extracted symbols must not be defined in both old and new locations

No new test files need to be created. The existing test suite is the oracle for behavioral correctness.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** For this refactor, "failing" means: confirm the symbol does NOT yet exist at its new path before moving it (e.g., `import { getAbilityModifier } from '../import/utils'` fails compilation before the file is created).
2. **Write code to pass the test:** Create the new file with the extracted symbol.
3. **Refactor:** Remove the original definition and verify compilation still passes.

## Test Cases

### Task 1 — Create `lib/import/utils.ts`

- [ ] **T1.1** `lib/import/utils.ts` exports `getAbilityModifier`
  - Spec: `specs/import-utils/spec.md` — Scenario: Ability modifier calculation
  - Verify: `tsc --noEmit` passes after creation; `getAbilityModifier(10)` returns `0`, `getAbilityModifier(20)` returns `5`, `getAbilityModifier(8)` returns `-1`

- [ ] **T1.2** `lib/import/utils.ts` exports `getProficiencyBonus`
  - Spec: `specs/import-utils/spec.md` — Scenario: Proficiency bonus calculation
  - Verify: `getProficiencyBonus(1)` returns `2`; `getProficiencyBonus(5)` returns `3`; `getProficiencyBonus(9)` returns `4`; `getProficiencyBonus(17)` returns `6`

- [ ] **T1.3** `lib/import/utils.ts` has no DnD Beyond-specific imports
  - Spec: `specs/import-utils/spec.md` — Scenario: No DnD Beyond types in signature
  - Verify: File contains no import from `lib/dndBeyondCharacterImport.ts` or `lib/import/dndBeyond-utils.ts`

### Task 2 — Create `lib/import/dndBeyond-utils.ts`

- [ ] **T2.1** `lib/import/dndBeyond-utils.ts` exports `ABILITY_ID_MAP` mapping 1–6 to ability names
  - Spec: `specs/dndBeyond-utils/spec.md` — Scenario: ABILITY_ID_MAP is accessible
  - Verify: `ABILITY_ID_MAP[1] === 'strength'`, `ABILITY_ID_MAP[6] === 'charisma'`

- [ ] **T2.2** `lib/import/dndBeyond-utils.ts` exports `sumModifierBonusesBySubtype`
  - Spec: `specs/dndBeyond-utils/spec.md` — Scenario: sumModifierBonusesBySubtype aggregates correctly
  - Verify: Calling it through `normalizeAbilityScores` produces the same result as before extraction (covered by existing tests)

- [ ] **T2.3** `lib/import/dndBeyond-utils.ts` does not import from `lib/import/dndBeyond-ability-scores.ts` or `lib/dndBeyondCharacterImport.ts`
  - Spec: `specs/dndBeyond-utils/spec.md` — Scenario: Import direction is one-way
  - Verify: Manual inspection of import statements in the new file

### Task 3 — Create `lib/import/dndBeyond-ability-scores.ts`

- [ ] **T3.1** `lib/import/dndBeyond-ability-scores.ts` exports `normalizeAbilityScores`, `normalizeMaxHp`, `normalizeCurrentHp`
  - Spec: `specs/dndBeyond-ability-scores-extraction/spec.md` — Scenarios: each normalizer is exported
  - Verify: `tsc --noEmit` passes; existing character import tests exercise these through the public API

- [ ] **T3.2** `normalizeCurrentHp` clamps to `[0, maxHp]`
  - Spec: `specs/dndBeyond-ability-scores-extraction/spec.md` — Scenario: normalizeCurrentHp is exported
  - Verify: Covered by existing unit tests (no new test needed — behavioral parity confirmed by test suite passing)

- [ ] **T3.3** Imports from `lib/import/utils.ts` and `lib/import/dndBeyond-utils.ts` — not inline definitions
  - Spec: `specs/dndBeyond-ability-scores-extraction/spec.md` — Scenario: Dependencies are imported from the correct foundation modules
  - Verify: File contains `from './utils'` and `from './dndBeyond-utils'`; no inline definitions of `getAbilityModifier`, `sumModifierBonusesBySubtype`, etc.

### Task 4 — Update `lib/dndBeyondCharacterImport.ts`

- [ ] **T4.1** Original file no longer defines any extracted symbol
  - Spec: All three specs — MODIFIED / REMOVED scenarios
  - Verify: `grep -n "function getAbilityModifier\|function getProficiencyBonus\|function normalizeAbilityScores\|function normalizeMaxHp\|function normalizeCurrentHp\|function sumModifierBonusesBySubtype\|function indexStatValues\|function resolveAbilityScore\|const ABILITY_ID_MAP\|const ABILITY_KEYS" lib/dndBeyondCharacterImport.ts` returns no matches

- [ ] **T4.2** All existing tests pass after import update
  - Spec: `specs/dndBeyond-ability-scores-extraction/spec.md` — Scenario: Existing character import behavior is preserved end-to-end
  - Verify: `npm test` exits 0 with no new failures

### Task 5 — Full suite validation

- [ ] **T5.1** `tsc --noEmit` exits 0
- [ ] **T5.2** `npm test` exits 0
- [ ] **T5.3** `npm run test:integration` exits 0
- [ ] **T5.4** `npm run build` exits 0
