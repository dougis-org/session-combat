---
name: tests
description: Tests for fix-import-utility-placement
---

# Tests

## Overview

This change is purely a code relocation — no runtime behavior changes. Tests confirm: (1) symbols are importable from their new locations, (2) symbols are absent from their old locations, (3) all existing behavior still passes. Follow strict TDD: write/update the import-path tests first, verify they fail, then make the moves.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before moving any symbol, write a test that imports it from its new location. Run the test and confirm it fails (symbol not yet there).
2. **Write code to pass the test:** Move the symbol to the new location.
3. **Refactor:** Run `tsc --noEmit` and `npm test` to confirm nothing regressed.

## Test Cases

### Task 1 — `ModifierLike` interface and updated `isDamageTypeModifier` in `utils.ts`

- [ ] **Import compiles from `utils.ts`:** `import { ModifierLike, isDamageTypeModifier } from "lib/import/utils"` compiles without error
  - Spec ref: `specs/import-utils/spec.md` — "ModifierLike interface exported from utils.ts"
- [ ] **No DnD Beyond import in `utils.ts`:** After the change, `grep "dndBeyondCharacterImport\|DndBeyondModifier" lib/import/utils.ts` returns empty
  - Spec ref: `specs/import-utils/spec.md` — "MODIFIED isDamageTypeModifier parameter type"
- [ ] **`DndBeyondModifier` satisfies `ModifierLike` structurally:** existing call sites in `lib/dndBeyondCharacterImport.ts` that pass a `DndBeyondModifier` to `isDamageTypeModifier` compile without any cast
  - Spec ref: `specs/import-utils/spec.md` — "DndBeyondModifier satisfies ModifierLike structurally"

### Task 2 — `isPresent`, `escapeRegExp`, `ABILITY_KEYS` in `utils.ts`

- [ ] **`isPresent` importable from `utils.ts`:** `import { isPresent } from "lib/import/utils"` compiles; `isPresent(null)` returns `false`; `isPresent("x")` returns `true`
  - Spec ref: `specs/import-utils/spec.md` — "isPresent<T>() exported from utils.ts"
- [ ] **`escapeRegExp` importable from `utils.ts`:** `import { escapeRegExp } from "lib/import/utils"` compiles; `escapeRegExp("a.b*c")` returns `"a\\.b\\*c"`
  - Spec ref: `specs/import-utils/spec.md` — "escapeRegExp() exported from utils.ts"
- [ ] **`ABILITY_KEYS` importable from `utils.ts` with correct values:** `import { ABILITY_KEYS } from "lib/import/utils"` compiles; value is `["strength","dexterity","constitution","intelligence","wisdom","charisma"]` with length 6
  - Spec ref: `specs/import-utils/spec.md` — "ABILITY_KEYS exported from utils.ts"

### Task 3 — Removal from `dndBeyond-utils.ts`

- [ ] **`isPresent` not exported from `dndBeyond-utils.ts`:** `grep "^export.*isPresent" lib/import/dndBeyond-utils.ts` returns empty
  - Spec ref: `specs/dndBeyond-utils/spec.md` — "REMOVED isPresent, escapeRegExp, ABILITY_KEYS from dndBeyond-utils.ts"
- [ ] **`escapeRegExp` not exported from `dndBeyond-utils.ts`:** `grep "^export.*escapeRegExp" lib/import/dndBeyond-utils.ts` returns empty
- [ ] **`ABILITY_KEYS` not exported from `dndBeyond-utils.ts`:** `grep "^export.*ABILITY_KEYS" lib/import/dndBeyond-utils.ts` returns empty
- [ ] **Existing files that used these symbols still compile:** `tsc --noEmit` exits 0 after import paths are updated in Task 5

### Task 4 — `flattenModifiers` moved to `dndBeyond-utils.ts`

- [ ] **`flattenModifiers` exported from `dndBeyond-utils.ts`:** `grep "^export.*flattenModifiers" lib/import/dndBeyond-utils.ts` returns a result
  - Spec ref: `specs/dndBeyond-utils/spec.md` — "flattenModifiers() exported from dndBeyond-utils.ts"
- [ ] **`flattenModifiers` no longer defined in `dndBeyondCharacterImport.ts`:** `grep "function flattenModifiers" lib/dndBeyondCharacterImport.ts` returns empty
  - Spec ref: `specs/dndBeyond-utils/spec.md` — "REMOVED flattenModifiers as private function in dndBeyondCharacterImport.ts"
- [ ] **Orchestrator still imports `flattenModifiers`:** `grep "flattenModifiers" lib/dndBeyondCharacterImport.ts` shows an import from `./import/dndBeyond-utils`

### Task 5 — Import path updates

- [ ] **No remaining imports of `isPresent`/`escapeRegExp`/`ABILITY_KEYS` from `dndBeyond-utils`:** `grep -rn "from.*dndBeyond-utils.*isPresent\|from.*dndBeyond-utils.*escapeRegExp\|from.*dndBeyond-utils.*ABILITY_KEYS" --include="*.ts" .` returns empty

### Task 6 — Compile and test (applies after all moves)

- [ ] **TypeScript compiles cleanly:** `tsc --noEmit` exits 0 with no errors
  - Spec ref: both specs — "TypeScript strict compile"
- [ ] **All existing tests pass:** `npm test` produces identical pass/fail counts to pre-change baseline
  - Spec ref: both specs — "Existing tests unaffected"
