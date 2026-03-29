## ADDED Requirements

### Requirement: Per-action charge tracking on lair actions
`CreatureAbility` SHALL support an optional `usesRemaining?: number` field representing the remaining uses of an action within an encounter. Absence of the field means the action has unlimited uses. This field is runtime state on the lair pseudo-combatant only — it is not stored on `MonsterTemplate` or `Monster` and is not part of the monster upload schema.

#### Scenario: Action with no usesRemaining is unlimited
- **WHEN** a lair action's `CreatureAbility` has no `usesRemaining` field
- **THEN** the action SHALL be treated as having unlimited uses and no charge counter SHALL be displayed

#### Scenario: Action with usesRemaining shows charge counter
- **WHEN** a lair action's `CreatureAbility` has `usesRemaining: 2`
- **THEN** a charge counter displaying `2` SHALL be visible alongside that action in the `LairActionsSlot`

---

### Requirement: Charge decrement on use
When the DM uses a lair action that has `usesRemaining` set, the remaining count SHALL decrement by 1 (minimum 0). An action with `usesRemaining: 0` SHALL be visually marked as exhausted and its Use button SHALL be disabled.

#### Scenario: Decrement charge on use
- **WHEN** the DM clicks Use on a lair action with `usesRemaining: 2`
- **THEN** `usesRemaining` SHALL become `1`

#### Scenario: Charge cannot go below zero
- **WHEN** the DM attempts to use a lair action with `usesRemaining: 0`
- **THEN** the Use button SHALL be disabled and `usesRemaining` SHALL remain `0`

#### Scenario: Exhausted action is visually marked
- **WHEN** a lair action has `usesRemaining: 0`
- **THEN** the action SHALL be displayed with a visual exhausted indicator (e.g., greyed out)

---

### Requirement: Charge editor controls
The DM SHALL be able to manually adjust `usesRemaining` for any lair action via `[−]` and `[+]` controls in the `LairActionsSlot`. These controls SHALL be available both when the slot is active and when it is not the active turn (accessible via the detail panel).

#### Scenario: Decrement charge via editor
- **WHEN** the DM clicks `[−]` on a charge-tracked lair action
- **THEN** `usesRemaining` SHALL decrement by 1 (minimum 0)

#### Scenario: Increment charge via editor
- **WHEN** the DM clicks `[+]` on a charge-tracked lair action
- **THEN** `usesRemaining` SHALL increment by 1

---

### Requirement: Manual charge restore
The DM SHALL be able to manually restore charges for individual lair actions. A "Restore All" control SHALL restore `usesRemaining` by incrementing it (no stored original value — this is an increment, not a reset-to-template).

#### Scenario: Restore all increments each tracked action by 1
- **WHEN** the DM clicks "Restore All" on a lair slot
- **THEN** every action with a finite `usesRemaining` SHALL have `usesRemaining` incremented by 1

#### Scenario: Actions without usesRemaining are unaffected by restore
- **WHEN** the DM clicks "Restore All" on a lair slot that contains a mix of limited and unlimited actions
- **THEN** only actions with a finite `usesRemaining` SHALL be incremented; unlimited actions SHALL remain unchanged

---

### Requirement: Charge pure functions in combat utils
Charge operations SHALL be implemented as pure functions in `lib/utils/combat.ts`:
- `useCharge(ability: CreatureAbility): CreatureAbility` — decrements `usesRemaining` by 1, minimum 0; returns new object
- `restoreCharge(ability: CreatureAbility): CreatureAbility` — increments `usesRemaining` by 1; returns new object
- `restoreAllCharges(actions: CreatureAbility[]): CreatureAbility[]` — applies `restoreCharge` to all actions that have a finite `usesRemaining`; returns new array

#### Scenario: useCharge decrements remaining
- **WHEN** `useCharge` is called with an ability having `usesRemaining: 3`
- **THEN** the returned ability SHALL have `usesRemaining: 2`

#### Scenario: useCharge clamps at 0
- **WHEN** `useCharge` is called with an ability having `usesRemaining: 0`
- **THEN** the returned ability SHALL have `usesRemaining: 0`

#### Scenario: restoreCharge increments remaining
- **WHEN** `restoreCharge` is called with an ability having `usesRemaining: 1`
- **THEN** the returned ability SHALL have `usesRemaining: 2`

#### Scenario: restoreAllCharges skips unlimited actions
- **WHEN** `restoreAllCharges` is called with a mix of limited and unlimited actions
- **THEN** only actions with a finite `usesRemaining` SHALL have it incremented
