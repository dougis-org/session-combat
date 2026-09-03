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

#### Scenario: G5 monsters present in the registry

- **WHEN** the `CUSTOM_MONSTERS` array is imported
- **THEN** it contains 250-350 new entries covering the 25 G5 campaigns (Age of Worms, Drakkenheim, Hot Springs Island, Scarlet Citadel, Courts of the Shadow Fey, Vault of the Drow, Shackled City, Reavers of Harkenwold, Lost City, Turn of Fortune's Wheel, Dragonlance, Empire of the Ghouls, Temple of Elemental Evil, Keep on the Borderlands, Points of Light, Night Below, Return to Temple, Desert of Desolation, Queen of the Spiders, Reptile God, Spelljammer, Barrier Peaks, Return to Tomb of Horrors, Savage Tide, Expedition), each with `id` prefixed `cm-` and `source` equal to the campaign title
- **THEN** every entry satisfies the canonical `DamageType` invariant (no descriptive strings in damage arrays)
- **THEN** every entry has `senses["passive Perception"]` as a string

### Requirement: Fully Populated Campaign Encounters

The system SHALL ensure that seeded campaign encounters contain full `Monster` records, not just empty arrays, so that copied campaigns are immediately usable without DM intervention.

#### Scenario: Seeding campaign templates with encounters

- **WHEN** the `seedCampaignTemplates.ts` script is executed
- **THEN** it imports the custom monster definitions from `lib/data/customMonsters.ts` and injects them into the `monsters` array of the appropriate encounters.

#### Scenario: G5 catalog encounters are non-empty

- **WHEN** the catalog entry for any G5 campaign is read
- **THEN** its `encounters` array contains at least the minimum encounter count per campaign documented in [`populate-campaigns-g5/spec.md`](./populate-campaigns-g5/spec.md)
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

### Requirement: G4 Custom Monster Constraints
Every new `cm-` monster added for the G4 group SHALL use canonical `DamageType` values only, a string `passive Perception`, no `as any` casts, and no `eslint-disable` comments, and SHALL reference `GLOBAL_USER_ID` for its `userId`.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G4
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities` arrays contain only canonical `DamageType` values from `lib/constants.ts`

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G4
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`), not a number

#### Scenario: A mistyped encounter reference fails fast
- **WHEN** a G4 encounter helper references a `cm-` id that is not in `CUSTOM_MONSTERS`
- **THEN** `requireCustomMonsterById` throws while `CAMPAIGN_CATALOG` is built, naming the missing id, so `npm run test:unit` fails before merge

