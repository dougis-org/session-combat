## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `flattenModifiers()` exported from `dndBeyond-utils.ts`

The system SHALL export `flattenModifiers()` from `lib/import/dndBeyond-utils.ts`. This function collects all modifier arrays from a `DndBeyondCharacterData` payload and returns them as a single flat array of `DndBeyondModifier`.

#### Scenario: Function accessible to extraction modules

- **Given** any extraction module (e.g., `dndBeyond-defenses.ts`, `dndBeyond-skills-senses.ts`)
- **When** it imports `{ flattenModifiers }` from `../import/dndBeyond-utils`
- **Then** TypeScript compiles without error and the function behaves identically to the original in `dndBeyondCharacterImport.ts`

#### Scenario: Main orchestrator still works after move

- **Given** `lib/dndBeyondCharacterImport.ts` updated to import `flattenModifiers` from `./import/dndBeyond-utils`
- **When** `normalizeDndBeyondCharacter()` is called
- **Then** the result is identical to pre-change behavior

## MODIFIED Requirements

### Requirement: MODIFIED `dndBeyond-utils.ts` contains only DnD Beyond-specific code

The system SHALL ensure `lib/import/dndBeyond-utils.ts` exports no provider-agnostic utilities (`isPresent`, `escapeRegExp`, `ABILITY_KEYS` are removed).

#### Scenario: Generic utilities removed

- **Given** `lib/import/dndBeyond-utils.ts` after this change
- **When** its exports are inspected
- **Then** `isPresent`, `escapeRegExp`, and `ABILITY_KEYS` are not among them

#### Scenario: Internal usages of `ABILITY_KEYS` updated

- **Given** any usage of `ABILITY_KEYS` inside `dndBeyond-utils.ts`
- **When** compiled
- **Then** it imports `ABILITY_KEYS` from `./utils` and compiles without error

## REMOVED Requirements

### Requirement: REMOVED `flattenModifiers` as a private function in `dndBeyondCharacterImport.ts`

Reason for removal: `flattenModifiers` is a shared DnD Beyond utility needed by multiple extraction modules. It has been promoted to an exported member of `dndBeyond-utils.ts` to eliminate any need for extracted modules to import from the decomposing monolith.

## Traceability

- Proposal element "Move flattenModifiers to dndBeyond-utils.ts" → Requirement: ADDED `flattenModifiers` export → Task: Move `flattenModifiers` to `dndBeyond-utils.ts`
- Proposal element "dndBeyond-utils.ts contains only DnD Beyond-specific code" → Requirement: MODIFIED exports → Task: Remove `isPresent`, `escapeRegExp`, `ABILITY_KEYS` from `dndBeyond-utils.ts`
- Design Decision 3 → ADDED `flattenModifiers` in `dndBeyond-utils.ts`
- Design Decision 2 → MODIFIED `dndBeyond-utils.ts` exports (removals)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing tests unaffected

- **Given** the full test suite before this change
- **When** the same suite runs after `flattenModifiers` is moved
- **Then** all tests pass with identical results; no new failures introduced

### Requirement: Operability

#### Scenario: TypeScript strict compile

- **Given** the project TypeScript configuration
- **When** `tsc --noEmit` is run after all changes
- **Then** exits with code 0 and no errors
