## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED Encounter deletion removes the record from the database

The system SHALL delete the encounter document from MongoDB when a confirmed delete request is received, such that the encounter does not reappear after the UI refreshes.

Previously the deletion silently failed because `loadEncounters` returned entities with `id` set to the MongoDB ObjectId string instead of the stored UUID. The corrected loader returns the UUID, making `deleteOne({ id, userId })` match correctly.

#### Scenario: Confirmed deletion removes encounter

- **Given** an authenticated user has at least one encounter
- **When** a DELETE request is sent to /api/encounters/[id] with a valid auth token
- **Then** the API returns HTTP 200
- **And** a subsequent GET /api/encounters does not include the deleted encounter

#### Scenario: Deletion of one encounter does not affect other encounters

- **Given** an authenticated user has two or more encounters
- **When** one encounter is deleted
- **Then** only that encounter is removed
- **And** remaining encounters are unaffected

#### Scenario: Unauthenticated delete request is rejected

- **Given** a DELETE request to /api/encounters/[id] is made without a valid auth token
- **When** the request is processed
- **Then** the API returns HTTP 401
- **And** no document is deleted

## REMOVED Requirements

None removed.

## Traceability

- Proposal element (fix `loadEncounters` id ordering) → Requirement: MODIFIED Encounter deletion removes the record
- Design decision 1 (fix at the loader) → Requirement: MODIFIED Encounter deletion removes the record
- Requirement → Tasks: `tasks.md` — Fix loadEncounters in lib/storage.ts

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Delete operation is idempotent for the owning user

- **Given** an encounter has been deleted
- **When** a second DELETE request is sent for the same encounter ID
- **Then** the API returns HTTP 404 (not found)
- **And** no other data is affected

### Requirement: Security

#### Scenario: User cannot delete another user's encounter

- **Given** User A and User B each have an encounter
- **When** User A sends a DELETE request for User B's encounter ID
- **Then** the API returns HTTP 404
- **And** User B's encounter is not deleted
