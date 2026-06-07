## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED List campaign members with usernames, roles, and statuses

The system SHALL expose `GET /api/campaigns/[id]/members` returning all members enriched with their usernames, and SHALL render the list on the campaign home page at `/campaigns/[id]`.

#### Scenario: Active member retrieves member list

- **Given** a campaign exists with members (DM + 2 players, one invited, one active)
- **When** an active member calls `GET /api/campaigns/[id]/members`
- **Then** the response is `200` with `{ members: [...] }` where each entry contains `id`, `userId`, `username`, `role`, and `status`

#### Scenario: Non-member is denied access

- **Given** an authenticated user who is not a member of the campaign
- **When** they call `GET /api/campaigns/[id]/members`
- **Then** the response is `403 Forbidden`

#### Scenario: Unauthenticated request is rejected

- **Given** no auth token in the request
- **When** `GET /api/campaigns/[id]/members` is called
- **Then** the response is `401 Unauthorized`

#### Scenario: Campaign home page renders member list

- **Given** the current user is an active member of the campaign
- **When** they navigate to `/campaigns/[id]`
- **Then** the page renders a list of all members with username, role badge, and status badge

#### Scenario: Invited member shows pending badge

- **Given** a member with `status: "invited"` in the campaign
- **When** the campaign home page is rendered
- **Then** that member row displays a distinct "Invited" badge

#### Scenario: Non-DM sees read-only list

- **Given** the current user has `role: "player"` in the campaign
- **When** they view the campaign home page
- **Then** the invite section is not rendered and no Remove buttons are visible

#### Scenario: DM sees invite section and remove controls

- **Given** the current user has `role: "dm"` and `status: "active"` in the campaign
- **When** they view the campaign home page
- **Then** the invite search section is visible and each member row (except their own) has a Remove button

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "Member list with roles/status" → Requirement: List campaign members
- Design decision 1 (access control) → Scenario: Non-member denied, Unauthenticated rejected
- Design decision 2 (username enrichment) → Scenario: Active member retrieves list
- Design decision 5 (single-file UI) → Scenario: Campaign home page renders member list
- Requirement → Tasks: task-3 (GET API), task-5 (UI page)

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Access control — non-member blocked

- **Given** a valid auth token for a user not in the campaign
- **When** `GET /api/campaigns/[id]/members` is called
- **Then** `403` is returned and no member data is exposed

### Requirement: Performance

#### Scenario: Member list loaded with no N+1 queries

- **Given** a campaign with up to 20 members
- **When** `GET /api/campaigns/[id]/members` is called
- **Then** the handler issues exactly 2 DB queries (list members + $in username lookup)
