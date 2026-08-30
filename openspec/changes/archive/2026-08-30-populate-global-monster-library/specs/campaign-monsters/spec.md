## ADDED Requirements

### Requirement: Global Campaign Monsters Library Seed
The system SHALL provide a mechanism to seed custom, campaign-specific monsters into the global `monsterTemplates` collection so they can be referenced by template encounters.

#### Scenario: Running the global monster seed script
- **WHEN** the `seedGlobalMonsters.ts` script is executed
- **THEN** it reads the custom monster definitions from `lib/data/customMonsters.ts` and upserts them into the global `monsterTemplates` collection with `userId: 'GLOBAL'`, avoiding duplicates.

### Requirement: Fully Populated Campaign Encounters
The system SHALL ensure that seeded campaign encounters contain full `Monster` records, not just empty arrays, so that copied campaigns are immediately usable without DM intervention.

#### Scenario: Seeding campaign templates with encounters
- **WHEN** the `seedCampaignTemplates.ts` script is executed
- **THEN** it imports the custom monster definitions from `lib/data/customMonsters.ts` and injects them into the `monsters` array of the appropriate encounters (e.g., adding the Cultist stat block to the Cultists of the Whispered One encounter).
