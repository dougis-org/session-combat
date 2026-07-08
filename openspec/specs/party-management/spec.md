## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-06-update-party-members-api/design.md) document, not a replacement.

### Requirement: ADDED Player-driven party management

The system SHALL allow players to add and remove their own characters from a campaign party.

#### Scenario: Player adds character to party

- **Given** a player who is an active member of campaign C, owns character X, and party P exists in campaign C
- **When** the player sends a PUT to `/api/campaigns/C/members/M/parties/P` with `{ "characterIds": ["X"] }`
- **Then** character X is added to the party with `addedAt` timestamp and a 200 OK is returned

#### Scenario: Player removes character from party

- **Given** a player who is an active member of campaign C, owns character X which is active in party P
- **When** the player sends a PUT to `/api/campaigns/C/members/M/parties/P` with `{ "characterIds": [] }`
- **Then** character X remains in the array but `leftAt` is set to the current timestamp and a 200 OK is returned

#### Scenario: GM manages player characters

- **Given** a GM of campaign C and a member M who owns character X
- **When** the GM sends a PUT to `/api/campaigns/C/members/M/parties/P` with `{ "characterIds": ["X"] }`
- **Then** character X is added to the party with `addedAt` timestamp and a 200 OK is returned

#### Scenario: Player attempts to add unowned character

- **Given** a player M who does not own character Y
- **When** the player sends a PUT to `/api/campaigns/C/members/M/parties/P` with `{ "characterIds": ["Y"] }`
- **Then** character Y is ignored, and the response indicates a successful update for valid characters, or returns 400 Bad Request if validation is strict.

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

- Proposal element -> Requirement: Create a new endpoint -> ADDED Player-driven party management
- Design decision -> Requirement: Decision 1 & 2 -> ADDED Player-driven party management
- Requirement -> Task(s): See [`tasks.md`](../../changes/archive/2026-07-06-update-party-members-api/tasks.md) in the archived `update-party-members-api` change.
- Proposal element -> Requirement: New `GET /api/campaigns/{id}/parties` endpoint -> ADDED Campaign-scoped party listing for active members
- Design decision -> Requirement: Decision 1 -> ADDED Campaign-scoped party listing for active members
- Requirement -> Task(s): See [`tasks.md`](../../changes/archive/2026-07-07-party-membership-panel/tasks.md) in the archived `party-membership-panel` change.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a standard API request under normal load
- **When** the party members are updated
- **Then** the endpoint returns within 500ms

#### Scenario: Latency budget (parties listing)

- **Given** a standard API request under normal load
- **When** a campaign's parties are listed
- **Then** the endpoint returns within 500ms

### Requirement: Security

See functional scenarios: "Player attempts to add unowned character", "Non-member denied", "Inactive member denied".

#### Scenario: Cross-tenant denial

- **Given** a user who is not a member of campaign C
- **When** the user sends a PUT to `/api/campaigns/C/members/M/parties/P`
- **Then** a 403 Forbidden or 404 Not Found is returned

### Requirement: Reliability

#### Scenario: Concurrent updates

- **Given** two players updating their characters in the same party simultaneously
- **When** both requests hit the endpoint
- **Then** both players' changes are merged correctly without overwriting each other (MongoDB's atomic operations or last-write-wins on full party save; practically, conflict probability is low but should result in consistent state).

#### Scenario: Storage read failure

- **Given** the underlying party storage read throws an error
- **When** `GET /api/campaigns/{id}/parties` is called
- **Then** a 500 Internal Server Error is returned with a generic error body (no stack trace or internal detail leaked)
