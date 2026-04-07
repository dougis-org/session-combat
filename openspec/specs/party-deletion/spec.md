## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED Party deletion removes the record from the database

The system SHALL delete the party document from MongoDB when a confirmed delete request is received, such that the party does not reappear after the UI refreshes.

Previously the deletion silently failed (`deleteOne` matched zero documents) because `loadParties` returned entities with `id` set to the MongoDB ObjectId string instead of the stored UUID. The corrected loader returns the UUID, making the `deleteOne({ id, userId })` query match correctly.

#### Scenario: Confirmed deletion removes party from list

- **Given** an authenticated user has at least one party
- **When** the user clicks Delete on a party and confirms the dialog
- **Then** the DELETE API returns HTTP 200
- **And** the party no longer appears in the party list after the UI re-fetches
- **And** a subsequent GET /api/parties does not include the deleted party

#### Scenario: Deletion of one party does not affect other parties

- **Given** an authenticated user has two or more parties
- **When** the user deletes one party and confirms the dialog
- **Then** only the targeted party is removed from the list
- **And** the remaining parties are still visible

#### Scenario: Declining the confirmation dialog cancels deletion

- **Given** an authenticated user has at least one party
- **When** the user clicks Delete but dismisses the confirmation dialog
- **Then** the DELETE API is not called
- **And** the party remains in the list

#### Scenario: Unauthenticated delete request is rejected

- **Given** a DELETE request to /api/parties/[id] is made without a valid auth token
- **When** the request is processed
- **Then** the API returns HTTP 401
- **And** no document is deleted

## REMOVED Requirements

None removed.

## Traceability

- Proposal element (fix `loadParties` id ordering) → Requirement: MODIFIED Party deletion removes the record
- Design decision 1 (fix at the loader) → Requirement: MODIFIED Party deletion removes the record
- Requirement → Tasks: `tasks.md` — Fix loadParties in lib/storage.ts; verify E2E party deletion test

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Delete API response reflects actual outcome

- **Given** a party exists in the database
- **When** a valid authenticated DELETE request is processed
- **Then** the API returns HTTP 200 with `{ message: 'Party deleted successfully' }`
- **And** the party document no longer exists in the `parties` collection

### Requirement: Security

#### Scenario: User cannot delete another user's party

- **Given** User A and User B each have a party
- **When** User A sends a DELETE request for User B's party ID
- **Then** the API returns HTTP 404 (party not found for User A's userId)
- **And** User B's party is not deleted
