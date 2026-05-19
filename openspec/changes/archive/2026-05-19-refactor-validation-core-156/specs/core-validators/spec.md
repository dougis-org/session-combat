## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `lib/validation/core.ts` module

The system SHALL provide a `lib/validation/core.ts` module exporting `ValidationError`, `ValidationResult`, `validateString`, `validateNumber`, `validateStringArray`, `validateRecord`, `validateStringRecord`, and `validateNumberRecord`.

#### Scenario: Import all exports from core

- **Given** a TypeScript file that imports from `@/lib/validation/core`
- **When** the file is compiled
- **Then** all eight named exports resolve without type errors

#### Scenario: `validateString` — valid string

- **Given** the value `"goblin"` and no options
- **When** `validateString("goblin", "name")` is called
- **Then** it returns `{ valid: true, value: "goblin" }`

#### Scenario: `validateString` — required field missing

- **Given** the value `undefined` and `{ required: true }`
- **When** `validateString(undefined, "name", { required: true })` is called
- **Then** it returns `{ valid: false, error: { field: "name", message: "name is required" } }`

#### Scenario: `validateString` — wrong type

- **Given** the value `42`
- **When** `validateString(42, "name")` is called
- **Then** it returns `{ valid: false, error: { field: "name", message: "name must be a string, got number" } }`

#### Scenario: `validateNumber` — valid number

- **Given** the value `10`
- **When** `validateNumber(10, "maxHp")` is called
- **Then** it returns `{ valid: true, value: 10 }`

#### Scenario: `validateNumber` — below minimum

- **Given** the value `-1` and `{ min: 0 }`
- **When** `validateNumber(-1, "ac", { min: 0 })` is called
- **Then** it returns `{ valid: false, error: { field: "ac", message: "ac must be at least 0" } }`

#### Scenario: `validateNumber` — non-finite value

- **Given** the value `Infinity`
- **When** `validateNumber(Infinity, "hp")` is called
- **Then** it returns `{ valid: false, error: { field: "hp", message: "hp must be a valid number, got number" } }`

#### Scenario: `validateStringArray` — valid array

- **Given** the value `["Common", "Elvish"]`
- **When** `validateStringArray(["Common", "Elvish"], "languages")` is called
- **Then** it returns `{ valid: true, value: ["Common", "Elvish"] }`

#### Scenario: `validateStringArray` — null/undefined defaults to empty

- **Given** the value `undefined`
- **When** `validateStringArray(undefined, "languages")` is called
- **Then** it returns `{ valid: true, value: [] }`

#### Scenario: `validateStringArray` — non-string element

- **Given** the value `["Common", 42]`
- **When** `validateStringArray(["Common", 42], "languages")` is called
- **Then** it returns `{ valid: false, error: { field: "languages", index: 1 } }`

#### Scenario: `validateNumberRecord` — valid record

- **Given** the value `{ strength: 2, dexterity: 3 }`
- **When** `validateNumberRecord({ strength: 2, dexterity: 3 }, "savingThrows")` is called
- **Then** it returns `{ valid: true, value: { strength: 2, dexterity: 3 } }`

#### Scenario: `validateStringRecord` — non-string value in record

- **Given** the value `{ darkvision: 60 }` (number, not string)
- **When** `validateStringRecord({ darkvision: 60 }, "senses")` is called
- **Then** it returns `{ valid: false, error: { field: "senses.darkvision" } }`

### Requirement: ADDED `validateString` trim behaviour

The system SHALL trim leading and trailing whitespace from the input string before evaluating `minLength`, and SHALL return the trimmed string as `value`.

#### Scenario: Leading/trailing whitespace passes length check after trim

- **Given** the value `"  ab  "` and `{ minLength: 2 }`
- **When** `validateString("  ab  ", "name", { minLength: 2 })` is called
- **Then** it returns `{ valid: true, value: "ab" }`

#### Scenario: Whitespace-only string fails minLength after trim

- **Given** the value `"   "` and `{ minLength: 1 }`
- **When** `validateString("   ", "name", { minLength: 1 })` is called
- **Then** it returns `{ valid: false, error: { field: "name" } }`

#### Scenario: Interior whitespace is preserved

- **Given** the value `"  hello world  "` and no minLength
- **When** `validateString("  hello world  ", "desc")` is called
- **Then** it returns `{ valid: true, value: "hello world" }` (interior space preserved)

## MODIFIED Requirements

### Requirement: MODIFIED `ValidationError` and `ValidationResult` source of truth

The system SHALL define `ValidationError` and `ValidationResult` in `lib/validation/core.ts` and re-export them from `lib/validation/monsterUpload.ts` to preserve backward compatibility.

#### Scenario: Import from `monsterUpload.ts` still works

- **Given** existing code importing `ValidationError` from `@/lib/validation/monsterUpload`
- **When** the code is compiled after the refactor
- **Then** it resolves without errors via the re-export

## REMOVED Requirements

### Requirement: REMOVED `validateStringNumberRecord`

Reason for removal: The function was defined in `monsterUpload.ts` but never called anywhere in the codebase. It is deleted rather than moved.

## Traceability

- Proposal element "Create `lib/validation/core.ts`" → Requirement: ADDED `lib/validation/core.ts` module
- Proposal element "Fix `validateString` trim behaviour" → Requirement: ADDED `validateString` trim behaviour
- Proposal element "Delete `validateStringNumberRecord`" → Requirement: REMOVED `validateStringNumberRecord`
- Design decision 1 (three-tier structure) → Requirement: ADDED `lib/validation/core.ts` module
- Design decision 3 (trim fix scope) → Requirement: ADDED `validateString` trim behaviour
- Design decision 5 (deletion) → Requirement: REMOVED `validateStringNumberRecord`
- Requirement ADDED core module → Task: Create `lib/validation/core.ts`
- Requirement ADDED trim behaviour → Task: Fix `validateString` in `core.ts`
- Requirement REMOVED `validateStringNumberRecord` → Task: Delete from source

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: TypeScript compilation

- **Given** the refactored `lib/validation/` files
- **When** `tsc --noEmit` runs in CI
- **Then** zero type errors are reported
