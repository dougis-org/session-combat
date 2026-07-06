## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Create a new endpoint -> ADDED Player-driven party management
- Design decision -> Requirement: Decision 1 & 2 -> ADDED Player-driven party management
- Requirement -> Task(s): To be filled in `tasks.md`

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a standard API request under normal load
- **When** the party members are updated
- **Then** the endpoint returns within 500ms

### Requirement: Security

> See functional scenarios: Player attempts to add unowned character.

#### Scenario: Cross-tenant denial

- **Given** a user who is not a member of campaign C
- **When** the user sends a PUT to `/api/campaigns/C/members/M/parties/P`
- **Then** a 403 Forbidden or 404 Not Found is returned

### Requirement: Reliability

#### Scenario: Concurrent updates

- **Given** two players updating their characters in the same party simultaneously
- **When** both requests hit the endpoint
- **Then** both players' changes are merged correctly without overwriting each other (MongoDB's atomic operations or last-write-wins on full party save; practically, conflict probability is low but should result in consistent state).
