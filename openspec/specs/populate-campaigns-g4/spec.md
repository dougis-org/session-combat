# populate-campaigns-g4 Specification

## Purpose
Populate encounter and campaign-specific monster content for the 9 G4
campaigns (Anthologies & Adventure Paths: Candlekeep Mysteries, Journeys
Through the Radiant Citadel, Keys from the Golden Vault, Tales from the Yawning
Portal, Ghosts of Saltmarsh, Waterdeep: Dungeon of the Mad Mage, Rise of the
Runelords, Kingmaker, Wrath of the Righteous) so copied campaigns ship ready to
play. Implemented in PR #675.
## Requirements

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
Every new `cm-` monster added for the G4 group SHALL satisfy the invariants already established by the [`campaign-monsters` spec](../campaign-monsters/spec.md): canonical `DamageType` values only, string `passive Perception`, no `as any` casts, no `eslint-disable` comments.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G4
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays contain only canonical `DamageType` values from `lib/constants.ts`

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G4
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`), not a number


### Requirement: Performance

Seeding the G4 templates SHALL NOT regress the encounter-insertion latency budget, even for the largest campaign (Mad Mage, 80+ encounters).

#### Scenario: Latency budget
- **Given** a G4 campaign template with 80+ encounters (Mad Mage maximum)
- **When** the encounters are sequentially inserted into the DB during the seed script
- **Then** the total overhead of encounter insertion must not exceed the existing 500ms baseline (no regression vs G1/G2/G3)

### Requirement: Security

The G4 rollout SHALL introduce no new attack surface — it is additive seed data with no new endpoints, request shapes, or auth paths.

#### Scenario: No new security-relevant surface
- **Given** the G4 change is applied
- **When** the seed script and its data are reviewed
- **Then** no new API route, input schema, or access-control path is added, and access-control rejections continue to be handled by existing middleware

### Requirement: Reliability

The G4 encounter helpers SHALL fail fast on a missing monster reference rather than silently shipping a thinner encounter.

#### Scenario: Missing monster reference fails fast
- **Given** a G4 helper references a `cm-` monster id that doesn't exist in `CUSTOM_MONSTERS`
- **When** `CAMPAIGN_CATALOG` is constructed (at module load / `npm run test:unit`)
- **Then** `requireCustomMonsterById` throws immediately with an error message naming the missing id, so CI catches it before merge
