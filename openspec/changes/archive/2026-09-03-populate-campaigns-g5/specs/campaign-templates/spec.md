## MODIFIED Requirements

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

## Traceability

- Proposal element -> Requirement: Populate G5 encounters -> MODIFIED CampaignTemplate data structure (G5 catalog entries)
- Design decision -> Requirement: Per-campaign encounter helpers -> MODIFIED CampaignTemplate data structure (G5 catalog entries)
- Requirement -> Task(s): Will map to `customMonsters.ts` additions and `seedCampaignTemplates.ts` per-campaign helpers in `tasks.md`.
