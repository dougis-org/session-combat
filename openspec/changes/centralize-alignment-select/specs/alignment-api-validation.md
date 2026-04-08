## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Alignment validation on all write endpoints

The system SHALL reject requests containing an invalid `alignment` value on all six write endpoints, returning HTTP 400 with a descriptive error message.

The affected endpoints are:
- `POST /api/characters`
- `PUT /api/characters/[id]`
- `POST /api/monsters`
- `PUT /api/monsters/[id]`
- `POST /api/monsters/global`
- `PUT /api/monsters/global/[id]`

#### Scenario: Invalid alignment value is rejected

- **Given** a valid request body otherwise (e.g., with a valid character name)
- **When** the request includes `alignment: "chaotic pancake"` (not in `VALID_ALIGNMENTS`)
- **Then** the endpoint returns HTTP 400 with body `{ "error": "Invalid alignment" }`

#### Scenario: Valid alignment value is accepted

- **Given** a valid request body
- **When** the request includes `alignment: "neutral good"` (in `VALID_ALIGNMENTS`)
- **Then** the endpoint proceeds normally and returns HTTP 201 (POST) or HTTP 200 (PUT)

#### Scenario: Omitted alignment is accepted

- **Given** a valid request body
- **When** the request does not include an `alignment` field (field is `undefined`)
- **Then** the endpoint proceeds normally; alignment is stored as `undefined`

#### Scenario: Empty string alignment is treated as absent

- **Given** a valid request body
- **When** the request includes `alignment: ""`
- **Then** the endpoint proceeds normally; the empty string is handled as no alignment (consistent with existing `alignment || undefined` pattern in routes)

## MODIFIED Requirements

### Requirement: MODIFIED Character and monster write endpoints

The system SHALL validate the `alignment` field if present, applying `isValidAlignment()` before any database write.

#### Scenario: Validation runs before DB write

- **Given** a POST to `/api/characters` with `alignment: "true neutral"` (invalid — not in the standard 9)
- **When** the request is processed
- **Then** no database write occurs and HTTP 400 is returned

## REMOVED Requirements

### Requirement: REMOVED Unrestricted alignment values in API

Reason for removal: Previously any string could be stored as alignment via direct API call. This is superseded by the `isValidAlignment()` guard on all write endpoints.

## Traceability

- Proposal element "API validation on 6 write endpoints" → Requirement: ADDED Alignment validation on all write endpoints
- Design Decision 3 (inline guard pattern) → all six endpoint scenarios
- Requirement: ADDED API validation → Task: Add isValidAlignment guard to each of 6 routes

## Non-Functional Acceptance Criteria

### Requirement: Security / Data integrity

#### Scenario: Direct API call cannot bypass UI constraints

- **Given** a client calls `POST /api/characters` directly (bypassing the UI)
- **When** the body contains `alignment: "not a real alignment"`
- **Then** the server returns HTTP 400 and the invalid value is never persisted to the database

### Requirement: Reliability

#### Scenario: Valid requests are not affected by the new guard

- **Given** the application is in normal operation with the validation guard in place
- **When** the UI submits a character or monster with a valid alignment (or no alignment)
- **Then** all saves succeed as before; no regressions in existing functionality
