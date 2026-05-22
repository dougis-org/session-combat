## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED `lib/import/dndBeyond-identity.ts` module exists and exports identity helpers

The system SHALL provide `parseUrlOrThrow`, `isSupportedDndBeyondHostname`, `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, and `normalizeAlignmentId` from `lib/import/dndBeyond-identity.ts`.

#### Scenario: Module exports all required functions

- **Given** the file `lib/import/dndBeyond-identity.ts` exists
- **When** it is imported
- **Then** `parseDndBeyondCharacterUrl`, `requireCharacterIdentity`, `buildNormalizationWarnings`, and `normalizeAlignmentId` are available as named exports

#### Scenario: Private helpers are not exported

- **Given** the file `lib/import/dndBeyond-identity.ts` exists
- **When** its public API is inspected
- **Then** `parseUrlOrThrow`, `isSupportedDndBeyondHostname`, `CharacterIdentity`, `ALIGNMENT_ID_MAP`, `CANONICAL_HOST`, and `CHARACTER_PATH_PATTERN` are NOT exported (internal only)

---

### Requirement: ADDED `normalizeAlignmentId` maps DnD Beyond numeric alignment IDs to `DnDAlignment`

The system SHALL map DnD Beyond's numeric alignment IDs 1–9 to their corresponding `DnDAlignment` string values via `normalizeAlignmentId`.

#### Scenario: Valid alignment ID returns correct alignment string

- **Given** a DnD Beyond alignment ID of `1`
- **When** `normalizeAlignmentId(1)` is called
- **Then** it returns `"Lawful Good"`

#### Scenario: All nine alignment IDs map correctly

- **Given** alignment IDs 1 through 9
- **When** each is passed to `normalizeAlignmentId`
- **Then** they return `"Lawful Good"`, `"Neutral Good"`, `"Chaotic Good"`, `"Lawful Neutral"`, `"Neutral"`, `"Chaotic Neutral"`, `"Lawful Evil"`, `"Neutral Evil"`, `"Chaotic Evil"` respectively

#### Scenario: Non-numeric input returns undefined

- **Given** a `null`, `undefined`, or non-numeric value
- **When** passed to `normalizeAlignmentId`
- **Then** it returns `undefined`

#### Scenario: Unknown numeric ID returns undefined

- **Given** a numeric alignment ID not in the map (e.g., `0` or `99`)
- **When** passed to `normalizeAlignmentId`
- **Then** it returns `undefined`

---

### Requirement: ADDED `parseDndBeyondCharacterUrl` exported from new module

The system SHALL continue to parse and validate DnD Beyond character URLs via `parseDndBeyondCharacterUrl`, now exported from `lib/import/dndBeyond-identity.ts`.

#### Scenario: Valid canonical URL is parsed

- **Given** a valid DnD Beyond character URL `https://www.dndbeyond.com/characters/12345`
- **When** `parseDndBeyondCharacterUrl` is called with it
- **Then** it returns `{ characterId: "12345", shareCode: undefined, normalizedUrl: "https://www.dndbeyond.com/characters/12345" }`

#### Scenario: URL with share code is parsed

- **Given** a URL `https://www.dndbeyond.com/characters/12345/AbCdEf`
- **When** `parseDndBeyondCharacterUrl` is called
- **Then** it returns `{ characterId: "12345", shareCode: "AbCdEf", normalizedUrl: "https://www.dndbeyond.com/characters/12345/AbCdEf" }`

#### Scenario: Unsupported hostname throws validation error

- **Given** a URL with hostname `roll20.net`
- **When** `parseDndBeyondCharacterUrl` is called
- **Then** it throws a `DndBeyondImportError` with message indicating only DnD Beyond URLs are supported

#### Scenario: Invalid path throws validation error

- **Given** a valid DnD Beyond hostname but a non-character path (e.g., `/compendium/spells/fireball`)
- **When** `parseDndBeyondCharacterUrl` is called
- **Then** it throws a `DndBeyondImportError` with message indicating a publicly available character URL should be used

---

### Requirement: ADDED `requireCharacterIdentity` validates character identity fields

The system SHALL validate that a DnD Beyond character payload contains a non-empty `id` and `name` via `requireCharacterIdentity`.

#### Scenario: Valid character data returns identity

- **Given** a `DndBeyondCharacterData` with `id: 42` and `name: "Tordek"`
- **When** `requireCharacterIdentity` is called
- **Then** it returns `{ name: "Tordek", sourceCharacterId: "42" }`

#### Scenario: Missing ID throws validation error

