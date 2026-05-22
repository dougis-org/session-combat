## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED GET /api/campaigns/global — public list

The system SHALL expose a public `GET /api/campaigns/global` endpoint that returns all global campaign templates without requiring authentication.

#### Scenario: Unauthenticated user fetches templates

- **Given** no session cookie is present
- **When** `GET /api/campaigns/global` is called
- **Then** the response is `200` with a JSON array of `CampaignTemplate` objects (may be empty)

#### Scenario: Empty catalog returns empty array

- **Given** no global campaign templates exist in the database
- **When** `GET /api/campaigns/global` is called
- **Then** the response is `200` with `[]`

---

### Requirement: ADDED POST /api/campaigns/global — admin creates template

The system SHALL expose an admin-only `POST /api/campaigns/global` endpoint that creates a new global campaign template.

#### Scenario: Admin creates a valid template

- **Given** the requester has admin privileges (session passes `requireAdmin`)
- **When** `POST /api/campaigns/global` is called with `{ name, moduleName, chapters: [...] }`
- **Then** the response is `201` with the created `CampaignTemplate`, `userId` set to `GLOBAL_USER_ID`, `isGlobal: true`

#### Scenario: Non-admin is rejected

- **Given** the requester does not have admin privileges
- **When** `POST /api/campaigns/global` is called
- **Then** the response is `403 Forbidden`

#### Scenario: Missing required name field

- **Given** the requester has admin privileges
- **When** `POST /api/campaigns/global` is called with no `name` field
- **Then** the response is `400 Bad Request` with an error message indicating `name` is required

#### Scenario: Template with empty chapters array

- **Given** the requester has admin privileges
- **When** `POST /api/campaigns/global` is called with `chapters: []`
- **Then** the response is `201` with an empty chapters array — a template without chapters is valid

---

### Requirement: ADDED DELETE /api/campaigns/global/[id] — admin deletes template

The system SHALL expose an admin-only `DELETE /api/campaigns/global/[id]` endpoint.

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

---

### Requirement: ADDED PUT /api/campaigns/global — seed stub

The system SHALL expose an admin-only `PUT /api/campaigns/global` endpoint that returns `501 Not Implemented` as a reserved hook for future bulk seed ingestion.

#### Scenario: Admin calls seed endpoint before implementation

- **Given** the requester has admin privileges
- **When** `PUT /api/campaigns/global` is called
- **Then** the response is `501 Not Implemented`

#### Scenario: Non-admin seed call is rejected

- **Given** the requester does not have admin privileges
- **When** `PUT /api/campaigns/global` is called
- **Then** the response is `403 Forbidden`

---

### Requirement: ADDED storage functions for global campaign templates

The system SHALL add `loadGlobalCampaignTemplates()`, `saveCampaignTemplate(template)`, and `deleteCampaignTemplate(id)` to `lib/storage.ts`.

#### Scenario: Load returns all global templates

- **Given** three `CampaignTemplate` documents exist with `userId: GLOBAL_USER_ID`
- **When** `loadGlobalCampaignTemplates()` is called
- **Then** all three are returned, ordered by name or createdAt

#### Scenario: Save persists a new template

- **Given** a new `CampaignTemplate` object is provided
- **When** `saveCampaignTemplate(template)` is called
- **Then** the template is retrievable via `loadGlobalCampaignTemplates()`

#### Scenario: Delete removes the template

- **Given** a template with a known id exists
- **When** `deleteCampaignTemplate(id)` is called
- **Then** the template is no longer returned by `loadGlobalCampaignTemplates()`

## MODIFIED Requirements

None. This capability is entirely new.

## REMOVED Requirements

None.

## Traceability

- Proposal element "admin write routes" -> Requirements: POST, DELETE, PUT endpoints
- Proposal element "public GET" -> Requirement: GET /api/campaigns/global
- Design decision 1 (mirror monster pattern) -> All route requirements
- Design decision 5 (seed stub) -> Requirement: PUT 501 stub
- Requirement GET -> Task: Create app/api/campaigns/global/route.ts GET handler
- Requirement POST -> Task: Create POST handler with requireAdmin
- Requirement DELETE -> Task: Create app/api/campaigns/global/[id]/route.ts DELETE handler
- Requirement storage functions -> Task: Add to lib/storage.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Admin writes require session

- **Given** a request with no session (unauthenticated)
- **When** `POST`, `PUT`, or `DELETE` is called on any `/api/campaigns/global` route
- **Then** the response is `401 Unauthorized` (from `requireAdmin` helper before 403)

#### Scenario: Admin check uses requireAdmin helper

- **Given** `requireAdmin` returns a non-null response for a non-admin user
- **When** any write route invokes it
- **Then** the route returns that response immediately without executing further logic

### Requirement: Reliability

#### Scenario: DB error on GET

- **Given** the database is unavailable
- **When** `GET /api/campaigns/global` is called
- **Then** the response is `500 Internal Server Error` with a descriptive error message
