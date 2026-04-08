## Purpose
Define alignment validation behavior for all character and monster write endpoints.

## Requirements

### Requirement: Write endpoints reject invalid alignment values
The system SHALL reject requests containing an invalid `alignment` value on all six write endpoints, returning HTTP 400 with `{ "error": "Invalid alignment" }`.

The affected endpoints are:
- `POST /api/characters`
- `PUT /api/characters/[id]`
- `POST /api/monsters`
- `PUT /api/monsters/[id]`
- `POST /api/monsters/global`
- `PUT /api/monsters/global/[id]`

#### Scenario: Invalid alignment value is rejected
- **GIVEN** a valid request body otherwise
- **WHEN** the request includes `alignment: "chaotic pancake"`
- **THEN** the endpoint returns HTTP 400 with `{ "error": "Invalid alignment" }`

### Requirement: Write endpoints normalize valid alignment input
The system SHALL normalize semantically valid alignment input to the canonical `DnDAlignment` value before persistence.

#### Scenario: Canonical alignment is accepted unchanged
- **GIVEN** a valid request body
- **WHEN** the request includes `alignment: "Neutral Good"`
- **THEN** the endpoint succeeds and persists `"Neutral Good"`

#### Scenario: Alignment casing and whitespace are normalized
- **GIVEN** a valid request body
- **WHEN** the request includes `alignment: " neutral good "`
- **THEN** the endpoint succeeds and persists `"Neutral Good"`

#### Scenario: Omitted alignment is accepted
- **GIVEN** a valid request body
- **WHEN** the request omits the `alignment` field
- **THEN** the endpoint succeeds and stores `alignment` as `undefined`

#### Scenario: Empty string alignment is treated as absent
- **GIVEN** a valid request body
- **WHEN** the request includes `alignment: ""`
- **THEN** the endpoint succeeds and stores `alignment` as `undefined`

### Requirement: Alignment validation runs before database writes
The system SHALL validate or normalize the `alignment` field before any database write occurs.

#### Scenario: Invalid alignment does not reach persistence
- **GIVEN** a POST to `/api/characters` with `alignment: "true neutral"`
- **WHEN** the request is processed
- **THEN** no database write occurs
- **AND** the endpoint returns HTTP 400
