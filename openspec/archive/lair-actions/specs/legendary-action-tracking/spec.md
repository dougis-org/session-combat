## MODIFIED Requirements

### Requirement: Legendary action pool stored on monster stat block
`MonsterTemplate` and `Monster` SHALL include a `legendaryActionCount?: number` field representing the number of legendary actions available per round. A value of 0 or absence of the field means legendary actions are disabled for that creature. `CreatureAbility` SHALL include a `cost?: number` field representing how many legendary actions an ability consumes (absence defaults to 1) and an optional `usesRemaining?: number` field for per-action use tracking. The `usesRemaining` field is absent on all legendary action entries and has no effect on legendary action behaviour.

#### Scenario: SRD monster with legendary actions has pool count
- **WHEN** a monster from `lib/data/srd-monsters.ts` has a non-empty `legendaryActions[]` array
- **THEN** the monster SHALL have `legendaryActionCount: 3`

#### Scenario: Monster without legendary actions has no pool count
- **WHEN** a monster has an empty or absent `legendaryActions[]`
- **THEN** `legendaryActionCount` SHALL be absent or 0

#### Scenario: Monster upload preserves legendary action count
- **WHEN** a user uploads a custom monster JSON with `legendaryActionCount: 2`
- **THEN** the resulting `MonsterTemplate` SHALL have `legendaryActionCount: 2`

#### Scenario: usesRemaining absent on legendary action entries
- **WHEN** any SRD or uploaded monster has `legendaryActions[]` entries
- **THEN** those `CreatureAbility` entries SHALL NOT have `usesRemaining` set
