## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Character carries a characterType field

The system SHALL store `characterType` as one of `'character'`, `'npc'`, or `'companion'` on every `Character` document. New documents without an explicit value SHALL default to `'character'`.

#### Scenario: New character defaults to 'character' type

- **Given** a user POSTs to `/api/characters` with no `characterType` field in the body
- **When** the response is returned
- **Then** the response body includes `characterType: 'character'`
- **And** the document in the database has `characterType: 'character'`

#### Scenario: Create character as travelling NPC

- **Given** a user POSTs to `/api/characters` with `characterType: 'npc'`
- **When** the response is returned
- **Then** the response body includes `characterType: 'npc'`
- **And** the character carries the full `CreatureStats` fields (`ac`, `hp`, `abilityScores`, etc.)

#### Scenario: Create character as companion

- **Given** a user POSTs to `/api/characters` with `characterType: 'companion'`
- **When** the response is returned
- **Then** the response body includes `characterType: 'companion'`

#### Scenario: Invalid characterType is rejected

- **Given** a user POSTs to `/api/characters` with `characterType: 'villain'`
- **When** the server processes the request
- **Then** the response status is `400`
- **And** the response body contains a validation error describing the invalid value

### Requirement: ADDED characterType persists through update

The system SHALL update `characterType` when a valid value is supplied in a PUT request.

#### Scenario: Update characterType from 'character' to 'npc'

- **Given** an existing character with `characterType: 'character'`
- **When** a user PUTs to `/api/characters/[id]` with `characterType: 'npc'`
- **Then** a subsequent GET returns `characterType: 'npc'`

#### Scenario: Update leaves characterType unchanged when field omitted

- **Given** an existing character with `characterType: 'companion'`
- **When** a user PUTs to `/api/characters/[id]` with no `characterType` in the body
- **Then** a subsequent GET still returns `characterType: 'companion'`

### Requirement: ADDED GET /api/characters supports characterType filter

The system SHALL filter the character list when `?characterType=character|npc|companion` is provided. Omitting the param or passing `?characterType=all` SHALL return all characters.

#### Scenario: Filter returns only NPCs

- **Given** the database contains one character of each type (character, npc, companion)
- **When** a user GETs `/api/characters?characterType=npc`
- **Then** the response contains exactly the NPC character
- **And** no characters with `characterType: 'character'` or `'companion'` are included

#### Scenario: Filter with 'all' returns every character

- **Given** the database contains characters of all three types
- **When** a user GETs `/api/characters?characterType=all`
- **Then** the response contains all three characters

#### Scenario: Omitting the filter returns every character

- **Given** the database contains characters of all three types
- **When** a user GETs `/api/characters` with no `characterType` query param
- **Then** the response contains all three characters

#### Scenario: Filter returns empty array when no matches

- **Given** the database contains only player characters (no NPCs or companions)
- **When** a user GETs `/api/characters?characterType=npc`
- **Then** the response is an empty array with status `200`

### Requirement: ADDED Characters list groups members by type

The system SHALL render the characters list (`app/characters/page.tsx`) with one section per `characterType`. Sections with no members SHALL be hidden.

#### Scenario: Characters grouped into labelled sections

- **Given** the user has characters of all three types
- **When** the characters page loads
- **Then** three sections are visible: "Player Characters", "Travelling NPCs", "Companions"
- **And** each character appears only in its own type's section

#### Scenario: Empty sections are hidden

- **Given** the user has player characters and companions but no NPCs
- **When** the characters page loads
- **Then** the "Travelling NPCs" section is not rendered
- **And** "Player Characters" and "Companions" sections are visible

#### Scenario: Type filter control narrows visible section

- **Given** the characters page is loaded with characters of all three types
- **When** the user selects "Travelling NPCs only" from the filter control
- **Then** only the "Travelling NPCs" section is visible

### Requirement: ADDED CharacterEditor includes Type selector

The system SHALL include a Type selector (Player Character / Travelling NPC / Companion) in the `CharacterEditor` form. The selector SHALL default to "Player Character" for new characters.

#### Scenario: Type selector appears in editor

- **Given** the user opens the CharacterEditor for a new character
- **When** the form renders
- **Then** a Type selector is visible with options: Player Character, Travelling NPC, Companion
- **And** "Player Character" is selected by default

#### Scenario: Saved type is reflected in selector on edit

- **Given** an existing character with `characterType: 'npc'`
- **When** the user opens the CharacterEditor for that character
- **Then** the Type selector shows "Travelling NPC" as the current value

### Requirement: ADDED PartyEditor splits members by characterType

The system SHALL split the party member list in `app/parties/page.tsx` into sections: **Player Characters**, **Travelling NPCs**, **Companions**. Sections with no members SHALL be hidden.

#### Scenario: Party with all three types renders three sections

- **Given** a party whose characters include one of each type
- **When** the party is displayed
- **Then** three sections are visible: "Player Characters", "Travelling NPCs", "Companions"
- **And** each character appears in the correct section

#### Scenario: Party with only player characters renders one section

- **Given** a party whose characters are all `characterType: 'character'`
- **When** the party is displayed
- **Then** only the "Player Characters" section is rendered
- **And** no "Travelling NPCs" or "Companions" sections appear

## MODIFIED Requirements

### Requirement: MODIFIED Character CRUD API accepts characterType field

The system SHALL accept `characterType` as an optional field in POST and PUT request bodies, in addition to all previously accepted fields.

#### Scenario: Existing character fields unaffected by new field

- **Given** a POST body that does not include `characterType`
- **When** the character is created
- **Then** all other character fields persist normally
- **And** `characterType` defaults to `'character'`

## REMOVED Requirements

No requirements have been removed by this change.

## Traceability

- Proposal element "characterType field on Character" → Requirement: ADDED Character carries a characterType field
- Proposal element "API filter ?characterType=..." → Requirement: ADDED GET /api/characters supports characterType filter
- Proposal element "Characters list grouped by type" → Requirement: ADDED Characters list groups members by type
- Proposal element "CharacterEditor type selector" → Requirement: ADDED CharacterEditor includes Type selector
- Proposal element "Parties UI split by type" → Requirement: ADDED PartyEditor splits members by characterType
- Design Decision 1 → Requirement: ADDED Character carries a characterType field
- Design Decision 2 → Requirement: ADDED PartyEditor splits members by characterType
- Design Decision 3 → Requirement: ADDED GET /api/characters supports characterType filter
- Design Decision 4 → Non-Functional Reliability scenario (backward-compat)
- Design Decision 5 → Requirement: ADDED Characters list groups members by type; ADDED PartyEditor splits members by characterType
- All ADDED requirements → tasks.md Step 1–6

## Non-Functional Acceptance Criteria

### Requirement: Reliability — backward compatibility

#### Scenario: Existing character without characterType field in BSON

- **Given** a character document in the database that has no `characterType` key at the BSON level
- **When** the API returns that character
- **Then** the response includes `characterType: 'character'`
- **And** the character appears in the "Player Characters" section of the UI

### Requirement: Security — character API requires authentication

#### Scenario: Unauthenticated request to characters API

- **Given** a request with no valid session or auth token
- **When** the user GETs `/api/characters?characterType=npc`
- **Then** the response status is `401`
- **And** no character data is returned

### Requirement: Performance — character list load time

#### Scenario: List with filter remains fast

- **Given** a user with up to 50 characters of mixed types
- **When** the user GETs `/api/characters?characterType=npc`
- **Then** the response is returned within the existing latency budget for list endpoints (no regression)
