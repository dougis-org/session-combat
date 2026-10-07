## ADDED Requirements

### Requirement: ADDED Template copy validates template id with bounded validator

The system SHALL reject `POST /api/campaigns/global/[id]/copy` requests whose template id is empty or longer than 200 characters before loading any template.

#### Scenario: Over-long template id

- **Given** an authenticated user
- **When** `POST /api/campaigns/global/[id]/copy` is called with an id longer than 200 characters
- **Then** the response is `400` and `loadGlobalCampaignTemplateById` is not called

#### Scenario: Valid id unchanged

- **Given** a valid template id
- **When** the copy route is called
- **Then** behavior matches the existing copy flow (201 or 404)

## Traceability

- Proposal element (audit sibling copy route) -> Requirement: bounded template id
- Design Decision 4 -> this requirement
- Requirement -> Task(s): 5.1

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "Over-long template id".
