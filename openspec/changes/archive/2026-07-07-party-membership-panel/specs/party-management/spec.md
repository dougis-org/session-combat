## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign-scoped party listing for active members

The system SHALL allow any active member of a campaign (any role) to retrieve all parties belonging to that campaign via `GET /api/campaigns/{id}/parties`, regardless of whether the caller owns those parties.

#### Scenario: Active member lists campaign parties

- **Given** a user is an active member (any role) of campaign C, which has parties P1 and P2 owned by other users
- **When** the user sends `GET /api/campaigns/C/parties`
- **Then** a 200 OK is returned with an array containing P1 and P2

#### Scenario: Non-member denied

- **Given** a user is not a member of campaign C
- **When** the user sends `GET /api/campaigns/C/parties`
- **Then** a 403 Forbidden or 404 Not Found is returned and no party data is included in the response

#### Scenario: Inactive member denied

- **Given** a user's membership in campaign C has `status` other than `active` (e.g. `left` or `removed`)
- **When** the user sends `GET /api/campaigns/C/parties`
- **Then** a 403 Forbidden or 404 Not Found is returned and no party data is included in the response

#### Scenario: Campaign with no parties

- **Given** an active member of campaign C, which has zero parties
- **When** the user sends `GET /api/campaigns/C/parties`
- **Then** a 200 OK is returned with an empty array

## Traceability

- Proposal element -> Requirement: New `GET /api/campaigns/{id}/parties` endpoint -> ADDED Campaign-scoped party listing for active members
- Design decision -> Requirement: Decision 1 -> ADDED Campaign-scoped party listing for active members
- Requirement -> Task(s): See `tasks.md` in `party-membership-panel`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a standard API request under normal load
- **When** a campaign's parties are listed
- **Then** the endpoint returns within 500ms

### Requirement: Security

See functional scenarios: "Non-member denied", "Inactive member denied".

### Requirement: Reliability

#### Scenario: Storage read failure

- **Given** the underlying party storage read throws an error
- **When** `GET /api/campaigns/{id}/parties` is called
- **Then** a 500 Internal Server Error is returned with a generic error body (no stack trace or internal detail leaked)
