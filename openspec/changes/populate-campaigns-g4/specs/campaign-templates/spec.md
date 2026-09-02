## MODIFIED Requirements

### Requirement: MODIFIED CampaignTemplate data structure
The system SHALL support storing `EncounterTemplate` definitions directly within a `CampaignTemplate`, including for the 9 G4 campaigns.

#### Scenario: Seeding templates with encounters

- **Given** the seed script `seedCampaignTemplates.ts` defines an `EncounterTemplate` block for any G4 campaign (Candlekeep, Radiant Citadel, Golden Vault, Yawning Portal, Saltmarsh, Mad Mage, Runelords, Kingmaker, WotR)
- **When** the seed script executes
- **Then** the `campaignTemplates` collection in MongoDB contains the updated template including the `encounters` array

#### Scenario: G4 catalog entries ship with full encounter arrays

- **Given** the `CAMPAIGN_CATALOG` in `lib/scripts/seedCampaignTemplates.ts` defines entries for the 9 G4 campaigns
- **When** the seed script is executed
- **Then** each G4 catalog entry's `encounters` array is non-empty and contains the per-campaign encounter helper output
- **Then** every encounter's `monsters` array contains full `Monster` stat blocks built via `findCustomMonsterById` + `toEncounterMonster(s)`

## REMOVED Requirements

### Requirement: REMOVED None
The system SHALL NOT remove any existing `CampaignTemplate` data structures as part of this change.

#### Scenario: No REMOVED requirements

- **Given** the G4 rollout is purely additive (new encounters and monsters)
- **When** the change is applied
- **Then** no existing requirement from prior capability versions is removed

Reason for removal: N/A

## Traceability

- Proposal element -> Requirement: Populate G4 encounters -> MODIFIED CampaignTemplate data structure (G4 catalog entries)
- Design decision -> Requirement: Per-campaign encounter helpers -> MODIFIED CampaignTemplate data structure (G4 catalog entries)
- Requirement -> Task(s): Will map to `customMonsters.ts` additions and `seedCampaignTemplates.ts` per-campaign helpers in `tasks.md`.
