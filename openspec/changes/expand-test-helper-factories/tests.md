---
name: tests
description: Tests for expand-test-helper-factories
---

# Tests

## Overview

This change restructures test helpers and adds new factory functions. Because the factories themselves are test utilities (not production code), the TDD approach here is: write a test that imports and calls the new factory, confirm it fails (factory doesn't exist yet), implement the factory, confirm it passes.

All existing tests serve as the primary regression harness — they must continue to pass at every step.

## Testing Steps

For each task, follow: write failing test → implement → confirm passing → refactor if needed.

---

## Test Cases

### task-01 — Rename `importTestHelpers.ts` → `open5eTestHelpers.ts`

- [ ] **TC-01a** — Verify no stale import paths exist
  - Spec: `dndbeyond-test-helpers.md` → REMOVED `importTestHelpers.ts` path scenario
  - Command: `grep -rn "importTestHelpers" tests/` must return zero results
  - Linked task: task-01

- [ ] **TC-01b** — Existing Open5E factory exports still resolve
  - Spec: `dndbeyond-test-helpers.md` → "All existing Open5E exports remain available"
  - Run: `npm run test:unit -- --testPathPattern=open5eAdapter` — must pass
  - Linked task: task-01

---

### task-02 — Create `dndBeyondTestHelpers.ts`

- [ ] **TC-02a** — `createModifier("bonus", "armor-class", 2)` returns correct shape
  - Spec: `dndbeyond-test-helpers.md` → "Bonus modifier with value"
  - Assert: `{ type: "bonus", subType: "armor-class", fixedValue: null, value: 2 }`
  - Write this as a unit test in a new `tests/unit/import/dndBeyondTestHelpers.test.ts` before implementing

- [ ] **TC-02b** — `createModifier("set", "unarmored-armor-class", 13)` puts value in `fixedValue`
  - Spec: `dndbeyond-test-helpers.md` → "Set modifier with fixedValue"
  - Assert: `fixedValue: 13, value: null`

- [ ] **TC-02c** — `createModifier("bonus", "armor-class")` with no value returns nulls
  - Spec: `dndbeyond-test-helpers.md` → "Modifier with null value"
  - Assert: `fixedValue: null, value: null`

- [ ] **TC-02d** — `createModifierList(mod1, mod2)` returns array of both
  - Spec: `dndbeyond-test-helpers.md` → "Multiple modifiers"
  - Assert: array length 2, correct contents

- [ ] **TC-02e** — `createModifierList()` with no args returns empty array
  - Spec: `dndbeyond-test-helpers.md` → "Empty modifier list"

---

### task-03 — Create `characterTestHelpers.ts`

- [ ] **TC-03a** — `createAbilityScores()` returns all-10 defaults
  - Spec: `character-test-helpers.md` → "Default ability scores"
  - Write in `tests/unit/import/characterTestHelpers.test.ts` before implementing
  - Assert: `{ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }`

- [ ] **TC-03b** — `createAbilityScores({ dexterity: 17, charisma: 21 })` overrides only supplied fields
  - Spec: `character-test-helpers.md` → "Partial override"
  - Assert: dex 17, cha 21, all others 10

- [ ] **TC-03c** — `createClassEntry("Fighter", 5)` returns correct shape
  - Spec: `character-test-helpers.md` → "Single class entry"
  - Assert: `{ class: "Fighter", level: 5 }`

- [ ] **TC-03d** — `createCharacterData()` returns a valid `ImportedCharacterDraft` with same defaults as old `createImportedCharacterDraft`
  - Spec: `character-test-helpers.md` → "Default character data"
  - Assert: spot-check key fields (name, hp, abilityScores, classes)

- [ ] **TC-03e** — `createCharacterData({ name: "Thorn", hp: 50 })` merges overrides
  - Spec: `character-test-helpers.md` → "Partial override"
  - Assert: name "Thorn", hp 50, other fields at defaults

---

### task-04 — Update `dndBeyondImport.ts`

- [ ] **TC-04a** — `createImportedCharacterDraft` still callable from `dndBeyondImport.ts` (backward compat)
  - Spec: `character-test-helpers.md` → "Backward-compatible re-export"
  - Run: `npm run test:unit -- --testPathPattern=dndBeyondCharacterImport` — must pass

- [ ] **TC-04b** — `createNormalizedImportResult` still works after the move
  - Run: `npm run test:unit -- --testPathPattern=characterImportRoute` — must pass

---

### task-05 — Update `testFactories.ts`

- [ ] **TC-05a** — All new factories importable from `testFactories.ts`
  - Spot-check: import `createAbilityScores`, `createModifier`, `createCharacterData` from `@/tests/unit/import/testFactories` in a test — all resolve without error

---

### task-06 — Replace inline modifier arrays in `dndBeyond-armor-class.test.ts`

- [ ] **TC-06a** — No `MockDndBeyondModifier[]` literals remain
  - Command: `grep "MockDndBeyondModifier\[\]" tests/unit/import/dndBeyond-armor-class.test.ts` returns zero results
  - Spec: `dndbeyond-test-helpers.md` → "No inline modifier arrays remain"

- [ ] **TC-06b** — All armor class tests still pass
  - Run: `npm run test:unit -- --testPathPattern=dndBeyond-armor-class` — must pass

---

### task-07 — Replace inline `baseAbilityScores`

- [ ] **TC-07a** — No inline `baseAbilityScores =` declarations remain
  - Command: `grep -rn "baseAbilityScores\s*=" tests/unit/import/` returns zero results

- [ ] **TC-07b** — All affected test files still pass
  - Run: `npm run test:unit` — must pass

---

### task-08 — ADR in `openspec/specs/`

- [ ] **TC-08a** — ADR file exists at expected path
  - Command: `ls openspec/specs/adr-test-helper-layers.md` — file found
  - Spec: `adr-test-helper-layers.md` → "ADR is discoverable"

---

### Regression gate (all tasks)

- [ ] **TC-REG-01** — Full unit suite passes: `npm run test:unit`
- [ ] **TC-REG-02** — TypeScript compiles clean: `tsc --noEmit`
- [ ] **TC-REG-03** — Build succeeds: `npm run build`
