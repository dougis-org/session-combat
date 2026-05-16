# Tests

## Overview

This is a pure no-op structural refactor. The primary validation strategy is:

1. **Compilation** — TypeScript must compile cleanly (`tsc --noEmit`)
2. **Existing tests** — All existing tests for `dndBeyondCharacterImport` must pass without modification
3. **No-duplication check** — Extracted symbols must not be defined in both old and new locations

No new test files need to be created. The existing test suite is the oracle for behavioral correctness.

## Testing Steps

For each task in `tasks.md`:

1. **Verify new import fails first:** Before creating the new file, confirm `import { normalizeClasses } from './import/dndBeyond-classes'` does not exist (compilation error expected).
2. **Create the new file** with the extracted functions.
3. **Update imports in original file** and verify compilation passes.
4. **Remove original definitions** and confirm no duplication.

## Test Cases

### Task 1 — Verify `createValidationError` exists in `dndBeyond-utils.ts`

- [ ] **T1.1** `lib/import/dndBeyond-utils.ts` exports `createValidationError`
  - Verify: File contains `export function createValidationError`

### Task 2 — Create `lib/import/dndBeyond-classes.ts`

- [ ] **T2.1** `lib/import/dndBeyond-classes.ts` exports `normalizeClasses`
  - Spec: `specs/dndBeyond-classes-extraction/spec.md` — Scenario: normalizeClasses is exported
  - Verify: `tsc --noEmit` passes after creation; function is callable from new path

- [ ] **T2.2** `lib/import/dndBeyond-classes.ts` exports `normalizeClassEntry`
  - Spec: `specs/dndBeyond-classes-extraction/spec.md` — Scenario: normalizeClassEntry is exported
  - Verify: `tsc --noEmit` passes after creation

- [ ] **T2.3** `lib/import/dndBeyond-classes.ts` exports `normalizeRace`
  - Spec: `specs/dndBeyond-classes-extraction/spec.md` — Scenario: normalizeRace is exported
  - Verify: `tsc --noEmit` passes after creation

- [ ] **T2.4** Imports from correct modules
  - Spec: `specs/dndBeyond-classes-extraction/spec.md` — Scenario: Dependencies are imported from the correct foundation modules
  - Verify: File contains `from '../import/dndBeyond-utils'` for `isPresent` and `createValidationError`; `from '../types'` for `VALID_CLASSES`, `VALID_RACES`, `DnDClass`, `DnDRace`, `CharacterClass`

- [ ] **T2.5** No duplicate definitions of extracted functions in new file
  - Verify: File does not re-define functions that exist in `dndBeyond-utils.ts`

### Task 3 — Update `lib/dndBeyondCharacterImport.ts`

- [ ] **T3.1** Original file no longer defines any extracted symbol
  - Spec: `specs/dndBeyond-classes-extraction/spec.md` — Scenario: No duplicate definitions in original file
  - Verify: `grep -n "function normalizeClasses\|function normalizeClassEntry\|function normalizeRace" lib/dndBeyondCharacterImport.ts` returns no matches

- [ ] **T3.2** All existing tests pass after import update
  - Spec: `specs/dndBeyond-classes-extraction/spec.md` — Scenario: Existing character import behavior is preserved end-to-end
  - Verify: `npm test` exits 0 with no new failures

### Task 4 — Verify server wrapper is unaffected

- [ ] **T4.1** Server import file requires no changes
  - Verify: `lib/server/dndBeyondCharacterImport.ts` imports only `parseDndBeyondCharacterUrl` and `normalizeDndBeyondCharacter`

### Task 5 — Full suite validation

- [ ] **T5.1** `tsc --noEmit` exits 0
- [ ] **T5.2** `npm test` exits 0
- [ ] **T5.3** `npm run test:integration` exits 0
- [ ] **T5.4** `npm run build` exits 0
