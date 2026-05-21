---
name: tests
description: Tests for refactor-validation-core-156
---

# Tests

## Overview

Tests for the `refactor-validation-core-156` change. Follow strict TDD: write failing tests first (E3 in tasks.md), then implement `core.ts` and `dnd.ts`, then refactor `monsterUpload.ts` against the green suite.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** before writing any implementation code. Run it and confirm it fails.
2. **Write the simplest code** to make the test pass.
3. **Refactor** while keeping tests green.

---

## Test Cases — `tests/unit/validation/core.test.ts`

Mapped to task **E3** and specs `specs/core-validators/spec.md`.

### `validateString`

- [ ] Valid string returns `{ valid: true, value: "goblin" }`
  - Spec: Scenario "valid string"
- [ ] `undefined` with `required: true` returns `{ valid: false }` with field in error
  - Spec: Scenario "required field missing"
- [ ] `undefined` without `required` returns `{ valid: true, value: "" }`
- [ ] Non-string value (e.g. `42`) returns `{ valid: false }` with type message
  - Spec: Scenario "wrong type"
- [ ] `"  ab  "` with `minLength: 2` returns `{ valid: true, value: "ab" }` (trim fix)
  - Spec: Scenario "leading/trailing whitespace passes after trim"
- [ ] `"   "` with `minLength: 1` returns `{ valid: false }` (whitespace-only fails after trim)
  - Spec: Scenario "whitespace-only string fails minLength after trim"
- [ ] `"  hello world  "` returns `{ valid: true, value: "hello world" }` (interior space preserved)
  - Spec: Scenario "interior whitespace is preserved"
- [ ] String shorter than `minLength` (no whitespace) returns `{ valid: false }`

### `validateNumber`

- [ ] Valid number `10` returns `{ valid: true, value: 10 }`
  - Spec: Scenario "valid number"
- [ ] `undefined` with `required: true` returns `{ valid: false }`
  - Spec: Scenario "required field missing"
- [ ] `undefined` without `required` returns `{ valid: true, value: 0 }`
- [ ] Non-number (string `"ten"`) returns `{ valid: false }` with type message
- [ ] `Infinity` returns `{ valid: false }` (non-finite)
  - Spec: Scenario "non-finite value"
- [ ] Value below `min` returns `{ valid: false }` with message "must be at least N"
  - Spec: Scenario "below minimum"
- [ ] Value above `max` returns `{ valid: false }` with message "must be at most N"

### `validateStringArray`

- [ ] Valid `["Common", "Elvish"]` returns `{ valid: true, value: ["Common", "Elvish"] }`
  - Spec: Scenario "valid array"
- [ ] `undefined` returns `{ valid: true, value: [] }`
  - Spec: Scenario "null/undefined defaults to empty"
- [ ] `null` returns `{ valid: true, value: [] }`
- [ ] Non-array (string `"Common"`) returns `{ valid: false }`
- [ ] Array with non-string element `["Common", 42]` returns `{ valid: false }` with `index: 1`
  - Spec: Scenario "non-string element"

### `validateRecord<T>`

- [ ] Valid `{ a: "x", b: "y" }` with string predicate returns `{ valid: true, value: { a: "x", b: "y" } }`
- [ ] `undefined` returns `{ valid: true, value: {} }`
- [ ] Non-object (array `[]`) returns `{ valid: false }`
- [ ] Object with invalid value returns `{ valid: false }` with field key in error

### `validateStringRecord`

- [ ] Valid `{ darkvision: "60 ft." }` returns `{ valid: true, value: { darkvision: "60 ft." } }`
- [ ] Object with numeric value `{ darkvision: 60 }` returns `{ valid: false }`
  - Spec: Scenario "non-string value in record"

### `validateNumberRecord`

- [ ] Valid `{ strength: 2 }` returns `{ valid: true, value: { strength: 2 } }`
  - Spec: Scenario "valid record"
- [ ] Object with string value `{ strength: "high" }` returns `{ valid: false }`

---

## Test Cases — `tests/unit/validation/dnd.test.ts`

Mapped to task **E3** and specs `specs/dnd-validators/spec.md`.

### `validateAbilityScores`

- [ ] Valid full set of six scores returns `{ valid: true, value: <scores> }`
  - Spec: Scenario "valid ability scores"
- [ ] Missing `charisma` returns `{ valid: false }` with field `"abilityScores.charisma"`
  - Spec: Scenario "missing ability score key"
- [ ] `strength: 0` (below min) returns `{ valid: false }` with field `"abilityScores.strength"`
  - Spec: Scenario "score below minimum"
- [ ] `strength: 31` (above max) returns `{ valid: false }` with field `"abilityScores.strength"`
  - Spec: Scenario "score above maximum"
- [ ] Non-object input returns `{ valid: false }` with message "abilityScores must be an object"
  - Spec: Scenario "non-object input"
- [ ] `null` input returns `{ valid: false }`

### `validateAbility`

- [ ] `{ name: "Multiattack", description: "Two attacks." }` returns `{ valid: true }`
  - Spec: Scenario "valid ability with required fields only"
- [ ] Missing `name` returns `{ valid: false }` with field containing `"name"`
  - Spec: Scenario "missing name"
- [ ] Missing `description` returns `{ valid: false }` with field containing `"description"`
  - Spec: Scenario "missing description"
- [ ] Non-object input returns `{ valid: false }` with message "ability must be an object"
  - Spec: Scenario "non-object input"
- [ ] Object with all optional fields (`attackBonus`, `saveDC`, `saveType`, `recharge`, `damageDescription`) returns `{ valid: true }` with those fields in `value`

### `validateAbilityArray`

- [ ] `[{ name: "Bite", description: "Melee." }]` returns `{ valid: true, value: [<ability>] }`
  - Spec: Scenario "valid array of abilities"
- [ ] `undefined` returns `{ valid: true, value: [] }`
  - Spec: Scenario "null/undefined defaults to empty array"
- [ ] Non-array `"not an array"` returns `{ valid: false }` with message containing "must be an array"
  - Spec: Scenario "non-array input"
- [ ] Array with second element missing `description` returns `{ valid: false }` with field `"actions[1].description"`
  - Spec: Scenario "array with invalid element"

---

## Test Cases — Regression: `tests/unit/monster-upload/`

Mapped to task **E4** and spec `specs/monster-upload-refactor/spec.md`.

- [ ] Run `jest tests/unit/monster-upload/` after E4 — all tests pass with zero modifications to test files
  - Spec: Scenario "existing monster-upload test suite passes unchanged"
- [ ] `validateMonsterData({ name: "   ", maxHp: 7 })` returns `{ valid: false }` (trim fix propagates through helper)
  - Spec: Scenario "monster with whitespace-only name fails"
- [ ] `validateMonsterData({ name: "Goblin", maxHp: 7 })` returns `{ valid: true }`
  - Spec: Scenario "monster with valid name and maxHp validates successfully"
