## ADDED Requirements

### Requirement: Combatant stores initiative modifier settings
The system SHALL persist per-combatant initiative modifier settings — advantage toggle and flat bonus — on `CombatantState` for the full duration of the combat session.

#### Scenario: Settings default to off/zero when not set
- **WHEN** a combatant is added to combat with no prior initiative modifier settings
- **THEN** `initiativeAdvantage` is treated as `false` and `initiativeFlatBonus` is treated as `0`

#### Scenario: Settings survive panel close and reopen
- **WHEN** a user sets advantage or flat bonus on a combatant and then closes the initiative entry panel
- **THEN** reopening the panel for that combatant shows the previously set values

#### Scenario: Settings are independent per combatant
- **WHEN** advantage is enabled for combatant A
- **THEN** combatant B's advantage setting is unaffected

---

### Requirement: Advantage rolls two d20s and takes the higher
The system SHALL roll exactly two d20s when a combatant has `initiativeAdvantage: true` and the "Roll d20" action is triggered, using the higher result as the initiative roll.

#### Scenario: Roll d20 with advantage takes the higher die
- **WHEN** a combatant has advantage enabled and the user clicks "Roll d20"
- **THEN** two d20s are rolled and the higher value is used as the `roll` in `InitiativeRoll`

#### Scenario: Dropped die is recorded
- **WHEN** a combatant has advantage enabled and the user clicks "Roll d20"
- **THEN** the lower d20 result is stored as `altRoll` in `InitiativeRoll`

#### Scenario: Advantage flag is recorded on the roll
- **WHEN** a combatant has advantage enabled and the user clicks "Roll d20"
- **THEN** `InitiativeRoll.advantage` is `true`

#### Scenario: Roll d20 without advantage uses single die
- **WHEN** a combatant does not have advantage enabled and the user clicks "Roll d20"
- **THEN** exactly one d20 is rolled, `altRoll` is absent, and `InitiativeRoll.advantage` is absent or `false`

---

### Requirement: Bulk roll respects per-combatant advantage setting
The system SHALL apply each combatant's `initiativeAdvantage` setting when the "Roll All" bulk initiative action is triggered.

#### Scenario: Bulk roll applies advantage to flagged combatants
- **WHEN** the user triggers a bulk initiative roll and combatant A has `initiativeAdvantage: true`
- **THEN** combatant A's roll uses two d20s (higher taken), with `altRoll` and `advantage: true` recorded

#### Scenario: Bulk roll uses single die for non-advantage combatants
- **WHEN** the user triggers a bulk initiative roll and combatant B has no advantage setting
- **THEN** combatant B's roll uses a single d20

---

### Requirement: Flat bonus is applied on top of the DEX modifier
The system SHALL add `initiativeFlatBonus` to the initiative total in addition to the DEX modifier when rolling or entering initiative.

#### Scenario: Flat bonus included in rolled total
- **WHEN** a combatant has `initiativeFlatBonus: 5` and the user clicks "Roll d20"
- **THEN** the initiative total equals the d20 result plus DEX modifier plus 5

#### Scenario: Flat bonus included in manual dice entry
- **WHEN** a combatant has `initiativeFlatBonus: 2` and the user submits a manual dice roll of 12
- **THEN** the initiative total equals 12 plus DEX modifier plus 2

#### Scenario: Flat bonus included in total entry
- **WHEN** a combatant has `initiativeFlatBonus: 3` and the user enters a total of 15
- **THEN** the initiative total equals 15 plus 3

#### Scenario: Flat bonus stored on the roll record
- **WHEN** a flat bonus is applied during any roll or entry
- **THEN** `InitiativeRoll.flatBonus` contains the bonus value that was applied

#### Scenario: Zero flat bonus has no effect
- **WHEN** a combatant has `initiativeFlatBonus: 0` or no flat bonus set
- **THEN** the total equals d20 result plus DEX modifier (no flat bonus change)

---

### Requirement: Initiative modifier settings are clearable individually
The system SHALL allow clearing advantage and flat bonus independently without triggering a re-roll.

#### Scenario: Unchecking advantage clears it
- **WHEN** a user unchecks the advantage toggle for a combatant
- **THEN** `initiativeAdvantage` is set to `false` and no re-roll occurs

#### Scenario: Clear button resets flat bonus to zero
- **WHEN** a user clicks the clear (✕) button next to the flat bonus input
- **THEN** `initiativeFlatBonus` is set to `0` and no re-roll occurs

---

### Requirement: Initiative roll display shows full breakdown
The system SHALL display advantage roll details and flat bonus in the initiative breakdown when they were applied.

#### Scenario: Advantage roll shows both dice
- **WHEN** an initiative roll was made with advantage
- **THEN** the display shows the winning d20, the dropped d20, and the notation that advantage was used (e.g., "d20: 15↑ (dropped: 7)")

#### Scenario: Flat bonus shown in breakdown
- **WHEN** an initiative roll includes a flat bonus greater than zero
- **THEN** the flat bonus is shown as a separate addend in the breakdown display

#### Scenario: Standard roll shows no advantage detail
- **WHEN** an initiative roll was made without advantage
- **THEN** no dropped die or advantage notation appears in the display

---

### Requirement: DEX modifier correctly applied in per-combatant roll
The system SHALL compute the DEX initiative modifier from `combatant.abilityScores.dexterity` in the `InitiativeEntry` component, not return a hardcoded zero.

#### Scenario: DEX +3 combatant roll includes modifier
- **WHEN** a combatant has `abilityScores.dexterity: 16` (modifier +3) and the user clicks "Roll d20"
- **THEN** the `bonus` field in `InitiativeRoll` is `3` and the total reflects the modifier

#### Scenario: DEX 10 combatant has zero modifier
- **WHEN** a combatant has `abilityScores.dexterity: 10` (modifier 0) and the user clicks "Roll d20"
- **THEN** the `bonus` field in `InitiativeRoll` is `0`

#### Scenario: Missing abilityScores defaults to DEX 10
- **WHEN** a combatant has no `abilityScores` defined
- **THEN** the system treats DEX as 10 (modifier 0) and does not error
