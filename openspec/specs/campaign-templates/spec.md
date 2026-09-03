# campaign-templates Specification

## Purpose

Define how global `CampaignTemplate` records store default encounter content
and how copying a template instantiates real `Encounter` objects for a user.
Additive to the [`campaign-encounter-templates` design](../../changes/archive/2026-08-30-campaign-encounter-templates/design.md).
## Requirements
### Requirement: Encounter generation upon campaign template copy

The system SHALL read default encounters from a CampaignTemplate and instantiate real `Encounter` objects for the user.

#### Scenario: Successful copy with default encounters

- **Given** a user is authenticated and requesting to copy a global `CampaignTemplate` that has an `encounters` array with two templates.
- **When** the API handles the copy request
- **Then** the database contains two new `Encounter` records owned by the user, and the new `Campaign` record has an `encounterIds` array containing the UUIDs of those two new encounters.

#### Scenario: Transaction failure during encounter insertion

- **Given** a user is requesting to copy a global `CampaignTemplate` with default encounters
- **When** the database fails to save one of the new `Encounter` records
- **Then** the system catches the error, deletes the partially created `Campaign` record, and returns an HTTP 500 status to the client.

### Requirement: CampaignTemplate data structure
The system SHALL support storing `EncounterTemplate` definitions directly within a `CampaignTemplate`, including for the 6 G3, 9 G4, and 24 G5 campaigns.

#### Scenario: Seeding templates with encounters

- **Given** the seed script `seedCampaignTemplates.ts` defines an `EncounterTemplate` block for any G5 campaign
- **When** the seed script executes
- **Then** the `campaignTemplates` collection in MongoDB contains the updated template including the `encounters` array

#### Scenario: G5 catalog entries ship with full encounter arrays

- **Given** the `CAMPAIGN_CATALOG` in `lib/scripts/seedCampaignTemplates.ts` defines entries for the 25 G5 campaigns
- **When** the seed script is executed
- **Then** each G5 catalog entry's `encounters` array is non-empty and contains the per-campaign encounter helper output
- **Then** every encounter's `monsters` array contains full `Monster` stat blocks built via `findCustomMonsterById` + `toEncounterMonster(s)`

### Requirement: Encounter insertion performance

Iterative insertion of a template's encounters during the copy route SHALL stay within the API latency budget.

#### Scenario: Iterative insertion latency

- **Given** a template with 15 encounters
- **When** the encounters are sequentially inserted into the DB during the copy route
- **Then** the total overhead of encounter insertion must not exceed 500ms, ensuring the copy route still returns within acceptable API latency limits.

### Requirement: Encounter insertion reliability

Partial failure while inserting a template's encounters SHALL leave the database in a clean state.

#### Scenario: Recovery behavior

- **Given** a network hiccup during database insertion of encounters
- **When** the encounter insertion throws an error
- **Then** the system executes the rollback procedure (deleting the campaign) and leaves the DB in a clean state, ready for a retry.

## Traceability

- Proposal element -> Requirement: Generate real objects upon copy -> Encounter generation upon campaign template copy
- Design decision -> Requirement: Decision 1 (Embedded Encounter Templates) -> CampaignTemplate data structure
- Design decision -> Requirement: Decision 2 (API Route Iteration) -> Encounter generation upon campaign template copy
