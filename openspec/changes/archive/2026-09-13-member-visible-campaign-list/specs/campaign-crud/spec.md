## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

### Requirement: MODIFIED Listing campaigns returns only the user's own campaigns

The system SHALL return, from `GET /api/campaigns`, every campaign for which the authenticated user holds an `active` or `invited` `CampaignMember` record — not only campaigns the user owns — annotated per the "Campaign list entries are labeled with the caller's membership role and status" requirement above.

#### Scenario: Listing campaigns returns owned and member campaigns, not unrelated ones

- **Given** user A owns campaign X; user B holds an `active` `player` membership on campaign Y (owned by user C); user B holds no membership on campaign X
- **When** user B calls `GET /api/campaigns`
- **Then** the response contains campaign Y (with `memberRole: "player"`) and does not contain campaign X

## Traceability

- Proposal element: "Replace the owner-only campaign query behind `GET /api/campaigns` with a membership-based query" -> Requirement: "MODIFIED Listing campaigns returns only the user's own campaigns"
- Proposal element: "annotated with `role` and `status`" -> Requirement: "ADDED Campaign list entries are labeled with the caller's membership role and status"
- Proposal element: "Invited rows offer inline Accept/Decline wired to the existing `PATCH /api/campaigns/[id]/members/me` endpoint" -> Requirement: "ADDED Invited campaign list entries support inline accept/decline"
- Design decision: Decision 1 (collapse `loadCampaigns` into a single membership-based query) -> Requirement: "MODIFIED Listing campaigns returns only the user's own campaigns", "ADDED Campaign list entries are labeled with the caller's membership role and status"
- Design decision: Decision 4 (accept/decline stays on the list card) -> Requirement: "ADDED Invited campaign list entries support inline accept/decline"
- Requirement: "MODIFIED Listing campaigns returns only the user's own campaigns" -> Task(s): rewrite `campaignRepo.loadCampaigns` query; update `GET /api/campaigns` route; unit + integration tests
- Requirement: "ADDED Campaign list entries are labeled with the caller's membership role and status" -> Task(s): add `memberRole`/`memberStatus` to query result; `campaignRepo` unit tests for each status/role combination
- Requirement: "ADDED Invited campaign list entries support inline accept/decline" -> Task(s): `PlayerCampaignCard` Accept/Decline wiring; RTL tests

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "A user with no membership in a campaign never sees it", "Declined or removed memberships are excluded from the list" — visibility remains strictly membership-driven; no broadening of access beyond a user's own live (`active`/`invited`) `CampaignMember` records is introduced by this change.

### Requirement: Reliability

See functional scenario: "Invited entries do not link to the campaign detail page" — this prevents users from being routed to a page (`/campaigns/[id]`) that would 404 for their current membership status, which is a client-side reliability concern rather than a new access-control property.
