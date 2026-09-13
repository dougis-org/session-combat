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
- **Then** the campaign is created with `moduleName` defaulting to `""`, `status` to `"active"`, `notes` to `""`, `chapters` to `[]`, and `currentChapterId` to `undefined`; response is 201

#### Scenario: Creating a campaign without a name

- **Given** an authenticated user
- **When** they POST `/api/campaigns` with a missing or blank `name`
- **Then** the response is 400 with an error message

#### Scenario: Listing campaigns returns owned and member campaigns, not unrelated ones

- **Given** user A owns campaign X; user B holds an `active` `player` membership on campaign Y (owned by user C); user B holds no membership on campaign X
- **When** user B calls `GET /api/campaigns`
- **Then** the response contains campaign Y (with `memberRole: "player"`) and does not contain campaign X

(Supersedes the earlier owner-only scenario — see "MODIFIED Listing campaigns returns only the user's own campaigns" below.)

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

The system SHALL attempt to delete the newly created `Party` (and the newly created `Campaign`) if a later step in campaign creation fails. Each rollback delete is attempted independently; if a rollback delete itself fails, the failure is logged and the original error is still raised, so cleanup is best-effort rather than guaranteed.

#### Scenario: Member creation fails after party creation succeeds

- **Given** an authenticated user
- **When** they POST `/api/campaigns` and `storage.addMember` throws after the campaign and default party were both saved
- **Then** the response is 500; deletion of the newly created `Party` and the newly created `Campaign` is attempted (each independently, with failures logged rather than swallowed)

#### Scenario: Party creation fails after campaign creation succeeds

- **Given** an authenticated user
- **When** they POST `/api/campaigns` and `storage.saveParty` throws after the campaign was saved
- **Then** the response is 500; deletion of the newly created `Campaign` is attempted; no `CampaignMember` record was created for it

### Requirement: ADDED Campaign list entries are labeled with the caller's membership role and status

The system SHALL annotate each campaign returned by `GET /api/campaigns` with the calling user's `memberRole` (`"dm"` or `"player"`) and `memberStatus` (`"active"` or `"invited"`), sourced from that user's own `CampaignMember` record for the campaign.

#### Scenario: DM-owned campaign is labeled with role "dm"

- **Given** an authenticated user who created campaign X
- **When** they call `GET /api/campaigns`
- **Then** campaign X appears in the response with `memberRole: "dm"` and `memberStatus: "active"`

#### Scenario: Campaign a user actively participates in as a player is labeled with role "player"

- **Given** user B holds an `active`, `player` `CampaignMember` record for campaign X owned by user A
- **When** user B calls `GET /api/campaigns`
- **Then** campaign X appears in user B's response with `memberRole: "player"` and `memberStatus: "active"`, alongside its full campaign fields (`name`, `moduleName`, `status`, `chapters`, `notes`, etc.)

#### Scenario: Campaign a user has been invited to but not yet accepted is labeled with status "invited"

- **Given** user B holds an `invited`, `player` `CampaignMember` record for campaign X owned by user A
- **When** user B calls `GET /api/campaigns`
- **Then** campaign X appears in user B's response with `memberRole: "player"` and `memberStatus: "invited"`

#### Scenario: Declined or removed memberships are excluded from the list

- **Given** user B holds a `declined` `CampaignMember` record for campaign X, and a `removed` `CampaignMember` record for campaign Y
- **When** user B calls `GET /api/campaigns`
- **Then** neither campaign X nor campaign Y appears in the response

#### Scenario: A user with no membership in a campaign never sees it

- **Given** user A owns campaign X and user B holds no `CampaignMember` record for campaign X at all
- **When** user B calls `GET /api/campaigns`
- **Then** campaign X does not appear in user B's response

### Requirement: ADDED Invited campaign list entries support inline accept/decline

The system SHALL allow a user to accept or decline an `invited` campaign membership directly from the campaign list, using the existing `PATCH /api/campaigns/[id]/members/me` endpoint, without requiring navigation to the campaign detail page.

#### Scenario: Accepting an invitation from the campaign list

- **Given** user B sees campaign X in their list with `memberStatus: "invited"`
- **When** user B triggers the Accept action for campaign X
- **Then** the client calls `PATCH /api/campaigns/[id-of-X]/members/me` with `{ action: "accept" }`; on success, campaign X's `memberStatus` becomes `"active"` on the next list refresh

#### Scenario: Declining an invitation from the campaign list

- **Given** user B sees campaign X in their list with `memberStatus: "invited"`
- **When** user B triggers the Decline action for campaign X
- **Then** the client calls `PATCH /api/campaigns/[id-of-X]/members/me` with `{ action: "decline" }`; on success, campaign X no longer appears in user B's list on the next refresh

#### Scenario: Invited entries do not link to the campaign detail page

- **Given** user B sees campaign X in their list with `memberStatus: "invited"`
- **When** the list renders campaign X's card
- **Then** the card does not render a link to `/campaigns/[id-of-X]` or any of its sub-pages (Members, Session Log, etc.), since `assertCampaignAccess` requires `memberStatus: "active"` and would 404 an invited-only member

## MODIFIED Requirements

### Requirement: MODIFIED Creating a campaign with all fields

The system SHALL provide authenticated REST API endpoints to create, read, update, and delete campaigns scoped to the authenticated user, and creating a campaign SHALL additionally result in a default `Party` linked to it.

See the "Creating a campaign with all fields" scenario above in the scenarios section for the updated behavior.

### Requirement: MODIFIED Listing campaigns returns only the user's own campaigns

The system SHALL return, from `GET /api/campaigns`, every campaign for which the authenticated user holds an `active` or `invited` `CampaignMember` record — not only campaigns the user owns — annotated per the "Campaign list entries are labeled with the caller's membership role and status" requirement above.

#### Scenario: Listing campaigns returns owned and member campaigns, not unrelated ones

- **Given** user A owns campaign X; user B holds an `active` `player` membership on campaign Y (owned by user C); user B holds no membership on campaign X
- **When** user B calls `GET /api/campaigns`
- **Then** the response contains campaign Y (with `memberRole: "player"`) and does not contain campaign X

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Campaign data model" → Requirement: Campaign CRUD API
- Design decision 1 (TypeScript interface) → all campaign storage scenarios
- Design decision 2 (no active uniqueness) → Scenario: Multiple campaigns can be active simultaneously
- Design decision 6 (API route pattern) → all API scenarios
- Requirement → Tasks: data model task, storage task, API routes tasks
- Proposal element (member-visible-campaign-list): "Replace the owner-only campaign query behind `GET /api/campaigns` with a membership-based query" → Requirement: "MODIFIED Listing campaigns returns only the user's own campaigns"
- Proposal element (member-visible-campaign-list): "annotated with `role` and `status`" → Requirement: "ADDED Campaign list entries are labeled with the caller's membership role and status"
- Proposal element (member-visible-campaign-list): "Invited rows offer inline Accept/Decline wired to the existing `PATCH /api/campaigns/[id]/members/me` endpoint" → Requirement: "ADDED Invited campaign list entries support inline accept/decline"

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

#### Scenario: Rollback is attempted after partial failure

- **Given** a `POST /api/campaigns` request where a downstream step (party save or member save) throws
- **When** the request completes with a 500 response
- **Then** deletion of the `Campaign` and any `Party` already saved for the attempted creation is attempted; if a rollback delete itself fails, the failure is logged (not swallowed) and the original error still surfaces as the 500 response
