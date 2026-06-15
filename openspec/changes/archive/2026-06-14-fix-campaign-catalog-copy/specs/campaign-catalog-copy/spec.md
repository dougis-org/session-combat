## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign copy creates accessible campaign with member record

The system SHALL, when a user copies a global campaign template, persist both a campaign document and an active `campaignMembers` record for the requesting user (role: dm), such that the copied campaign is immediately accessible via the campaign detail API.

#### Scenario: Successful copy — campaign accessible and member record persisted

- **Given** a valid global campaign template exists with id `<templateId>`
- **And** the user is authenticated
- **When** the user sends `POST /api/campaigns/global/<templateId>/copy`
- **Then** the response status is `201`
- **And** `GET /api/campaigns/<newId>` returns `200` with the campaign data
- **And** the `campaignMembers` collection contains a record with `{ campaignId: <newId>, userId: <user>, role: 'dm', status: 'active' }`

#### Scenario: Template not found

- **Given** no global campaign template exists with the given id
- **When** the user sends `POST /api/campaigns/global/<missingId>/copy`
- **Then** the response status is `404`
- **And** no campaign document is created
- **And** no member record is created

#### Scenario: Member insert failure — campaign rolled back

- **Given** `storage.saveCampaign` succeeds
- **And** `storage.addMember` throws an error
- **When** the copy is attempted
- **Then** the response status is `500`
- **And** `storage.deleteCampaign` is called to roll back the campaign
- **And** no campaign document remains in the database for the attempted copy

## MODIFIED Requirements

_(none)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal element "Fix copy route to create member record with rollback" → Requirement: ADDED Campaign copy creates accessible campaign with member record
- Design decision 1 (match POST /api/campaigns pattern) → Requirement: ADDED Campaign copy creates accessible campaign with member record
- Requirement: ADDED Campaign copy creates accessible campaign with member record → Task: Fix copy route + integration test task

## Non-Functional Acceptance Criteria

### Requirement: Reliability

The system SHALL ensure no orphaned campaign or member records remain in the database if a partial failure occurs during the copy process, as specified in the functional "Scenario: Member insert failure — campaign rolled back".

### Requirement: Security

> Unauthenticated requests to the copy endpoint are rejected with HTTP 401 by the `withAuthAndParams` middleware before any copy logic executes; no distinct NFAC scenario is needed beyond the auth middleware guarantee.