- **Given** a `DndBeyondCharacterData` with `id: 0` or `id: null`
- **When** `requireCharacterIdentity` is called
- **Then** it throws a `DndBeyondImportError` indicating the character is missing an ID

#### Scenario: Missing name throws validation error

- **Given** a `DndBeyondCharacterData` with valid `id` but `name: ""`
- **When** `requireCharacterIdentity` is called
- **Then** it throws a `DndBeyondImportError` indicating the character is missing a name

---

### Requirement: ADDED `buildNormalizationWarnings` produces race and alignment warnings

The system SHALL produce warning strings when race or alignment from the DnD Beyond payload could not be normalized.

#### Scenario: Unsupported race produces warning

- **Given** a character payload with `race.fullName: "Warforged"` and a normalized details object where `race` is undefined
- **When** `buildNormalizationWarnings` is called
- **Then** the returned array contains a string mentioning `"Warforged"` and that it was omitted

#### Scenario: Unsupported numeric alignment ID produces warning

- **Given** a character payload with `alignmentId: 99` and normalized details where `alignment` is undefined
- **When** `buildNormalizationWarnings` is called
- **Then** the returned array contains a string indicating alignment was omitted

#### Scenario: All fields normalized returns empty warning array

- **Given** a character payload with valid race and alignment, both successfully normalized
- **When** `buildNormalizationWarnings` is called
- **Then** it returns an empty array `[]`

## MODIFIED Requirements

### Requirement: MODIFIED `lib/dndBeyondCharacterImport.ts` no longer defines identity helpers

The system SHALL import identity helpers from `lib/import/dndBeyond-identity.ts` rather than defining them inline.

#### Scenario: Source file contains no inline definitions of moved functions

- **Given** the file `lib/dndBeyondCharacterImport.ts` after implementation
- **When** it is searched for `function parseUrlOrThrow`, `function isSupportedDndBeyondHostname`, `function requireCharacterIdentity`, `function buildNormalizationWarnings`, `function normalizeAlignment`, `function normalizeAlignmentId`
- **Then** none of these function definitions are found in that file

#### Scenario: `dndBeyondCharacterImport.ts` imports from the new module

- **Given** the file `lib/dndBeyondCharacterImport.ts` after implementation
- **When** its import declarations are inspected
- **Then** it imports identity helpers from `./import/dndBeyond-identity`

### Requirement: MODIFIED `normalizeAlignment` renamed to `normalizeAlignmentId` at all call sites

The system SHALL use the name `normalizeAlignmentId` exclusively for the numeric-ID-to-alignment mapper.

#### Scenario: Renamed function is called with numeric alignment ID

- **Given** `normalizeAlignmentId` is imported from `lib/import/dndBeyond-identity`
- **When** called with a numeric alignment ID
- **Then** it returns the correct `DnDAlignment` string (behavior unchanged from pre-rename)

## REMOVED Requirements

### Requirement: REMOVED Inline definition of identity helpers in `dndBeyondCharacterImport.ts`

Reason for removal: These helpers are extracted to `lib/import/dndBeyond-identity.ts` as part of the 150–159 refactor series to improve separation of concerns.

## Traceability

- Proposal element "Create `lib/import/dndBeyond-identity.ts`" → Requirement: ADDED module exists and exports helpers
- Proposal element "Rename `normalizeAlignment` → `normalizeAlignmentId`" → Requirement: MODIFIED renamed at all call sites
- Proposal element "No generic `identity.ts`" → (no spec required — absence of a file)
- Design Decision 1 (no generic module) → Requirement: ADDED module exports (only DnD Beyond functions present)
- Design Decision 2 (rename) → Requirement: MODIFIED `normalizeAlignmentId` at all call sites
- Design Decision 3 (`CharacterIdentity` unexported) → Requirement: ADDED private helpers not exported
- Design Decision 4 (re-export `parseDndBeyondCharacterUrl`) → Requirement: ADDED `parseDndBeyondCharacterUrl` exported
- Design Decision 5 (constants move) → Requirement: ADDED module (private constants co-located)
- All ADDED Requirements → Tasks: create new file, move functions, move constants
- MODIFIED Requirements → Tasks: update imports in `dndBeyondCharacterImport.ts`, rename call sites

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: All existing tests pass after extraction

- **Given** the full test suite as it exists before this change
- **When** `npm test` (or equivalent) is run after implementation
- **Then** all tests pass with zero modifications to test files

#### Scenario: TypeScript compilation succeeds

- **Given** the codebase after implementation
- **When** `tsc --noEmit` is run
- **Then** it exits with code 0 and reports no errors
