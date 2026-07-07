## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign creation auto-creates a default party

The system SHALL create a default `Party` named "Main Party", linked to the new campaign via `campaignId` and owned by the creating user, whenever a campaign is created via `POST /api/campaigns`.

#### Scenario: Creating a campaign creates a linked default party

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with `{ name: "My Campaign" }`
- **Then** the response is 201 with the campaign object (unchanged shape); a `Party` exists with `name: "Main Party"`, `campaignId` equal to the new campaign's `id`, `userId` equal to the authenticated user's id, and an empty `members` array

#### Scenario: Default party is created before the DM member record

- **Given** an authenticated user creating a campaign
- **When** the campaign is created
- **Then** the `Party` is saved after the `Campaign` is saved and before the `CampaignMember` (DM) record is saved

### Requirement: ADDED Campaign creation rolls back the default party on later failure

The system SHALL delete the newly created `Party` (and the newly created `Campaign`) if a later step in campaign creation fails, so no partial state persists.

#### Scenario: Member creation fails after party creation succeeds

- **Given** an authenticated user
- **When** they POST `/api/campaigns` and `storage.addMember` throws after the campaign and default party were both saved
- **Then** the response is 500; the newly created `Party` no longer exists; the newly created `Campaign` no longer exists

#### Scenario: Party creation fails after campaign creation succeeds

- **Given** an authenticated user
- **When** they POST `/api/campaigns` and `storage.saveParty` throws after the campaign was saved
- **Then** the response is 500; the newly created `Campaign` no longer exists; no `CampaignMember` record was created for it

## MODIFIED Requirements

### Requirement: MODIFIED Creating a campaign with all fields

The system SHALL provide authenticated REST API endpoints to create, read, update, and delete campaigns scoped to the authenticated user, and creating a campaign SHALL additionally result in a default `Party` linked to it.

#### Scenario: Creating a campaign with all fields

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with `{ name, moduleName, status, notes, chapters, currentChapterId }`
- **Then** the campaign is persisted with a generated `id`, the supplied `userId`, and `createdAt`/`updatedAt` timestamps; the response is 201 with the full campaign object; a linked default `Party` and a `CampaignMember` (DM) record are also created

## Traceability

- Proposal element: "Extend `POST /api/campaigns` to create a default 'Main Party'" -> Requirement: "ADDED Campaign creation auto-creates a default party"
- Proposal element: "Rollback on partial failure" -> Requirement: "ADDED Campaign creation rolls back the default party on later failure"
- Design decision: Decision 1 (extend saga, party before member) -> Requirement: "ADDED Campaign creation auto-creates a default party" (ordering scenario), "ADDED Campaign creation rolls back the default party on later failure"
- Design decision: Decision 2 (party shape) -> Requirement: "ADDED Campaign creation auto-creates a default party"
- Design decision: Decision 3 (no response contract change) -> Requirement: "MODIFIED Creating a campaign with all fields"
- Requirement: "ADDED Campaign creation auto-creates a default party" -> Task(s): implement party creation in POST handler; integration test for linked party
- Requirement: "ADDED Campaign creation rolls back the default party on later failure" -> Task(s): implement ordered rollback; unit tests mocking storage failures

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No orphaned records after partial failure

- **Given** a `POST /api/campaigns` request where a downstream step (party save or member save) throws
- **When** the request completes with a 500 response
- **Then** no `Campaign`, `Party`, or `CampaignMember` row exists in storage for the attempted creation

### Requirement: Security

See functional scenarios: "Member creation fails after party creation succeeds", "Party creation fails after campaign creation succeeds" — access remains scoped to the authenticated user's own records throughout; no new access-control surface is introduced by this change.
