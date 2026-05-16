---
name: tests
description: Tests for the extract-generic-import-helpers change
---

# Tests

## Overview

This document outlines the tests for the `extract-generic-import-helpers` change. All work should follow a strict TDD (Test-Driven Development) process. This is a pure structural refactor — no behavior changes are expected, so tests validate correct relocation rather than new behavior.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1: Add helpers to `lib/import/utils.ts`

- [ ] **Test: `dedupeStrings` is exported from `utils.ts`**
  - Import `dedupeStrings` from `lib/import/utils` in a test file
  - Call `dedupeStrings(["a", "b", "a", null, "c", "b"])`
  - Assert result is `["a", "b", "c"]` (falsy filtered, Set dedup)

- [ ] **Test: `titleize` is exported from `utils.ts`**
  - Import `titleize` from `lib/import/utils`
  - Assert `titleize("half-elf")` returns `"Half Elf"`
  - Assert `titleize("warrior_cleric")` returns `"Warrior Cleric"`

- [ ] **Test: `DAMAGE_TYPE_NAMES` is exported from `utils.ts`**
  - Import `DAMAGE_TYPE_NAMES` from `lib/import/utils`
  - Assert it is a readonly Set
  - Assert it contains all 13 canonical types: acid, bludgeoning, cold, fire, force, lightning, necrotic, piercing, poison, psychic, radiant, slashing, thunder

- [ ] **Test: `normalizeModifierCategory` is exported from `utils.ts`**
  - Import `normalizeModifierCategory` from `lib/import/utils`
  - Assert `normalizeModifierCategory("fire-damage")` returns `"fire damage"`
  - Assert `normalizeModifierCategory("piercing")` returns `"piercing"`

- [ ] **Test: `isDamageTypeModifier` is exported from `utils.ts`**
  - Import `isDamageTypeModifier` from `lib/import/utils`
  - Assert `isDamageTypeModifier({ subType: "fire" })` returns `true`
  - Assert `isDamageTypeModifier({ subType: "saving-throws" })` returns `false`
  - Assert `isDamageTypeModifier({ friendlySubtypeName: "Lightning" })` returns `true`
  - Assert `isDamageTypeModifier({ subType: "cold", friendlySubtypeName: "Cold" })` returns `true`

### Task 2: Update imports in `lib/dndBeyondCharacterImport.ts`

- [ ] **Test: Original file imports from `./import/utils`**
  - Check that `lib/dndBeyondCharacterImport.ts` has an import statement for the 5 helpers from `./import/utils`

- [ ] **Test: Character import still works end-to-end**
  - Existing integration tests for D&D Beyond character import pass without modification

### Task 3: Verify no duplicate definitions remain

- [ ] **Test: No local `dedupeStrings` in original file**
  - Search `lib/dndBeyondCharacterImport.ts` for `function dedupeStrings` — should not exist after refactor

- [ ] **Test: No local `titleize` in original file**
  - Search `lib/dndBeyondCharacterImport.ts` for `function titleize` — should not exist after refactor

- [ ] **Test: No local `DAMAGE_TYPE_NAMES` in original file**
  - Search `lib/dndBeyondCharacterImport.ts` for `const DAMAGE_TYPE_NAMES` — should not exist after refactor

- [ ] **Test: No local `isDamageTypeModifier` in original file**
  - Search `lib/dndBeyondCharacterImport.ts` for `function isDamageTypeModifier` — should not exist after refactor

- [ ] **Test: No local `normalizeModifierCategory` in original file**
  - Search `lib/dndBeyondCharacterImport.ts` for `function normalizeModifierCategory` — should not exist after refactor

## Validation Mapping

| Test Case | Validates | Spec Scenario |
|-----------|-----------|---------------|
| `dedupeStrings` export + behavior | Spec: String deduplication | ADDED Generic import helpers module |
| `titleize` export + behavior | Spec: String titleization | ADDED Generic import helpers module |
| `DAMAGE_TYPE_NAMES` export | Spec: Canonical damage type names | ADDED Generic import helpers module |
| `isDamageTypeModifier` export + behavior | Spec: Damage type modifier identification | ADDED Generic import helpers module |
| `normalizeModifierCategory` export + behavior | Spec: Modifier category normalization | ADDED Generic import helpers module |
| Character import integration tests | Spec: No behavior change | All specs |
| No duplicate definitions | Spec: No duplicate definitions | MODIFIED Original file no longer defines generic helpers |

## TDD Notes

Since this is a pure structural refactor with no behavior change, tests in the "verify no duplicate definitions" section will fail BEFORE the implementation (the functions still exist locally) and pass AFTER. Tests in the "export from utils.ts" section will fail before implementation (export doesn't exist) and pass after.

The integration test for character import validates end-to-end behavior is preserved — the most important validation that this remains a no-op refactor.