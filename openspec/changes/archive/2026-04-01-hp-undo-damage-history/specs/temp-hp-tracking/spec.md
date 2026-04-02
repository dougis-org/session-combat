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
