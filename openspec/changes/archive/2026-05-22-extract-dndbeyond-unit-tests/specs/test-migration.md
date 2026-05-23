## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Per-module unit test files for all extracted dndBeyond modules

Each extracted module in `lib/import/dndBeyond-*.ts` SHALL have a corresponding test file in `tests/unit/import/` that imports and tests that module's exported functions directly.

#### Scenario: New test file exists and imports from module (not orchestrator)

- **Given** an extracted module at `lib/import/dndBeyond-<name>.ts`
- **When** the corresponding test file `tests/unit/import/dndBeyond-<name>.test.ts` is created
- **Then** all imports in the test file reference `lib/import/dndBeyond-<name>` — none reference `lib/dndBeyondCharacterImport`

#### Scenario: Migrated tests pass when calling the module function directly

- **Given** a test previously exercised module logic through `normalizeDndBeyondCharacter()`
- **When** the test is rewritten to call the module's exported function directly with equivalent inputs
- **Then** the test passes and asserts the same observable outcome as before

#### Scenario: Test isolation — a module's test file can run standalone

- **Given** the test file for a single module (e.g., `dndBeyond-identity.test.ts`)
- **When** run in isolation via `npx jest tests/unit/import/dndBeyond-identity.test.ts`
- **Then** all tests in that file pass without requiring other module test files to be loaded

### Requirement: ADDED Defenses module has unit test coverage

`dndBeyond-defenses.ts` SHALL have isolated tests covering all 3 exported functions: `normalizeImmunities`, `normalizeByModifierType`, and `normalizeLanguages`.

#### Scenario: normalizeImmunities separates damage immunities from condition immunities

- **Given** a modifier array containing both a damage-type immunity (e.g., "poison") and a condition immunity (e.g., "poisoned")
- **When** `normalizeImmunities(modifiers)` is called
- **Then** the result contains `damageImmunities: ["poison"]` and `conditionImmunities: ["Poisoned"]`

#### Scenario: normalizeLanguages extracts language modifiers

- **Given** a modifier array with a modifier of type "language" and subType "deep-speech"
- **When** `normalizeLanguages(modifiers)` is called
- **Then** the result contains "Deep Speech"

#### Scenario: normalizeByModifierType extracts by arbitrary type

- **Given** a modifier array with mixed types
- **When** `normalizeByModifierType(modifiers, "resistance")` is called
- **Then** only resistance modifiers are returned, deduplicated and titleized

### Requirement: ADDED File naming matches source module names

New test files SHALL use kebab-case names that match their corresponding source module filename exactly.

#### Scenario: Identity module test file uses correct name

- **Given** the module file `lib/import/dndBeyond-identity.ts`
- **When** the test file is created
- **Then** it is at `tests/unit/import/dndBeyond-identity.test.ts` (not `dndBeyond-character.test.ts`)

#### Scenario: Skills-senses module test file uses correct name

- **Given** the module file `lib/import/dndBeyond-skills-senses.ts`
- **When** the test file is created
- **Then** it is at `tests/unit/import/dndBeyond-skills-senses.test.ts` (not `dndBeyond-skills.test.ts`)

## MODIFIED Requirements

### Requirement: MODIFIED `dndBeyondCharacterImport.test.ts` contains only multi-domain orchestration tests

The monolith test file SHALL be reduced to tests that exercise the composition of multiple modules through `normalizeDndBeyondCharacter()`. Single-domain tests SHALL be removed from this file.

#### Scenario: Monolith retains only 3 tests after migration

- **Given** the migration is complete
- **When** `tests/unit/import/dndBeyondCharacterImport.test.ts` is read
- **Then** exactly 3 tests remain: the full-snapshot test (L96), the unsupported-values warning test (L136), and the multi-domain senses/defenses/languages test (L315)

#### Scenario: Monolith tests still pass after surrounding tests are removed

- **Given** the 27 single-domain tests have been removed from the monolith
- **When** `npx jest tests/unit/import/dndBeyondCharacterImport.test.ts` is run
- **Then** all 3 remaining tests pass

### Requirement: MODIFIED `dndBeyond-armor-class.test.ts` extended with 5 additional tests

The existing armor-class test file SHALL gain test coverage for unarmored-AC modifier logic and armor type rules.

#### Scenario: Existing tests unaffected by new additions

- **Given** the test file already has passing tests
- **When** 5 new tests are appended
- **Then** all pre-existing tests continue to pass alongside the new ones

## REMOVED Requirements

### Requirement: REMOVED Single-domain tests exercised through the orchestrator in the monolith

Reason for removal: These tests provided false coupling — a bug in the classes module would surface as a failure in `dndBeyondCharacterImport.test.ts`, not in a classes-specific file. Moving them to per-module files gives accurate signal.

## Traceability

- Proposal element "Create dndBeyond-identity.test.ts" → Requirement: Per-module unit test files / File naming
- Proposal element "Create dndBeyond-classes.test.ts" → Requirement: Per-module unit test files
- Proposal element "Create dndBeyond-ability-scores.test.ts" → Requirement: Per-module unit test files
- Proposal element "Extend dndBeyond-armor-class.test.ts" → Requirement: MODIFIED armor-class extended
- Proposal element "Create dndBeyond-skills-senses.test.ts" → Requirement: Per-module unit test files / File naming
- Proposal element "Create dndBeyond-defenses.test.ts" → Requirement: Defenses module has unit test coverage
- Proposal element "Shrink monolith to 3 tests" → Requirement: MODIFIED monolith contains only orchestration tests
- Design Decision 1 (direct module calls) → Requirement: Per-module unit test files (isolation scenario)
- Design Decision 2 (keep 3 orchestration tests) → Requirement: MODIFIED monolith
- Design Decision 3 (defenses from scratch) → Requirement: Defenses module coverage
- Design Decision 4 (naming follows module) → Requirement: File naming matches source module names
- Requirement "Per-module unit test files" → Tasks: identity-tests, classes-tests, ability-scores-tests, skills-senses-tests
- Requirement "Defenses coverage" → Tasks: defenses-tests
- Requirement "MODIFIED armor-class" → Tasks: armor-class-tests
- Requirement "MODIFIED monolith" → Tasks: shrink-monolith

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Full test suite passes after migration

- **Given** all migration tasks are complete
- **When** `npx jest tests/unit/import/` is run
- **Then** all tests pass and the total test count is equal to or greater than the pre-migration count

#### Scenario: TypeScript compilation passes

- **Given** all new test files are created
- **When** `npx tsc --noEmit` is run
- **Then** no type errors are introduced by the new test files
