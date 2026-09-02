## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

#### Scenario: G2 catalog entries ship with full encounter arrays

- **Given** the `CAMPAIGN_CATALOG` in `lib/scripts/seedCampaignTemplates.ts` defines entries for the 5 G2 campaigns (WDH, SKT, OotA, DIP, PaBtSO)
- **When** the seed script is executed
- **Then** each G2 catalog entry's `encounters` array is non-empty and contains the per-campaign encounter helper output (`wdhEncounters()`, `sktEncounters()`, `ootEncounters()`, `dipEncounters()`, `pabtsoEncounters()`)
- **Then** every encounter's `monsters` array contains full `Monster` stat blocks built via `findCustomMonsterById` + `toEncounterMonster(s)`

## REMOVED Requirements

### Requirement: REMOVED None

The system SHALL NOT remove any existing `CampaignTemplate` data structures as part of this change.

#### Scenario: No REMOVED requirements

- **Given** the G2 rollout is purely additive (new encounters and monsters)
- **When** the change is applied
- **Then** no existing requirement from prior capability versions is removed

Reason for removal: N/A

## Traceability

- Proposal element -> Requirement: Populate G2 encounters -> ADDED G2 Encounter Population
- Proposal element -> Requirement: G2 monster invariants -> ADDED G2 Custom Monster Constraints
- Proposal element -> Requirement: Wire G2 catalog to encounter helpers -> MODIFIED CampaignTemplate data structure
- Design decision -> Requirement: Per-campaign encounter helpers -> ADDED G2 Encounter Population
- Design decision -> Requirement: SRD mirrors re-inlined -> MODIFIED Fully Populated Campaign Encounters
- Requirement -> Task(s): Will map to `customMonsters.ts` additions and
  `seedCampaignTemplates.ts` per-campaign helpers in `tasks.md`.
