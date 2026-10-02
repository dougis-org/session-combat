## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

*(No new user-facing features. This is a technical-debt change; the requirement below is ADDED because this capability spec does not yet exist.)*

### Requirement: ADDED Share, Campaign Template and Preferences Caller Imports

The system SHALL use direct narrow-repo imports (`shareRepo`, `campaignTemplateRepo`, `userPreferencesRepo`) instead of the `storage` facade in the 7 identified route handlers.

#### Scenario: Route handlers directly call narrow repos

- **Given** a request to any of the 7 route handlers (e.g. `POST /api/campaigns/global`, `GET /api/me/preferences`, `DELETE /api/campaigns/[id]/characters/[cid]`)
- **When** the handler processes the request
- **Then** persistence calls are made via `shareRepo.*`, `campaignTemplateRepo.*` or `userPreferencesRepo.*`
- **And** none of the 7 handler files imports `storage` from `@/lib/storage`
- **And** the status codes and response bodies are identical to the previous implementation

#### Scenario: Unit tests mock narrow repos

- **Given** the 6 route unit tests for these handlers
- **When** `npm run test:unit` runs
- **Then** each test mocks the relevant `@/lib/storage/<repo>` module rather than `@/lib/storage`
- **And** all pre-existing assertions pass unchanged

## Traceability

- Proposal element -> Requirement: Migrate share/template/preferences routes -> ADDED Share, Campaign Template and Preferences Caller Imports
- Proposal element -> Requirement: Retarget 6 unit tests -> scenario "Unit tests mock narrow repos"
- Design decision -> Requirement: Decision 1 (namespace imports) -> "Route handlers directly call narrow repos"
- Design decision -> Requirement: Decision 2 (mock narrow repos) -> "Unit tests mock narrow repos"
- Requirement -> Task(s): Tasks 2.1–2.3 (routes), 3.1–3.3 (tests), 4.1–4.2 (verification)

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Test Suite Isolation

- **Given** the unit suite runs with no database
- **When** the 6 retargeted tests execute
- **Then** every repo call made by the handlers hits a `jest.mock` double, never the real module or DB

### Requirement: Reliability

#### Scenario: Facade shape preserved

- **Given** `lib/storage.ts` is unmodified
- **When** `tests/unit/lib/storage/facadeShape.test.ts` runs
- **Then** it passes without edits

### Requirement: Security

See functional scenario: "Route handlers directly call narrow repos" (identical responses imply unchanged auth and error behavior). No new security properties.
