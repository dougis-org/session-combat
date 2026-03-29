## ADDED Requirements

### Requirement: Lair slot type in CombatantState
`CombatantState.type` SHALL support a third value `"lair"` in addition to `"player"` and `"monster"`. A lair pseudo-combatant is a real entry in `combatants[]` with `type: "lair"`, `initiative: 20`, a DM-chosen name, and a `lairActions: CreatureAbility[]` array. Required `CreatureStats` fields (`ac`, `hp`, `maxHp`, `abilityScores`) SHALL be present with inert default values and SHALL NOT be displayed in the UI for lair-type combatants.

#### Scenario: Lair pseudo-combatant is valid CombatantState
- **WHEN** a lair slot is created
- **THEN** the resulting `CombatantState` SHALL have `type: "lair"`, `initiative: 20`, a non-empty `name`, and `conditions: []`

#### Scenario: Lair slot never displays HP or conditions
- **WHEN** a lair-type combatant is rendered in the initiative order
- **THEN** no HP bar, AC value, or conditions panel SHALL be displayed

---

### Requirement: Lair slot sorts before creatures at initiative 20
At initiative count 20, lair slots SHALL appear before all `"player"` and `"monster"` combatants in the sorted initiative order. Multiple lair slots at initiative 20 SHALL be sorted alphabetically by name.

#### Scenario: Lair slot leads creatures at same initiative
- **WHEN** a lair slot and a player both have `initiative: 20`
- **THEN** the lair slot SHALL appear earlier in the displayed initiative order than the player

#### Scenario: Multiple lair slots at initiative 20 sorted by name
- **WHEN** two lair slots both have `initiative: 20` with names "Dragon Lair" and "Golem Chamber"
- **THEN** "Dragon Lair" SHALL appear before "Golem Chamber" in the initiative order

---

### Requirement: Add lair slot at setup and in-combat
The DM SHALL be able to add a lair pseudo-combatant both before combat starts and during active combat. An "Add Lair" action SHALL be available on both surfaces. The add flow SHALL prompt for a lair name and offer an optional "Seed from monster" selection listing any monsters in the current encounter that have a non-empty `lairActions[]`.

#### Scenario: Add lair slot pre-combat
- **WHEN** the DM clicks "Add Lair" before combat has started
- **THEN** a form SHALL appear requesting a lair name and optional monster seed

#### Scenario: Add lair slot mid-combat
- **WHEN** the DM clicks "Add Lair" during active combat
- **THEN** the same form SHALL appear and the new lair slot SHALL be inserted into the initiative order at initiative 20 upon confirmation

#### Scenario: Auto-seed from monster
- **WHEN** the DM selects a monster from the seed dropdown that has `lairActions[]` populated
- **THEN** the new lair slot's `lairActions[]` SHALL be pre-populated with that monster's lair action descriptions

#### Scenario: Manual entry (no seed)
- **WHEN** the DM does not select a seed monster
- **THEN** the new lair slot SHALL be created with an empty `lairActions[]` that the DM can populate in the setup form

---

### Requirement: Remove lair slot
The DM SHALL be able to remove a lair pseudo-combatant from the encounter. Removing the lair slot SHALL remove the pseudo-combatant from `combatants[]`.

#### Scenario: Remove lair slot
- **WHEN** the DM removes a lair slot
- **THEN** the lair pseudo-combatant SHALL be absent from `combatants[]` and from the initiative order display

---

### Requirement: Lair slot visual indicator in initiative order
A lair pseudo-combatant SHALL be visually distinct from player and monster combatant cards in the initiative order at all times (active and inactive). The inactive state SHALL display a compact badge with a lair icon and the lair name. The active state SHALL render the `LairActionsSlot` component showing the full action list.

#### Scenario: Inactive lair slot shows compact badge
- **WHEN** a lair slot exists in the initiative order but is not the active turn
- **THEN** a distinct compact badge with a lair icon and the lair name SHALL be visible

#### Scenario: Active lair slot shows full action panel
- **WHEN** `currentTurnIndex` points to a lair-type combatant
- **THEN** the `LairActionsSlot` component SHALL be rendered in the active position showing all lair action descriptions

---

### Requirement: Lair slot is skippable
When the active turn is a lair slot, the DM SHALL be able to skip it without using any lair action. Skipping SHALL advance `currentTurnIndex` to the next combatant (equivalent to calling `nextTurn`). No persistent state change beyond the normal turn advance SHALL occur.

#### Scenario: Skip lair action slot
- **WHEN** the active turn is a lair slot and the DM clicks "Skip"
- **THEN** `currentTurnIndex` SHALL advance to the next combatant in the order

---

### Requirement: Lair action descriptions locked during combat
Lair action description text SHALL be editable only before combat starts. Once combat is active, description fields SHALL be read-only. The DM may still edit charge counts during combat.

#### Scenario: Descriptions read-only in active combat
- **WHEN** the DM views the lair slot detail during active combat
- **THEN** all action description fields SHALL be rendered as read-only text, not editable inputs

#### Scenario: Descriptions editable before combat
- **WHEN** the DM views the lair slot during encounter setup (before combat is active)
- **THEN** action description fields SHALL be editable inputs
