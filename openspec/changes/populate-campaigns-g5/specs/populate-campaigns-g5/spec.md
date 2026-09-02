## ADDED Requirements

### Requirement: G5 Encounter Population
The system MUST populate every G5 (Classic & 3PP / legacy) campaign's `CAMPAIGN_CATALOG` entry with full `EncounterTemplate` definitions containing complete `Monster` stat blocks (non-empty `monsters` arrays), and each encounter SHALL be assembled from `findCustomMonsterById` + `toEncounterMonster(s)` so every monster instance has a unique `id`.

#### Scenario: Age of Worms encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Age of Worms" catalog entry contains at least 12 encounters (Duchy of Urnst through the final Kyuss confrontation)
- **THEN** `cm-kyuss` is present in `CUSTOM_MONSTERS` with full stat blocks

#### Scenario: Dungeons of Drakkenheim encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Dungeons of Drakkenheim" catalog entry contains at least 7 encounters
- **THEN** 3PP-specific mechanics (contamination) appear in `traits[].description`, not in schema-breaking fields

#### Scenario: Dark of Hot Springs Island encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Dark of Hot Springs Island" catalog entry contains at least 4 encounters (procedural)
- **THEN** hexcrawl encounter tags are preserved in encounter descriptions

#### Scenario: Scarlet Citadel encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Scarlet Citadel" catalog entry contains at least 8 encounters

#### Scenario: Courts of the Shadow Fey encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Courts of the Shadow Fey" catalog entry contains at least 4 encounters (Shadow Fey encounters)

#### Scenario: Vault of the Drow encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Vault of the Drow" catalog entry contains at least 4 encounters
- **THEN** Lolth and other Underdark antagonists are present in `CUSTOM_MONSTERS`

#### Scenario: Shackled City encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Shackled City" catalog entry contains at least 12 encounters
- **THEN** `cm-cagewright-nightmare` and related Shackled City antagonists are present

#### Scenario: Reavers of Harkenwold encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Reavers of Harkenwold" catalog entry contains at least 5 encounters

#### Scenario: Lost City encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Lost City" catalog entry contains at least 4 encounters

#### Scenario: Turn of Fortune's Wheel encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Turn of Fortune's Wheel" catalog entry contains at least 14 encounters (Planescape)

#### Scenario: Dragonlance encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Dragonlance: Shadow of the Dragon Queen" catalog entry contains at least 7 encounters
- **THEN** `cm-takhisis` and other Dragonlance antagonists are present

#### Scenario: Empire of the Ghouls encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Empire of the Ghouls" catalog entry contains at least 6 encounters
- **THEN** Pathfinder-converted encounters carry a `(5e conversion)` note

#### Scenario: Temple of Elemental Evil encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Temple of Elemental Evil" catalog entry contains at least 6 encounters
- **THEN** elemental node encounters are populated with canonical `DamageType` values

#### Scenario: Keep on the Borderlands encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Keep on the Borderlands" catalog entry contains at least 3 encounters (Caves of Chaos)

#### Scenario: Points of Light encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Points of Light" catalog entry contains at least 3 encounters

#### Scenario: Night Below encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Night Below" catalog entry contains at least 3 encounters (Underdark)

#### Scenario: Return to Temple of Elemental Evil encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Return to Temple of Elemental Evil" catalog entry contains at least 4 encounters

#### Scenario: Desert of Desolation encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Desert of Desolation" catalog entry contains at least 3 encounters

#### Scenario: Queen of the Spiders encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Queen of the Spiders" catalog entry contains at least 7 encounters
- **THEN** Lolth and drider encounters are populated

#### Scenario: Against the Cult of the Reptile God encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Against the Cult of the Reptile God" catalog entry contains at least 3 encounters

#### Scenario: Spelljammer encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Spelljammer: Light of Xaryxis" catalog entry contains at least 4 encounters
- **THEN** planar monsters span multiple worlds

#### Scenario: Expedition to the Barrier Peaks encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Expedition to the Barrier Peaks" catalog entry contains at least 6 encounters (sci-fi-themed)

