## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `ModifierLike` interface exported from `utils.ts`

The system SHALL export a `ModifierLike` interface from `lib/import/utils.ts` with the shape `{ subType?: string | null; friendlySubtypeName?: string | null }`.

#### Scenario: Generic modifier object satisfies `ModifierLike`

- **Given** any object with optional `subType` and `friendlySubtypeName` string fields
- **When** passed to `isDamageTypeModifier()`
- **Then** TypeScript accepts it without a cast and the function returns the correct boolean

#### Scenario: `DndBeyondModifier` satisfies `ModifierLike` structurally

- **Given** a value typed as `DndBeyondModifier`
- **When** passed to `isDamageTypeModifier()`
- **Then** TypeScript compiles without error at all existing call sites in `lib/dndBeyondCharacterImport.ts`

---

### Requirement: ADDED `isPresent<T>()` exported from `utils.ts`

The system SHALL export `isPresent<T>()` from `lib/import/utils.ts`.

#### Scenario: Happy path — non-null value

- **Given** any non-null, non-undefined value
- **When** passed to `isPresent()`
- **Then** returns `true` and the type is narrowed to `T`

#### Scenario: Null/undefined values

- **Given** `null` or `undefined`
- **When** passed to `isPresent()`
- **Then** returns `false`

---

### Requirement: ADDED `escapeRegExp()` exported from `utils.ts`

The system SHALL export `escapeRegExp()` from `lib/import/utils.ts`.

#### Scenario: String with regex special characters

- **Given** a string containing `.`, `*`, `+`, `(`, `)`, etc.
- **When** passed to `escapeRegExp()`
- **Then** returns the string with all special characters backslash-escaped

---

### Requirement: ADDED `ABILITY_KEYS` exported from `utils.ts`

The system SHALL export `ABILITY_KEYS` as a `ReadonlyArray<keyof AbilityScores>` from `lib/import/utils.ts` containing `["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]` in that order.

#### Scenario: Correct values and type

- **Given** the exported `ABILITY_KEYS` constant
- **When** inspected at compile time and runtime
- **Then** it has exactly 6 elements in strength→charisma order, typed as `ReadonlyArray<keyof AbilityScores>`

## MODIFIED Requirements

### Requirement: MODIFIED `isDamageTypeModifier` parameter type

The system SHALL accept any `ModifierLike` value (not just `DndBeyondModifier`) for `isDamageTypeModifier()`.

#### Scenario: Parameter type widened

- **Given** `isDamageTypeModifier` in `lib/import/utils.ts`
- **When** the file is compiled
- **Then** there is no `import` statement referencing `DndBeyondModifier` or any symbol from `../dndBeyondCharacterImport` or any `dndBeyond-*` file

## REMOVED Requirements

### Requirement: REMOVED `isPresent`, `escapeRegExp`, `ABILITY_KEYS` from `dndBeyond-utils.ts`

Reason for removal: These are provider-agnostic utilities. They were misplaced in `dndBeyond-utils.ts` and have been relocated to `utils.ts`.

## Traceability

- Proposal element "Remove DnD Beyond import from utils.ts" → Requirement: MODIFIED `isDamageTypeModifier` parameter type → Task: Update `isDamageTypeModifier` in `utils.ts`
- Proposal element "Move isPresent, escapeRegExp, ABILITY_KEYS" → Requirements: ADDED exports in `utils.ts` + REMOVED from `dndBeyond-utils.ts` → Task: Move symbols
- Design Decision 1 → ADDED `ModifierLike`, MODIFIED `isDamageTypeModifier`
- Design Decision 2 → ADDED `isPresent`, `escapeRegExp`, `ABILITY_KEYS` in `utils.ts`; REMOVED from `dndBeyond-utils.ts`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing tests unaffected

- **Given** the full test suite before this change
- **When** the same suite runs after all moves are complete
- **Then** all tests pass with identical results; no new failures introduced

### Requirement: Operability

#### Scenario: TypeScript strict compile

- **Given** the project TypeScript configuration
- **When** `tsc --noEmit` is run after all changes
- **Then** exits with code 0 and no errors
