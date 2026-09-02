# populate-campaigns-g3 Specification

## Purpose
TBD - created by archiving change populate-campaigns-g3. Update Purpose after archive.
## Requirements
### Requirement: G3 Encounter Population
The system MUST populate every G3 (Planar & non-Realms) campaign's `CAMPAIGN_CATALOG` entry with full `EncounterTemplate` definitions containing complete `Monster` stat blocks (non-empty `monsters` arrays), and each encounter SHALL be assembled from `findCustomMonsterById` + `toEncounterMonster(s)` so every monster instance has a unique `id`.

#### Scenario: Icewind Dale: Rime of the Frostmaiden encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Icewind Dale: Rime of the Frostmaiden" catalog entry contains at least 10 encounters (Ten-Towns ambushes through the Frostmaiden confrontation)
- **THEN** `cm-auril-frostmaiden` is present in `CUSTOM_MONSTERS` with the cold-immunity and "Frost Aura" trait specified
- **THEN** every monster instance has a unique `id` and a non-zero `hp`, `ac`, and `challengeRating`

#### Scenario: The Wild Beyond the Witchlight encounters populated
- **WHEN** the seed script is executed
- **THEN** the "The Wild Beyond the Witchlight" catalog entry contains at least 8 encounters (feywild encounters through the Hourglass Coven confrontation)
- **THEN** the Hourglass Coven stat blocks (`cm-brigid-morningglow`, `cm-mungoj-reyhorn`, `cm-endelyn-moongrave`, `cm-sister-gala`) are present in `CUSTOM_MONSTERS` with full legendary action blocks
- **THEN** `cm-wendigo` and other feywild-specific creatures use canonical `DamageType` values only

#### Scenario: Princes of the Apocalypse encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Princes of the Apocalypse" catalog entry contains at least 20 encounters (delegates through elemental-node confrontations)
- **THEN** the four Elemental Princes (`cm-imix`, `cm-ogremoch`, `cm-yuan-tin`, `cm-bane`) are present in `CUSTOM_MONSTERS` with full elemental-attack damage using canonical `DamageType` values
- **THEN** elementals (`cm-air-elemental`, `cm-earth-elemental`, `cm-fire-elemental`, `cm-water-elemental`) are referenced via shared `cm-` entries with unique instance ids per encounter

#### Scenario: Curse of the Crimson Throne encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Curse of the Crimson Throne" catalog entry contains at least 12 encounters (city encounters through the final confrontation)
- **THEN** `cm-ileosa-arabasti` is present in `CUSTOM_MONSTERS` with the Queen of Korvosa stat block
- **THEN** encounters flagged as Pathfinder-converted in the encounter description carry a `(5e conversion)` note

#### Scenario: Hell's Rebels encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Hell's Rebels" catalog entry contains at least 12 encounters (rebellion encounters through Thrune confrontation)
- **THEN** `cm-barbaroscia-thrune` and related Thrune-aligned NPCs are present in `CUSTOM_MONSTERS` with full stat blocks
- **THEN** devil stat blocks use canonical `DamageType` values (no descriptive strings)

#### Scenario: Red Hand of Doom encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Red Hand of Doom" catalog entry contains at least 15 encounters (goblin/ogre/hobgoblin encounters through the final battle)
- **THEN** `cm-hurog-manthex` and `cm-wyrmlord` are present in `CUSTOM_MONSTERS` with full stat blocks

### Requirement: G3 Custom Monster Constraints
Every new `cm-` monster added for the G3 group SHALL satisfy the invariants already established by [the campaign-monsters spec](../campaign-monsters/spec.md): canonical `DamageType` values only, string `passive Perception`, no `as any` casts, no `eslint-disable` comments.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G3
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays contain only canonical `DamageType` values from `lib/constants.ts`
- **THEN** descriptive strings like "bludgeoning, piercing, and slashing from nonmagical attacks" appear in `traits[].description`, not in the damage arrays

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G3
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`), not a number

