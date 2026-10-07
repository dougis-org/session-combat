## MODIFIED Requirements

### Requirement: MODIFIED GET /api/campaigns/global — authenticated list

The system SHALL expose `GET /api/campaigns/global`, which returns all global campaign templates only to authenticated users.

#### Scenario: Authenticated user fetches templates

- **Given** a valid session cookie is present
- **When** `GET /api/campaigns/global` is called
- **Then** the response is `200` with a JSON array of `CampaignTemplate` objects (may be empty)

#### Scenario: Unauthenticated request rejected

- **Given** no session cookie is present
- **When** `GET /api/campaigns/global` is called
- **Then** the response is `401` and storage is not queried

#### Scenario: Empty catalog returns empty array

- **Given** the requester is authenticated and no global templates exist
- **When** `GET /api/campaigns/global` is called
- **Then** the response is `200` with `[]`

### Requirement: MODIFIED DELETE /api/campaigns/global/[id] — admin deletes template

The system SHALL expose an admin-only `DELETE /api/campaigns/global/[id]` endpoint that validates the template id before any storage access.

#### Scenario: Admin deletes an existing template

- **Given** a global template with the given id exists
- **When** `DELETE /api/campaigns/global/[id]` is called by an admin
- **Then** the response is `200` and the template no longer appears in `GET /api/campaigns/global`

#### Scenario: Non-admin delete is rejected

- **Given** the requester does not have admin privileges
- **When** `DELETE /api/campaigns/global/[id]` is called
- **Then** the response is `403 Forbidden`

#### Scenario: Delete non-existent template

- **Given** no template with the given id exists
- **When** `DELETE /api/campaigns/global/[id]` is called by an admin
- **Then** the response is `404 Not Found`

#### Scenario: Invalid template id rejected

- **Given** the requester is an admin
- **When** `DELETE /api/campaigns/global/[id]` is called with an empty id or an id longer than 200 characters
- **Then** the response is `400` and `deleteCampaignTemplate` is not called

## Traceability

- Proposal element (auth on global GET) -> Requirement: authenticated list
- Proposal element (validate global DELETE id) -> Requirement: admin deletes template
- Design Decisions 1–3 -> both requirements
- Requirement -> Task(s): 2.1, 2.2, 3.1

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Unauthenticated request rejected", "Invalid template id rejected".
