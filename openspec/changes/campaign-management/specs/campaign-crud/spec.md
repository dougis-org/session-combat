## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Campaign CRUD API

The system SHALL provide authenticated REST API endpoints to create, read, update, and delete campaigns scoped to the authenticated user.

#### Scenario: Creating a campaign with all fields

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with `{ name, moduleName, currentChapter, currentChapterOrder, active }`
- **Then** the campaign is persisted with a generated `id`, the supplied `userId`, and `createdAt`/`updatedAt` timestamps; the response is 201 with the full campaign object

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

## MODIFIED Requirements

_None — campaign CRUD is entirely new._

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