#### Scenario: Return to the Tomb of Horrors encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Return to the Tomb of Horrors" catalog entry contains at least 3 encounters
- **THEN** `cm-acererak-demi-lich` is present in `CUSTOM_MONSTERS` with full stat blocks

#### Scenario: Savage Tide encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Savage Tide" catalog entry contains at least 12 encounters (sea-themed AP)

#### Scenario: Expedition encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Expedition" catalog entry contains the required encounters (per the catalog's existing chapter structure)

### Requirement: G5 Custom Monster Constraints
Every new `cm-` monster added for the G5 group SHALL satisfy the invariants already established by [`openspec/specs/campaign-monsters/spec.md`](../../../specs/campaign-monsters/spec.md): canonical `DamageType` values only, string `passive Perception`, no `as any` casts, no `eslint-disable` comments.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G5
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays contain only canonical `DamageType` values

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G5
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`), not a number

### Requirement: G5 3PP Stat Block Constraints
3PP (third-party publisher) stat blocks authored for G5 SHALL encode any non-5e fields (e.g., Drakkenheim contamination, Hot Springs Island procedural tags) in `traits[].description` rather than introducing new schema fields.

#### Scenario: 3PP mechanics encoded in traits
- **WHEN** a 3PP monster stat block contains non-5e fields
- **THEN** those fields are encoded as `traits[]` entries with descriptive text, not added to the schema

## MODIFIED Requirements

### Requirement: MODIFIED CampaignTemplate data structure (G5 catalog entries)
The system SHALL support storing `EncounterTemplate` definitions directly within a `CampaignTemplate`, including for the 25 G5 campaigns.

#### Scenario: G5 catalog entries ship with full encounter arrays
- **Given** the `CAMPAIGN_CATALOG` in `lib/scripts/seedCampaignTemplates.ts` defines entries for the 25 G5 campaigns
- **When** the seed script is executed
- **Then** each G5 catalog entry's `encounters` array is non-empty and contains the per-campaign encounter helper output
- **Then** every encounter's `monsters` array contains full `Monster` stat blocks built via `findCustomMonsterById` + `toEncounterMonster(s)`

## REMOVED Requirements

### Requirement: REMOVED None
The system SHALL NOT remove any existing `CampaignTemplate` data structures as part of this change.

#### Scenario: No REMOVED requirements

- **Given** the G5 rollout is purely additive (new encounters and monsters)
- **When** the change is applied
- **Then** no existing requirement from prior capability versions is removed

Reason for removal: N/A

## Traceability

- Proposal element -> Requirement: Populate G5 encounters -> ADDED G5 Encounter Population
- Proposal element -> Requirement: G5 monster invariants -> ADDED G5 Custom Monster Constraints
- Proposal element -> Requirement: 3PP stat block handling -> ADDED G5 3PP Stat Block Constraints
- Proposal element -> Requirement: Wire G5 catalog to encounter helpers -> MODIFIED CampaignTemplate data structure (G5 catalog entries)
- Design decision -> Requirement: Per-campaign encounter helpers -> ADDED G5 Encounter Population
- Design decision -> Requirement: 3PP stat blocks fit MonsterTemplate -> ADDED G5 3PP Stat Block Constraints
- Design decision -> Requirement: Pathfinder-to-5e conversion -> MODIFIED CampaignTemplate data structure (G5 catalog entries)
- Requirement -> Task(s): Will map to `customMonsters.ts` additions and `seedCampaignTemplates.ts` per-campaign helpers in `tasks.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget
- **Given** a G5 campaign template with 12 encounters (Shackled City / Savage Tide)
- **When** the encounters are sequentially inserted into the DB during the seed script
- **Then** the total overhead of encounter insertion must not exceed the existing 500ms baseline (no regression vs G1-G4)

### Requirement: Security

> See functional scenarios: All access-control rejections for the seed script are handled by existing middleware. No new security properties introduced by this change.

### Requirement: Reliability

#### Scenario: Missing monster reference fails fast
- **Given** a G5 helper references a `cm-` monster id that doesn't exist in `CUSTOM_MONSTERS`
- **When** the seed script runs
- **Then** the script throws immediately with a clear error message identifying the missing id
- **Then** CI catches the failure during `npm run test:unit` before merge
