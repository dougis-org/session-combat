## MODIFIED Requirements

### Requirement: CampaignTemplate data structure

The system SHALL support storing `EncounterTemplate` definitions directly within a `CampaignTemplate`, including for the 6 G3 campaigns.

#### Scenario: Seeding templates with encounters

- **Given** the seed script `seedCampaignTemplates.ts` defines an `EncounterTemplate` block for any G3 campaign (Rime, WBtW, PotA, CotCT, HR, RHoD)
- **When** the seed script executes
- **Then** the `campaignTemplates` collection in MongoDB contains the updated template including the `encounters` array

#### Scenario: G3 catalog entries ship with full encounter arrays

- **Given** the `CAMPAIGN_CATALOG` in `lib/scripts/seedCampaignTemplates.ts` defines entries for the 6 G3 campaigns
- **When** the seed script is executed
- **Then** each G3 catalog entry's `encounters` array is non-empty and contains the per-campaign encounter helper output (`rimeEncounters()`, `wbtwEncounters()`, `potaEncounters()`, `cotctEncounters()`, `hrEncounters()`, `rhodEncounters()`)
- **Then** every encounter's `monsters` array contains full `Monster` stat blocks built via `findCustomMonsterById` + `toEncounterMonster(s)`

## Traceability

- Proposal element -> Requirement: Populate G3 encounters -> MODIFIED CampaignTemplate data structure (G3 catalog entries)
- Proposal element -> Requirement: Wire G3 catalog to encounter helpers -> MODIFIED CampaignTemplate data structure (G3 catalog entries)
- Design decision -> Requirement: Per-campaign encounter helpers -> MODIFIED CampaignTemplate data structure (G3 catalog entries)
- Design decision -> Requirement: Pathfinder-to-5e stat block conversion -> MODIFIED CampaignTemplate data structure (G3 catalog entries)
- Requirement -> Task(s): Will map to `customMonsters.ts` additions and `seedCampaignTemplates.ts` per-campaign helpers in `tasks.md`.
