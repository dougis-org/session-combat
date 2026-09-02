## ADDED Requirements

### Requirement: G2 Encounter Population
The system MUST populate every G2 (Sword Coast & Savage Frontier) campaign's `CAMPAIGN_CATALOG` entry with full `EncounterTemplate` definitions containing complete `Monster` stat blocks (non-empty `monsters` arrays), and each encounter SHALL be assembled from `findCustomMonsterById` + `toEncounterMonster(s)` so every monster instance has a unique `id`.

#### Scenario: Waterdeep: Dragon Heist encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Waterdeep: Dragon Heist" catalog entry contains at least 3
  encounters (Zhentarim ambush, Manshoon's Tower, Jarlaxle's Shadowy Deal),
  each with a non-empty `monsters` array
- **THEN** each `Monster` has a unique `id` and a non-zero `hp`, `ac`, and
  `challengeRating`

#### Scenario: Storm King's Thunder encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Storm King's Thunder" catalog entry contains at least 10
  encounters (Hill Giant raid, Chief Guh, Jarl Storvald, Duke Zalto, Slarkrethel,
  Yikaria, King Hekaton, Uthgardt Shaman, Iymrith Revealed, Maegera)
- **THEN** `cm-iymrith-ancient-blue` and `cm-maegera-dawn-titan` are present in
  `CUSTOM_MONSTERS` with full legendary action blocks

#### Scenario: Out of the Abyss encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Out of the Abyss" catalog entry contains at least 16 encounters
  covering the Velkenvelve Escape through the demon-lord finale
- **THEN** the demon-lord stat blocks (e.g. `cm-demogorgon`, `cm-orcus`,
  `cm-zuggtmoy`, `cm-juiblex`, `cm-fraz-urbluu`) use canonical `DamageType`
  values only

#### Scenario: Dragon of Icespire Peak encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Dragon of Icespire Peak" catalog entry contains at least 15
  encounters (CR 1-7 sandbox quests culminating in Cryovain)
- **THEN** `cm-cryovain` is present in `CUSTOM_MONSTERS` with the cold-dragon
  breath weapon damage listed as canonical `cold` not a descriptive string

#### Scenario: Phandelver and Below encounters populated
- **WHEN** the seed script is executed
- **THEN** the "Phandelver and Below: The Shattered Obelisk" catalog entry
  contains at least 9 encounters (Psionic Goblin ambush through Elder Brain
  Dragon)
- **THEN** `cm-elder-brain-dragon` is present in `CUSTOM_MONSTERS` with
  full psionic and domination trait blocks

### Requirement: G2 Custom Monster Constraints
Every new `cm-` monster added for the G2 group SHALL satisfy the invariants
already established by [`openspec/specs/campaign-monsters/spec.md`](../../../specs/campaign-monsters/spec.md):
canonical `DamageType` values only, string `passive Perception`, no `as any`
casts, no `eslint-disable` comments.

#### Scenario: No descriptive damage type strings
- **WHEN** a new `cm-` monster is authored for G2
- **THEN** its `damageResistances`, `damageImmunities`, and `damageVulnerabilities`
  arrays contain only canonical `DamageType` values from `lib/constants.ts`
- **THEN** descriptive strings like "bludgeoning, piercing, and slashing from
  nonmagical attacks" appear in `traits[].description`, not in the damage
  arrays

#### Scenario: Passive perception is a string
- **WHEN** a new `cm-` monster is authored for G2
- **THEN** the `senses["passive Perception"]` value is a string (e.g. `"12"`),
  not a number
