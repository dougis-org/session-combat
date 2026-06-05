## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `createAbilityScores` factory

The system SHALL provide a `createAbilityScores(partial?)` factory in `tests/helpers/characterTestHelpers.ts` that returns a complete `AbilityScores` object with all six stats defaulting to 10, with any provided fields overriding the defaults.

#### Scenario: Default ability scores

- **Given** no partial overrides are supplied
- **When** `createAbilityScores()` is called
- **Then** returns `{ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }`

#### Scenario: Partial override

- **Given** a partial object `{ dexterity: 17, charisma: 21 }` is supplied
- **When** `createAbilityScores({ dexterity: 17, charisma: 21 })` is called
- **Then** returns an object with dex 17, charisma 21, and all other stats at 10

---

### Requirement: ADDED `createClassEntry` factory

The system SHALL provide a `createClassEntry(className, level)` factory in `tests/helpers/characterTestHelpers.ts` that returns a `CharacterClass` object matching the shape defined in `lib/types.ts`.

#### Scenario: Single class entry

- **Given** className `"Fighter"` and level `5`
- **When** `createClassEntry("Fighter", 5)` is called
- **Then** returns `{ class: "Fighter", level: 5 }`

#### Scenario: Multiclass entry

- **Given** className `"Warlock"` and level `3`
- **When** used alongside another `createClassEntry` in an array
- **Then** produces a valid multiclass array accepted by character validators

---

### Requirement: ADDED `createCharacterData` factory (moved from `dndBeyondImport.ts`)

The system SHALL provide a `createCharacterData(partial?)` factory in `tests/helpers/characterTestHelpers.ts` that returns a complete `ImportedCharacterDraft` with sensible defaults, with any provided fields overriding the defaults. This is a verbatim move of `createImportedCharacterDraft` from `tests/helpers/dndBeyondImport.ts`, renamed to reflect its generic 5e scope.

#### Scenario: Default character data

- **Given** no partial overrides
- **When** `createCharacterData()` is called
- **Then** returns a valid `ImportedCharacterDraft` with the same defaults as the previous `createImportedCharacterDraft`

#### Scenario: Partial override

- **Given** a partial `{ name: "Thorn", hp: 50 }`
- **When** `createCharacterData({ name: "Thorn", hp: 50 })` is called
- **Then** returns a character with name "Thorn", hp 50, and all other fields at their defaults

---

### Requirement: ADDED scope-defining header comment in `characterTestHelpers.ts`

The system SHALL include a header comment at the top of `tests/helpers/characterTestHelpers.ts` that:
- States this file contains generic D&D 5e character shape factories
- Explicitly states that DnD Beyond-specific raw shapes do NOT belong here
- Notes that future import sources (Roll20, etc.) should add to this file when creating factories for the normalized output shape

#### Scenario: Header comment present

- **Given** `tests/helpers/characterTestHelpers.ts` is opened
- **When** the first lines are read
- **Then** a comment block defining the file's scope is present before any imports or exports

## MODIFIED Requirements

### Requirement: MODIFIED `testFactories.ts` re-exports

The system SHALL re-export all factories from `tests/helpers/characterTestHelpers.ts` via `tests/unit/import/testFactories.ts` so existing test files importing from `testFactories.ts` continue to work.

#### Scenario: Backward-compatible re-export

- **Given** a test file imports `createCharacterData` from `@/tests/unit/import/testFactories`
- **When** the import is resolved
- **Then** the factory from `characterTestHelpers.ts` is used without error

## Backward-Compatible Export

### Requirement: `createImportedCharacterDraft` retained as alias in `dndBeyondImport.ts`

`createImportedCharacterDraft` is re-exported from `dndBeyondImport.ts` as a backward-compatible alias for `createCharacterData`:

```typescript
export { createCharacterData as createImportedCharacterDraft };
```

This keeps existing callers working without modification. The canonical name going forward is `createCharacterData` from `characterTestHelpers.ts`.

## Traceability

- Proposal element "Create characterTestHelpers.ts" -> Requirements: ADDED createAbilityScores, ADDED createClassEntry, ADDED createCharacterData, ADDED header comment
- Design decision 1 (three-layer hierarchy) -> All ADDED requirements
- Design decision 2 (move createImportedCharacterDraft verbatim) -> ADDED createCharacterData, backward-compat re-export in dndBeyondImport.ts
- Requirements -> Tasks: task-03 (create characterTestHelpers.ts), task-04 (backward-compat re-export), task-05 (update imports)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing tests unaffected

- **Given** all test files that previously used `createImportedCharacterDraft` are updated to use `createCharacterData`
- **When** the full unit test suite runs (`npm run test:unit`)
- **Then** zero test failures introduced by this change
