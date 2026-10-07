## ADDED Requirements

### Requirement: ADDED Character-share routes validate path ids

The system SHALL validate the campaign id on `POST` and `GET /api/campaigns/[id]/characters`, and both the campaign id and character id on `DELETE /api/campaigns/[id]/characters/[cid]`, before any membership or storage lookup.

#### Scenario: Invalid campaign id on share or list

- **Given** an authenticated user
- **When** `POST` or `GET /api/campaigns/[id]/characters` is called with an empty id or an id longer than 200 characters
- **Then** the response is `400` and no membership or storage function is called

#### Scenario: Invalid ids on unshare

- **Given** an authenticated user
- **When** `DELETE /api/campaigns/[id]/characters/[cid]` is called with an empty or over-200-character `id` or `cid`
- **Then** the response is `400` and no membership or storage function is called

#### Scenario: Valid ids behave as before

- **Given** valid ids and an active player-member
- **When** any of the three routes is called
- **Then** responses match existing behavior (201/200/204, 403, 404)

## Traceability

- Proposal element (validate ids on character routes) -> Requirement: path id validation
- Design Decisions 1–2 -> this requirement
- Requirement -> Task(s): 4.1, 4.2

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Invalid campaign id on share or list", "Invalid ids on unshare".
