## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-30-campaign-encounter-templates/design.md) document, not a replacement.

### Requirement: ADDED Encounter generation upon campaign template copy

The system SHALL read default encounters from a CampaignTemplate and instantiate real `Encounter` objects for the user.

#### Scenario: Successful copy with default encounters

- **Given** a user is authenticated and requesting to copy a global `CampaignTemplate` that has an `encounters` array with two templates.
- **When** the API handles the copy request
- **Then** the database contains two new `Encounter` records owned by the user, and the new `Campaign` record has an `encounterIds` array containing the UUIDs of those two new encounters.

#### Scenario: Transaction failure during encounter insertion

- **Given** a user is requesting to copy a global `CampaignTemplate` with default encounters
- **When** the database fails to save one of the new `Encounter` records
- **Then** the system catches the error, deletes the partially created `Campaign` record, and returns an HTTP 500 status to the client.

## MODIFIED Requirements

### Requirement: MODIFIED CampaignTemplate data structure

The system SHALL support storing `EncounterTemplate` definitions directly within a `CampaignTemplate`.

#### Scenario: Seeding templates with encounters

- **Given** the seed script `seedCampaignTemplates.ts` defines an `EncounterTemplate` block for "Dragon of Icespire Peak"
- **When** the seed script executes
- **Then** the `campaignTemplates` collection in MongoDB contains the updated template including the `encounters` array.

## REMOVED Requirements

### Requirement: REMOVED None

Reason for removal: N/A

## Traceability

- Proposal element -> Requirement: Generate real objects upon copy -> ADDED Encounter generation upon campaign template copy
- Design decision -> Requirement: Decision 1 (Embedded Encounter Templates) -> MODIFIED CampaignTemplate data structure
- Design decision -> Requirement: Decision 2 (API Route Iteration) -> ADDED Encounter generation upon campaign template copy
- Requirement -> Task(s): Will map to API route updates and type modifications in [`tasks.md`](../../changes/archive/2026-08-30-campaign-encounter-templates/tasks.md).

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: Iterative insertion latency

- **Given** a template with 15 encounters
- **When** the encounters are sequentially inserted into the DB during the copy route
- **Then** the total overhead of encounter insertion must not exceed 500ms, ensuring the copy route still returns within acceptable API latency limits.

### Requirement: Security

> See functional scenarios: Access-control rejections for campaign copying are handled by existing middleware (`withAuthAndParams`). No new security properties introduced.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a network hiccup during database insertion of encounters
- **When** the encounter insertion throws an error
- **Then** the system executes the rollback procedure (deleting the campaign) and leaves the DB in a clean state, ready for a retry.
