## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `lib/validation/dnd.ts` module

The system SHALL provide a `lib/validation/dnd.ts` module exporting `validateAbilityScores`, `validateAbility`, and `validateAbilityArray`. These validators SHALL be importable independently of `lib/validation/monsterUpload.ts`.

#### Scenario: Import D&D validators without importing monsterUpload

- **Given** a TypeScript file importing from `@/lib/validation/dnd`
- **When** the file is compiled
- **Then** all three named exports resolve without type errors and without pulling in any `monsterUpload` dependency

### Requirement: ADDED `validateAbilityScores` validator

The system SHALL validate that an ability scores object contains all six D&D ability score keys (`strength`, `dexterity`, `constitution`, `intelligence`, `wisdom`, `charisma`) each with a numeric value in the range 1–30.

#### Scenario: Valid ability scores

- **Given** `{ strength: 10, dexterity: 14, constitution: 12, intelligence: 8, wisdom: 16, charisma: 10 }`
- **When** `validateAbilityScores(value)` is called
- **Then** it returns `{ valid: true, value: <the object> }`

#### Scenario: Missing ability score key

- **Given** an object with only five of the six keys (e.g., `charisma` absent)
- **When** `validateAbilityScores(value)` is called
- **Then** it returns `{ valid: false, error: { field: "abilityScores.charisma" } }`

#### Scenario: Score below minimum (< 1)

- **Given** `{ ..., strength: 0 }`
- **When** `validateAbilityScores(value)` is called
- **Then** it returns `{ valid: false, error: { field: "abilityScores.strength" } }`

#### Scenario: Score above maximum (> 30)

- **Given** `{ ..., strength: 31 }`
- **When** `validateAbilityScores(value)` is called
- **Then** it returns `{ valid: false, error: { field: "abilityScores.strength" } }`

#### Scenario: Non-object input

- **Given** the value `"high"` (a string)
- **When** `validateAbilityScores("high")` is called
- **Then** it returns `{ valid: false, error: { field: "abilityScores", message: "abilityScores must be an object" } }`

### Requirement: ADDED `validateAbility` validator

The system SHALL validate that a creature ability object has a non-empty string `name` and a non-empty string `description`, and SHALL accept optional fields (`attackBonus`, `damageDescription`, `saveDC`, `saveType`, `recharge`).

#### Scenario: Valid ability with required fields only

- **Given** `{ name: "Multiattack", description: "The creature makes two attacks." }`
- **When** `validateAbility(value)` is called
- **Then** it returns `{ valid: true, value: { name: "Multiattack", description: "The creature makes two attacks.", attackBonus: undefined, ... } }`

#### Scenario: Missing `name`

- **Given** `{ description: "The creature makes two attacks." }` (no `name`)
- **When** `validateAbility(value)` is called
- **Then** it returns `{ valid: false, error: { field: "ability.name" } }`

#### Scenario: Missing `description`

- **Given** `{ name: "Multiattack" }` (no `description`)
- **When** `validateAbility(value)` is called
- **Then** it returns `{ valid: false, error: { field: "ability.description" } }`

#### Scenario: Non-object input

- **Given** the value `"not an object"`
- **When** `validateAbility("not an object")` is called
- **Then** it returns `{ valid: false, error: { field: "ability", message: "ability must be an object" } }`

### Requirement: ADDED `validateAbilityArray` validator

The system SHALL validate that a value is an array of valid creature ability objects, returning a typed array on success.

#### Scenario: Valid array of abilities

- **Given** `[{ name: "Bite", description: "Melee attack." }, { name: "Claw", description: "Melee attack." }]`
- **When** `validateAbilityArray(value, "actions")` is called
- **Then** it returns `{ valid: true, value: [<two ability objects>] }`

#### Scenario: Null/undefined defaults to empty array

- **Given** the value `undefined`
- **When** `validateAbilityArray(undefined, "traits")` is called
- **Then** it returns `{ valid: true, value: [] }`

#### Scenario: Non-array input

- **Given** the value `"not an array"`
- **When** `validateAbilityArray("not an array", "actions")` is called
- **Then** it returns `{ valid: false, error: { field: "actions", message: "actions must be an array" } }`

#### Scenario: Array with invalid element

- **Given** `[{ name: "Bite", description: "Melee." }, { name: "Claw" }]` (second element missing `description`)
- **When** `validateAbilityArray(value, "actions")` is called
- **Then** it returns `{ valid: false, error: { field: "actions[1].description" } }`

## MODIFIED Requirements

_(none — these are new exports with no prior version)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal element "Create `lib/validation/dnd.ts`" → Requirement: ADDED `lib/validation/dnd.ts` module
- Design decision 1 (three-tier structure) → Requirement: ADDED `lib/validation/dnd.ts` module
- Requirement ADDED `validateAbilityScores` → Task: Implement `validateAbilityScores` in `dnd.ts`
- Requirement ADDED `validateAbility` → Task: Implement `validateAbility` in `dnd.ts`
- Requirement ADDED `validateAbilityArray` → Task: Implement `validateAbilityArray` in `dnd.ts`
- All requirements → Task: Add `tests/unit/validation/dnd.test.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: D&D validators importable by non-monster code

- **Given** a hypothetical `lib/validation/characterImport.ts` that imports `validateAbilityScores` from `@/lib/validation/dnd`
- **When** compiled
- **Then** no circular dependency or monster-upload coupling is introduced
