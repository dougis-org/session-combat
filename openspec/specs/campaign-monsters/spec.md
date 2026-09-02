# campaign-monsters Specification

## Purpose

Seed and maintain the global library of custom, campaign-specific monsters
(`CUSTOM_MONSTERS` in `lib/data/customMonsters.ts`) so that seeded campaign
templates ship with fully populated encounters.
## Requirements
### Requirement: Global Campaign Monsters Library Seed

The system SHALL provide a mechanism to seed custom, campaign-specific monsters into the global `monsterTemplates` collection so they can be referenced by template encounters.

#### Scenario: Running the global monster seed script

- **WHEN** the `seedGlobalMonsters.ts` script is executed
- **THEN** it reads the custom monster definitions from `lib/data/customMonsters.ts` and upserts them into the global `monsterTemplates` collection with `userId: 'GLOBAL'`, avoiding duplicates.

#### Scenario: G3 monsters present in the registry

- **WHEN** the `CUSTOM_MONSTERS` array is imported
- **THEN** it contains 80-120 new entries covering the 6 G3 campaigns (Rime, WBtW, PotA, CotCT, HR, RHoD), each with `id` prefixed `cm-` and `source` equal to the campaign title
- **THEN** every entry satisfies the canonical `DamageType` invariant (no descriptive strings in damage arrays)
- **THEN** every entry has `senses["passive Perception"]` as a string

### Requirement: Fully Populated Campaign Encounters

The system SHALL ensure that seeded campaign encounters contain full `Monster` records, not just empty arrays, so that copied campaigns are immediately usable without DM intervention.

#### Scenario: Seeding campaign templates with encounters

- **WHEN** the `seedCampaignTemplates.ts` script is executed
- **THEN** it imports the custom monster definitions from `lib/data/customMonsters.ts` and injects them into the `monsters` array of the appropriate encounters (e.g., adding the Cultist stat block to the Cultists of the Whispered One encounter).

#### Scenario: G3 catalog encounters are non-empty

- **WHEN** the catalog entry for any G3 campaign (Rime, WBtW, PotA, CotCT, HR, RHoD) is read
- **THEN** its `encounters` array contains at least the minimum encounter count per campaign documented in [the archived populate-campaigns-g3 change](../../changes/archive/2026-09-02-populate-campaigns-g3/specs/populate-campaigns-g3/spec.md)
- **THEN** every encounter's `monsters` array has at least one full `Monster` stat block (no empty arrays)

### Requirement: G3 Custom Monster Constraints
Every new `cm-` monster added for the G3 group SHALL use canonical `DamageType` values only, a string `passive Perception`, no `as any` casts, and no `eslint-disable` comments.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G3
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays contain only canonical `DamageType` values from `lib/constants.ts`
- **THEN** descriptive strings like "bludgeoning, piercing, and slashing from nonmagical attacks" appear in `traits[].description`, not in the damage arrays

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G3
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`), not a number

