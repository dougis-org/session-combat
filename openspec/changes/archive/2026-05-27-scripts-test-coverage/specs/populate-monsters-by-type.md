## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED populateMonstersByType is importable without auto-executing

The system SHALL allow `populateMonstersByType.js` to be imported as a module without triggering HTTP requests or file-system writes.

#### Scenario: Import without execution

- **Given** a test file that imports `populateMonstersByType.js`
- **When** the module is loaded
- **Then** no HTTP requests are made and no files are written

### Requirement: ADDED normalizeType maps swarm types to "beast"

The system SHALL return `"beast"` for any monster type string that contains the word "swarm" (case-insensitive), and return the lowercased type otherwise.

#### Scenario: Swarm type is normalized

- **Given** a type string `"swarm of Tiny beasts"`
- **When** `normalizeType` is called
- **Then** it returns `"beast"`

#### Scenario: Standard type is lowercased

- **Given** a type string `"Humanoid"`
- **When** `normalizeType` is called
- **Then** it returns `"humanoid"`

#### Scenario: Already-lowercase type is returned unchanged

- **Given** a type string `"undead"`
- **When** `normalizeType` is called
- **Then** it returns `"undead"`

### Requirement: ADDED getCRExperience returns correct XP for known challenge ratings

The system SHALL return the correct XP value for every CR in the standard D&D 5e table, and return 0 for unknown CRs.

#### Scenario: Known CR returns correct XP

- **Given** a challenge rating of `1`
- **When** `getCRExperience` is called
- **Then** it returns `200`

#### Scenario: Fractional CR is handled

- **Given** a challenge rating of `0.5`
- **When** `getCRExperience` is called
- **Then** it returns `100`

#### Scenario: Unknown CR returns 0

- **Given** a challenge rating of `99`
- **When** `getCRExperience` is called
- **Then** it returns `0`

### Requirement: ADDED transformMonster maps Open5E API response to MonsterTemplate schema

The system SHALL produce a correctly structured object from a valid Open5E API monster response, with appropriate defaults when optional fields are absent.

#### Scenario: Full monster response is transformed correctly

- **Given** a mock Open5E API response with all fields populated (AC, proficiencies, senses, actions, traits, languages)
- **When** `transformMonster` is called
- **Then** the result has `name`, `type`, `hp`, `ac`, `abilities`, `challengeRating`, `experiencePoints`, `source: "SRD"`, and correctly mapped `actions`, `traits`, `savingThrows`, `skills`

#### Scenario: Monster with no proficiencies is handled

- **Given** a mock API response with `proficiencies: []`
- **When** `transformMonster` is called
- **Then** `savingThrows` and `skills` are absent from the result (not empty objects)

#### Scenario: Monster with no senses is handled

- **Given** a mock API response with `senses: null` or `senses` absent
- **When** `transformMonster` is called
- **Then** `senses` in the result is an empty string `""`

#### Scenario: Monster with no actions is handled

- **Given** a mock API response with `actions: []` or `actions` absent
- **When** `transformMonster` is called
- **Then** `actions` is absent from the result

#### Scenario: transformMonster uses getCRExperience when xp is absent

- **Given** a mock API response with no `xp` field and `challenge_rating: 5`
- **When** `transformMonster` is called
- **Then** `experiencePoints === 1800`

### Requirement: ADDED generateTypeFile produces correctly structured TypeScript file content

The system SHALL write a `.ts` file to the specified output directory containing a named array export of the correct type, matching the pluralization convention.

#### Scenario: Generated file has correct export name

- **Given** monster type `"beast"` and an array of transformed monsters
- **When** `generateTypeFile` is called with a temp directory
- **Then** the written file contains `export const BEASTS:`

#### Scenario: Already-plural type is not double-pluralized

- **Given** monster type `"undead"` (does not end in "s")
- **When** `generateTypeFile` is called
- **Then** the written file contains `export const UNDEADS:` (appends S)

#### Scenario: File is written to specified directory

- **Given** a writable temp directory path
- **When** `generateTypeFile` is called with type `"beast"` and a monster array
- **Then** the file `beasts.ts` exists in that directory

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "add require.main guard to populateMonstersByType.js" -> Requirement: importable without auto-executing
- Proposal element "export normalizeType, getCRExperience, transformMonster, generateTypeFile" -> All unit test requirements
- Design decision 2 (export pure functions) -> Requirements: normalizeType, getCRExperience, transformMonster, generateTypeFile
- Design decision 4 (generateTypeFile temp-dir I/O) -> Requirement: generateTypeFile produces correct content
- Requirements -> Task: T2 (guard + exports), T4 (unit tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: CLI direct execution still works after exports are added

- **Given** `module.exports` additions at the bottom of `populateMonstersByType.js`
- **When** the script is run directly via `node lib/scripts/populateMonstersByType.js`
- **Then** execution proceeds as before (`require.main === module` is `true`)
