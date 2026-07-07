## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Campaign CRUD API

The system SHALL provide authenticated REST API endpoints to create, read, update, and delete campaigns scoped to the authenticated user.

#### Scenario: Creating a campaign with all fields

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with `{ name, moduleName, status, notes, chapters, currentChapterId }`
- **Then** the campaign is persisted with a generated `id`, the supplied `userId`, and `createdAt`/`updatedAt` timestamps; the response is 201 with the full campaign object; a linked default `Party` and a `CampaignMember` (DM) record are also created

#### Scenario: Creating a campaign with only required fields

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with only `{ name }`
- **Then** the campaign is created with `moduleName` defaulting to `""`, `currentChapter` to `""`, `currentChapterOrder` to `0`, and `active` to `false`; response is 201

#### Scenario: Creating a campaign without a name

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with a missing or blank `name`
- **Then** the response is 400 with an error message

#### Scenario: Listing campaigns returns only the user's own campaigns

- **Given** two users each with one campaign
- **When** user A calls `GET /api/campaigns`
- **Then** the response contains only user A's campaign, not user B's

#### Scenario: Listing campaigns when none exist

- **Given** an authenticated user with no campaigns
- **When** they call `GET /api/campaigns`
- **Then** the response is 200 with an empty array

#### Scenario: Getting a single campaign by id

- **Given** an authenticated user with an existing campaign
- **When** they call `GET /api/campaigns/[id]`
- **Then** the response is 200 with the full campaign object

#### Scenario: Getting a campaign that belongs to another user

- **Given** user A owns campaign X
- **When** user B calls `GET /api/campaigns/[id-of-X]`
- **Then** the response is 404

#### Scenario: Patching a campaign updates only provided fields

- **Given** an authenticated user with an existing campaign
- **When** they PATCH `/api/campaigns/[id]` with `{ currentChapter: "Chapter 5" }`
- **Then** only `currentChapter` and `updatedAt` change; all other fields remain as before

#### Scenario: Multiple campaigns can be active simultaneously

- **Given** an authenticated user
- **When** they create two campaigns both with `active: true`
- **Then** both persist with `active: true`; no deactivation side-effect occurs

#### Scenario: Deleting a campaign

- **Given** an authenticated user with an existing campaign
- **When** they call `DELETE /api/campaigns/[id]`
- **Then** the response is 200 (or 204); subsequent `GET /api/campaigns/[id]` returns 404

#### Scenario: Unauthenticated request is rejected

- **Given** a request with no auth token
- **When** any campaign endpoint is called
- **Then** the response is 401

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

See "Creating a campaign with all fields" scenario above (ADDED Requirements section) for the updated behavior.

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Campaign data model" → Requirement: Campaign CRUD API
- Design decision 1 (TypeScript interface) → all campaign storage scenarios
- Design decision 2 (no active uniqueness) → Scenario: Multiple campaigns can be active simultaneously
- Design decision 6 (API route pattern) → all API scenarios
- Requirement → Tasks: data model task, storage task, API routes tasks

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: User isolation

- **Given** two authenticated users each owning campaigns
- **When** one user calls any campaign endpoint with the other user's campaign ID
- **Then** the response is 404 (not 403 — do not reveal existence)

#### Scenario: All routes require auth

- **Given** an unauthenticated caller
- **When** any of the five campaign endpoints is called
- **Then** the response is 401

### Requirement: Reliability

#### Scenario: Missing campaign handled gracefully

- **Given** a valid authenticated user
- **When** they request a campaign ID that does not exist
- **Then** the API returns 404 without throwing an unhandled error

#### Scenario: No orphaned records after partial failure

- **Given** a `POST /api/campaigns` request where a downstream step (party save or member save) throws
- **When** the request completes with a 500 response
- **Then** no `Campaign`, `Party`, or `CampaignMember` row exists in storage for the attempted creation
