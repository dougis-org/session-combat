## MODIFIED Requirements

### Requirement: Damage drains temp HP before regular HP

When a combatant with temp HP takes damage, the system SHALL drain temp HP first. Any damage exceeding the available temp HP SHALL overflow into regular HP. Regular HP SHALL NOT decrease until temp HP is exhausted.

The effective damage entering temp HP absorption SHALL be the post-modifier value from resistance/immunity/vulnerability calculation (see `damage-resistance-application` spec). Raw damage is modified first; the result is what flows into the temp HP / HP drain.

#### Scenario: Damage fully absorbed by temp HP

- **GIVEN** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 14`
- **WHEN** 10 damage is applied
- **THEN** `tempHp = 4`, `hp = 30` (regular HP unchanged)

#### Scenario: Damage partially absorbed — overflow to regular HP

- **GIVEN** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 6`
- **WHEN** 10 damage is applied
- **THEN** `tempHp = 0`, `hp = 26` (4 overflow absorbed by regular HP)

#### Scenario: Resistant damage enters temp HP at halved value

- **GIVEN** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 6`, `damageResistances = ['fire']`
- **WHEN** 10 fire damage is applied
- **THEN** `effectiveDamage = 5`
- **THEN** `tempHp = 1` (6 − 5)
- **THEN** `hp = 30` (temp HP fully absorbed)

#### Scenario: Immune damage leaves temp HP intact

- **GIVEN** a combatant with `hp = 20`, `maxHp = 40`, `tempHp = 8`, `damageImmunities = ['poison']`
- **WHEN** 15 poison damage is applied
- **THEN** `tempHp = 8`, `hp = 20` (nothing applied)

## ADDED Requirements

### Requirement: Temp HP grant captured in HP history

When temp HP is granted to a combatant (replacing or setting `tempHp`), the system SHALL push an `HpHistoryEntry` with `type: 'tempHp'` to that combatant's history stack before the `tempHp` value is updated. This allows undo to restore the previous `tempHp` value.

#### Scenario: Granting temp HP records pre-change snapshot

- **GIVEN** a combatant with `hp = 25`, `tempHp = 0`
- **WHEN** 8 temp HP is granted
- **THEN** a history entry `{ hp: 25, tempHp: 0, type: 'tempHp', amount: 8, timestamp: <now> }` is pushed before `tempHp` becomes `8`

#### Scenario: Replacing existing temp HP records pre-change snapshot

- **GIVEN** a combatant with `hp = 25`, `tempHp = 4`
- **WHEN** 10 temp HP is granted (replacing existing)
- **THEN** a history entry `{ hp: 25, tempHp: 4, type: 'tempHp', amount: 10, timestamp: <now> }` is pushed before `tempHp` becomes `10`
