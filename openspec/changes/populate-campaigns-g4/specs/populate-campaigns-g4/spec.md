## ADDED Requirements

### Requirement: G4 Encounter Population
The system MUST populate every G4 (Anthologies & APs) campaign's `CAMPAIGN_CATALOG` entry with full `EncounterTemplate` definitions containing complete `Monster` stat blocks (non-empty `monsters` arrays), and each encounter SHALL be assembled from `findCustomMonsterById` + `toEncounterMonster(s)` so every monster instance has a unique `id`.

#### Scenario: Candlekeep Mysteries encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Candlekeep Mysteries" catalog entry contains at least 17 encounters (one per anthology adventure)
- **THEN** every monster instance has a unique `id` and a non-zero `hp`, `ac`, and `challengeRating`

#### Scenario: Journeys Through the Radiant Citadel encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Journeys Through the Radiant Citadel" catalog entry contains at least 13 encounters (one per adventure)
- **THEN** encounters spanning multiple settings (e.g., Spirit's Realm, the Wandering Minstrel) use canonical `DamageType` values

#### Scenario: Keys from the Golden Vault encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Keys from the Golden Vault" catalog entry contains at least 13 heist encounters
- **THEN** every encounter's `monsters` array has at least one full `Monster` stat block (no empty arrays)

#### Scenario: Tales from the Yawning Portal encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Tales from the Yawning Portal" catalog entry contains at least 7 encounters (Sunless Citadel, Forge of Fury, Hidden Shrine, White Plume Mountain, Death House, Against the Giants, Tomb of Horrors)
- **THEN** classic antagonists (`cm-acererak-lich`, `cm-vecna-robes`) use the original stat blocks per source material

#### Scenario: Ghosts of Saltmarsh encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Ghosts of Saltmarsh" catalog entry contains at least 8 encounters (sea-themed adventures)
- **THEN** `cm-sahuagin-baron` and other aquatic monsters use canonical `DamageType` values only

#### Scenario: Waterdeep: Dungeon of the Mad Mage encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Waterdeep: Dungeon of the Mad Mage" catalog entry contains at least 80 encounters (Undermountain levels 1-23)
- **THEN** Halaster and his apprentices stat blocks are present in `CUSTOM_MONSTERS`
- **THEN** every level has at least one encounter with non-empty `monsters` array

#### Scenario: Rise of the Runelords encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Rise of the Runelords" catalog entry contains at least 6 encounters
- **THEN** `cm-karzoug-demon-skin` and other Runelord antagonists are present in `CUSTOM_MONSTERS`
- **THEN** encounters flagged as Pathfinder-converted carry a `(5e conversion)` note

#### Scenario: Kingmaker encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Kingmaker" catalog entry contains at least 6 encounters (Kingdom-building + dungeon)
- **THEN** `cm-lantern-king` is present in `CUSTOM_MONSTERS` with full stat blocks
- **THEN** encounters flagged as Pathfinder-converted carry a `(5e conversion)` note

#### Scenario: Wrath of the Righteous encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Wrath of the Righteous" catalog entry contains at least 6 encounters (Demon-infested)
- **THEN** Deskari, Baphomet, and Nocticula stat blocks are present in `CUSTOM_MONSTERS`
- **THEN** demon stat blocks use canonical `DamageType` values

### Requirement: G4 Custom Monster Constraints
Every new `cm-` monster added for the G4 group SHALL satisfy the invariants already established by [`openspec/specs/campaign-monsters/spec.md`](../../../specs/campaign-monsters/spec.md): canonical `DamageType` values only, string `passive Perception`, no `as any` casts, no `eslint-disable` comments.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G4
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays contain only canonical `DamageType` values from `lib/constants.ts`

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G4
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`), not a number

## MODIFIED Requirements

### Requirement: MODIFIED CampaignTemplate data structure (G4 catalog entries)
The system SHALL support storing `EncounterTemplate` definitions directly within a `CampaignTemplate`, including for the 9 G4 campaigns.

#### Scenario: G4 catalog entries ship with full encounter arrays
- **Given** the `CAMPAIGN_CATALOG` in `lib/scripts/seedCampaignTemplates.ts` defines entries for the 9 G4 campaigns (Candlekeep, Radiant Citadel, Golden Vault, Yawning Portal, Saltmarsh, Mad Mage, Runelords, Kingmaker, WotR)
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

- Proposal element -> Requirement: Populate G4 encounters -> ADDED G4 Encounter Population
- Proposal element -> Requirement: G4 monster invariants -> ADDED G4 Custom Monster Constraints
- Proposal element -> Requirement: Wire G4 catalog to encounter helpers -> MODIFIED CampaignTemplate data structure (G4 catalog entries)
- Design decision -> Requirement: Per-campaign encounter helpers -> ADDED G4 Encounter Population
- Design decision -> Requirement: Yawning Portal original stat blocks -> ADDED G4 Encounter Population
- Design decision -> Requirement: Pathfinder-to-5e conversion -> MODIFIED CampaignTemplate data structure (G4 catalog entries)
- Requirement -> Task(s): Will map to `customMonsters.ts` additions and `seedCampaignTemplates.ts` per-campaign helpers in `tasks.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget
- **Given** a G4 campaign template with 80+ encounters (Mad Mage maximum)
- **When** the encounters are sequentially inserted into the DB during the seed script
- **Then** the total overhead of encounter insertion must not exceed the existing 500ms baseline (no regression vs G1/G2/G3)

### Requirement: Security

> See functional scenarios: All access-control rejections for the seed script are handled by existing middleware. No new security properties introduced by this change.

### Requirement: Reliability

#### Scenario: Missing monster reference fails fast
- **Given** a G4 helper references a `cm-` monster id that doesn't exist in `CUSTOM_MONSTERS`
- **When** the seed script runs
- **Then** the script throws immediately with a clear error message identifying the missing id
- **Then** CI catches the failure during `npm run test:unit` before merge
