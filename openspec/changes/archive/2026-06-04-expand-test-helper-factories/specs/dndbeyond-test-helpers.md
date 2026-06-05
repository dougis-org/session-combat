## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `createModifier` factory

The system SHALL provide a `createModifier(type, subType, value?)` factory in `tests/helpers/dndBeyondTestHelpers.ts` that returns a single `DndBeyondModifier`-shaped object matching the interface used by `dndBeyond-utils.ts`.

#### Scenario: Bonus modifier with value

- **Given** type `"bonus"`, subType `"armor-class"`, value `2`
- **When** `createModifier("bonus", "armor-class", 2)` is called
- **Then** returns `{ type: "bonus", subType: "armor-class", fixedValue: null, value: 2 }`

#### Scenario: Set modifier with fixedValue

- **Given** type `"set"`, subType `"unarmored-armor-class"`, value `13`
- **When** `createModifier("set", "unarmored-armor-class", 13)` is called
- **Then** returns an object with `fixedValue: 13` and `value: null` (set modifiers use fixedValue)

#### Scenario: Modifier with null value

- **Given** type `"bonus"`, subType `"armor-class"`, no value supplied
- **When** `createModifier("bonus", "armor-class")` is called
- **Then** returns a modifier with both `fixedValue` and `value` as null

---

### Requirement: ADDED `createModifierList` factory

The system SHALL provide a `createModifierList(...modifiers)` factory in `tests/helpers/dndBeyondTestHelpers.ts` that accepts any number of modifier objects and returns them as an array.

#### Scenario: Multiple modifiers

- **Given** two modifier objects created via `createModifier`
- **When** `createModifierList(mod1, mod2)` is called
- **Then** returns `[mod1, mod2]`

#### Scenario: Empty modifier list

- **Given** no arguments
- **When** `createModifierList()` is called
- **Then** returns `[]`

---

### Requirement: ADDED `open5eTestHelpers.ts` (renamed from `importTestHelpers.ts`)

The system SHALL rename `tests/helpers/importTestHelpers.ts` to `tests/helpers/open5eTestHelpers.ts` with content unchanged, and add a scope-defining header comment.

#### Scenario: All existing Open5E exports remain available

- **Given** the file is renamed
- **When** any test imports `createTestCreature`, `createTestSpell`, `createMockFetch`, `createMockClient`, `SAMPLE_CREATURE`, or `SAMPLE_SPELL`
- **Then** the import resolves correctly (via updated import path or re-export)

#### Scenario: Header comment present

- **Given** `tests/helpers/open5eTestHelpers.ts` is opened
- **When** the first lines are read
- **Then** a comment block is present stating this file is for Open5E-specific test shapes only

---

### Requirement: ADDED scope-defining header comment in `dndBeyondTestHelpers.ts`

The system SHALL include a header comment at the top of `tests/helpers/dndBeyondTestHelpers.ts` that:
- States this file contains raw DnD Beyond API shape factories
- Explicitly states that normalized 5e output shapes do NOT belong here (those go in `characterTestHelpers.ts`)
- Notes that DnD Beyond-specific modifier, inventory, and stat-block raw shapes belong here

#### Scenario: Header comment present

- **Given** `tests/helpers/dndBeyondTestHelpers.ts` is opened
- **When** the first lines are read
- **Then** a comment block defining the file's scope is present before any imports or exports

## MODIFIED Requirements

### Requirement: MODIFIED inline modifier arrays in `dndBeyond-armor-class.test.ts`

The system SHALL replace all inline `MockDndBeyondModifier[]` array declarations in `tests/unit/import/dndBeyond-armor-class.test.ts` with calls to `createModifier` and `createModifierList` from `dndBeyondTestHelpers.ts`.

#### Scenario: No inline modifier arrays remain

- **Given** `dndBeyond-armor-class.test.ts` after the change
- **When** `grep "MockDndBeyondModifier\[\]"` is run on the file
- **Then** zero matches are found

## REMOVED Requirements

### Requirement: REMOVED `importTestHelpers.ts` path

Reason for removal: File is renamed to `open5eTestHelpers.ts`. No file at the old path should exist after the change.

#### Scenario: Old path does not exist

- **Given** the rename is complete
- **When** `ls tests/helpers/importTestHelpers.ts` is run
- **Then** the file is not found

## Traceability

- Proposal element "Rename importTestHelpers.ts" -> ADDED open5eTestHelpers.ts, REMOVED importTestHelpers.ts path
- Proposal element "Create dndBeyondTestHelpers.ts" -> ADDED createModifier, ADDED createModifierList, ADDED header comment
- Design decision 1 (three-layer hierarchy) -> All ADDED requirements
- Design decision 3 (createModifier/createModifierList) -> ADDED createModifier, ADDED createModifierList
- Design decision 4 (header comments) -> ADDED header comments in both files
- Requirements -> Tasks: task-01 (rename open5eTestHelpers), task-02 (create dndBeyondTestHelpers), task-06 (replace inline modifiers)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Existing Open5E tests unaffected by rename

- **Given** all test files importing from `importTestHelpers.ts` have their paths updated
- **When** the full unit test suite runs
- **Then** zero test failures introduced by the rename

#### Scenario: No stale references to old path

- **Given** the rename is complete
- **When** `grep -r "importTestHelpers"` is run across the repo
- **Then** zero matches are found
