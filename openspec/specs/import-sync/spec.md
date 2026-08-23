## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-23-add-character-source-url-and-update/design.md) document, not a replacement.

### Requirement: ADDED Character sync block

The system SHALL save an `externalSync` block containing the provider and URL when a character is imported from an external source.

#### Scenario: Importing from D&D Beyond URL

- **Given** a user provides a valid D&D Beyond character URL to the import endpoint
- **When** the import is successful
- **Then** the saved character document contains an `externalSync` object with `provider: "dndbeyond"` and `url` matching the provided URL

### Requirement: ADDED Character update via sync

The system SHALL allow updating an existing character by refetching from its `externalSync.url` using a full replace approach.

#### Scenario: Syncing an existing character

- **Given** an existing character has an `externalSync` block with a valid D&D Beyond URL
- **When** the sync action is invoked
- **Then** the character is re-imported from D&D Beyond, overwriting all stats but preserving its internal `id`

### Requirement: ADDED Sync UI and warning

The UI SHALL provide a sync action for characters with `externalSync` data and present a warning modal before executing the sync.

#### Scenario: Triggering sync from the UI

- **Given** a user views a character that has an `externalSync` block
- **When** they click "Sync from D&D Beyond"
- **Then** a warning modal appears explaining that local edits and HP will be lost

#### Scenario: Confirming sync

- **Given** the warning modal is open
- **When** the user clicks "Confirm"
- **Then** the sync action is invoked and upon success, the character data is updated in the UI

## MODIFIED Requirements

### Requirement: MODIFIED Import Endpoint Payload Handling

The system SHALL accept the `overwrite` flag during import to process a full replacement without creating duplicate characters.

#### Scenario: Re-importing with overwrite flag

- **Given** an existing character named "Bob" and the import endpoint receives a URL for "Bob" with `overwrite: true`
- **When** the endpoint processes the request
- **Then** the existing character record is updated, retaining its original `id` and `_id`

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Adding `externalSync` to the `Character` type -> ADDED Character sync block
- Design decision -> Requirement: Decision 1 (Data Model Addition) -> ADDED Character sync block
- Design decision -> Requirement: Decision 2 (Sync API Endpoint) -> ADDED Character update via sync / MODIFIED Import Endpoint Payload Handling
- Design decision -> Requirement: Decision 3 (UI Warning) -> ADDED Sync UI and warning

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Latency budget for sync

- **Given** the D&D Beyond API responds within 1s
- **When** the sync operation is invoked
- **Then** the sync API route completes in under 2s total

### Requirement: Security

> If access-control rejections are already fully specified by functional scenarios above, replace the scenario below with a cross-reference: "See functional scenarios: [scenario name(s)]". Only add a distinct scenario here if there is a security property not expressed by the functional requirements (e.g., audit log written, token not leaked in error body).

#### Scenario: Access control on sync

- **Given** a user attempting to sync a character
- **When** the character belongs to a different user ID
- **Then** the system rejects the operation with a 403 or 404 (handled implicitly by existing import authorization layer)

### Requirement: Reliability

#### Scenario: Recovery behavior on failed fetch

- **Given** the D&D Beyond API is down or the character was deleted
- **When** a sync is attempted
- **Then** the API returns an error, the local character document is NOT modified, and the UI displays an error toast
