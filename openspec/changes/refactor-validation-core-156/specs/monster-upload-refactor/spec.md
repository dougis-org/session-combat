## ADDED Requirements

_(none — no new public-facing behaviour is added to `monsterUpload.ts`)_

## MODIFIED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: MODIFIED `monsterUpload.ts` imports from `core.ts` and `dnd.ts`

The system SHALL define no validator helper functions in `lib/validation/monsterUpload.ts`. All helpers SHALL be imported from `@/lib/validation/core` or `@/lib/validation/dnd`.

#### Scenario: No private helpers remain in monsterUpload

- **Given** the refactored `lib/validation/monsterUpload.ts`
- **When** the file is inspected
- **Then** none of `validateString`, `validateNumber`, `validateStringArray`, `validateRecord`, `validateStringRecord`, `validateNumberRecord`, `validateAbilityScores`, `validateAbility`, `validateAbilityArray` are defined as local functions; all are imported

### Requirement: MODIFIED `validateMonsterData` uses helpers for scalar checks

The system SHALL use `validateString` and `validateNumber` from `core.ts` for the `name`, `maxHp`, `hp`, `ac`, `type`, and `challengeRating` checks in `validateMonsterData` where they fit cleanly. Cross-field (`hp ≤ maxHp`), enum (`size`), and integer (`legendaryActionCount`) checks SHALL remain inline.

#### Scenario: Monster with valid name and maxHp validates successfully

- **Given** `{ name: "Goblin", maxHp: 7 }`
- **When** `validateMonsterData(data)` is called
- **Then** it returns `{ valid: true, errors: [] }`

#### Scenario: Monster with empty name fails

- **Given** `{ name: "", maxHp: 7 }`
- **When** `validateMonsterData(data)` is called
- **Then** it returns `{ valid: false, errors: [{ field: expect.stringContaining("name") }] }`

#### Scenario: Monster with whitespace-only name fails (trim fix propagates)

- **Given** `{ name: "   ", maxHp: 7 }`
- **When** `validateMonsterData(data)` is called
- **Then** it returns `{ valid: false, errors: [{ field: expect.stringContaining("name") }] }`

### Requirement: MODIFIED `ValidationError` and `ValidationResult` re-exported from `monsterUpload.ts`

The system SHALL re-export `ValidationError` and `ValidationResult` from `lib/validation/monsterUpload.ts` so that existing consumers importing these types from that path continue to compile without changes.

#### Scenario: Backward-compatible type import

- **Given** a file importing `{ ValidationError } from '@/lib/validation/monsterUpload'`
- **When** TypeScript compiles the project
- **Then** the import resolves successfully via re-export

## REMOVED Requirements

### Requirement: REMOVED private helper definitions in `monsterUpload.ts`

Reason for removal: All helper functions are moved to `core.ts` or `dnd.ts` and imported; defining them locally is no longer required or permitted.

### Requirement: REMOVED `validateStringNumberRecord`

Reason for removal: The function was never called. It is deleted and not moved to `core.ts`.

## Traceability

- Proposal element "Refactor `monsterUpload.ts`" → Requirement: MODIFIED `monsterUpload.ts` imports
- Proposal element "Delete `validateStringNumberRecord`" → Requirement: REMOVED `validateStringNumberRecord`
- Design decision 2 (re-export types) → Requirement: MODIFIED `ValidationError` re-export
- Design decision 4 (inline checks that stay) → Requirement: MODIFIED `validateMonsterData` uses helpers
- All MODIFIED requirements → Task: Refactor `lib/validation/monsterUpload.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing monster-upload test suite passes unchanged

- **Given** the refactored `lib/validation/monsterUpload.ts` and its new imports
- **When** `jest tests/unit/monster-upload/` runs
- **Then** all tests pass with zero failures and zero snapshot changes; no test file is modified as part of this change
