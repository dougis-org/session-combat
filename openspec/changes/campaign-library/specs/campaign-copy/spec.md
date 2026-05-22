## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED POST /api/campaigns/global/[id]/copy — user copies template

The system SHALL expose an authenticated `POST /api/campaigns/global/[id]/copy` endpoint that creates a new user-owned `Campaign` document by copying the specified global template.

#### Scenario: Authenticated user copies a template

- **Given** a global campaign template with the given id exists
- **And** the requester has a valid user session
- **When** `POST /api/campaigns/global/[id]/copy` is called
- **Then** the response is `201` with a new `Campaign` object where:
  - `userId` equals the authenticated user's id
  - `name` equals the template's `name`
  - `moduleName` equals the template's `moduleName`
  - `chapters` is a deep copy of the template's chapters array (new `id`s generated for each chapter)
  - `currentChapterId` is set to the id of the first chapter if chapters are present, otherwise undefined
  - `templateId` equals the source template's `id`
  - `active` is `false`

#### Scenario: Unauthenticated copy attempt is rejected

- **Given** no session is present
- **When** `POST /api/campaigns/global/[id]/copy` is called
- **Then** the response is `401 Unauthorized`

#### Scenario: Copy of non-existent template

- **Given** no template with the given id exists
- **When** `POST /api/campaigns/global/[id]/copy` is called by an authenticated user
- **Then** the response is `404 Not Found`

#### Scenario: User copies same template twice

- **Given** a user has already copied a template once
- **When** `POST /api/campaigns/global/[id]/copy` is called again by the same user
- **Then** a second, independent `Campaign` is created — no uniqueness constraint is enforced
- **And** both campaigns appear in the user's campaign list

#### Scenario: Copied campaign is independent of source template

- **Given** a user has copied a template
- **When** an admin deletes the source template
- **Then** the user's copied campaign is unaffected and remains fully readable

#### Scenario: Template with no chapters is copyable

- **Given** a global template with `chapters: []`
- **When** `POST /api/campaigns/global/[id]/copy` is called by an authenticated user
- **Then** the response is `201` with `chapters: []` and `currentChapterId: undefined`

## MODIFIED Requirements

None. This capability is entirely new.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Copy action creates a user-owned Campaign" -> Requirement: POST copy endpoint
- Design decision 3 (copy route at /api/campaigns/global/[id]/copy) -> Requirement: POST copy endpoint
- Requirement POST copy -> Task: Create app/api/campaigns/global/[id]/copy/route.ts
- Requirement POST copy -> Task: Ensure chapters deep-copied with new ids

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Copy requires authenticated session

- **Given** a request with no session
- **When** `POST /api/campaigns/global/[id]/copy` is called
- **Then** the response is `401` — the endpoint must not create a Campaign without a known userId

#### Scenario: User cannot copy into another user's account

- **Given** a valid session for user A
- **When** `POST /api/campaigns/global/[id]/copy` is called
- **Then** the resulting Campaign's `userId` is always derived from the session, never from the request body

### Requirement: Reliability

#### Scenario: Template deletion does not cascade to copied campaigns

- **Given** a Campaign was created via copy with `templateId` referencing a now-deleted template
- **When** the Campaign is read from storage
- **Then** it is returned successfully with all chapters intact (no FK cascade)
