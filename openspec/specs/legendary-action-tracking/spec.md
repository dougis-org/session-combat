## ADDED Requirements

### Requirement: Legendary action pool stored on monster stat block
`MonsterTemplate` and `Monster` SHALL include a `legendaryActionCount?: number` field representing the number of legendary actions available per round. A value of 0 or absence of the field means legendary actions are disabled for that creature. `CreatureAbility` SHALL include a `cost?: number` field representing how many legendary actions an ability consumes; absence defaults to 1.

#### Scenario: SRD monster with legendary actions has pool count
- **WHEN** a monster from `lib/data/srd-monsters.ts` has a non-empty `legendaryActions[]` array
- **THEN** the monster SHALL have `legendaryActionCount: 3`

#### Scenario: Monster without legendary actions has no pool count
- **WHEN** a monster has an empty or absent `legendaryActions[]`
- **THEN** `legendaryActionCount` SHALL be absent or 0

#### Scenario: Monster upload preserves legendary action count
- **WHEN** a user uploads a custom monster JSON with `legendaryActionCount: 2`
- **THEN** the resulting `MonsterTemplate` SHALL have `legendaryActionCount: 2`

---

### Requirement: Legendary action runtime state on combatant
`CombatantState` SHALL include `legendaryActionCount?: number` (DM-adjustable pool size) and `legendaryActionsRemaining?: number` (remaining actions this round). Both fields are optional for backward compatibility with existing persisted states.

#### Scenario: Monster with legendary actions initialised in combat
- **WHEN** a monster with `legendaryActionCount: 3` is added to combat
- **THEN** the resulting `CombatantState` SHALL have `legendaryActionCount: 3` and `legendaryActionsRemaining: 3`

#### Scenario: Monster without legendary actions has no counter
- **WHEN** a monster with no `legendaryActionCount` is added to combat
- **THEN** `legendaryActionCount` and `legendaryActionsRemaining` SHALL be absent or 0 on the combatant
- **THEN** no legendary action UI SHALL be rendered for that combatant

#### Scenario: Existing combatant states without the fields remain valid
- **WHEN** a `CombatantState` document stored before this change is loaded (fields absent)
- **THEN** the application SHALL treat `legendaryActionsRemaining ?? legendaryActionCount ?? 0` as 0
- **THEN** no crash or validation error SHALL occur

---

### Requirement: Legendary action counter auto-resets at start of creature's turn
When the combat turn advances to a combatant with `legendaryActionCount > 0`, `legendaryActionsRemaining` SHALL be reset to `legendaryActionCount`.

#### Scenario: Counter resets when turn advances to legendary creature (mid-round)
- **WHEN** the active turn is not the last combatant in the round
- **AND** the next combatant has `legendaryActionCount: 3`
- **AND** `nextTurn` is called
- **THEN** the next combatant's `legendaryActionsRemaining` SHALL equal `legendaryActionCount`

#### Scenario: Counter resets when turn advances to legendary creature (round wrap)
- **WHEN** the active turn is the last combatant and the round wraps
- **AND** the first combatant has `legendaryActionCount: 3`
- **AND** `nextTurn` is called
- **THEN** the first combatant's `legendaryActionsRemaining` SHALL equal `legendaryActionCount`

#### Scenario: Non-legendary combatants are unaffected by reset
- **WHEN** `nextTurn` advances to a combatant with no `legendaryActionCount`
- **THEN** no changes to `legendaryActionsRemaining` SHALL be written for that combatant

---

### Requirement: Legendary action can be used (manually decremented)
The DM SHALL be able to use a legendary action from the detail panel, decrementing `legendaryActionsRemaining` by the action's cost.

#### Scenario: Use button decrements remaining by cost
- **WHEN** a combatant has `legendaryActionsRemaining: 3`
- **AND** the DM clicks `[Use]` for an action with `cost: 1`
- **THEN** `legendaryActionsRemaining` SHALL equal 2

#### Scenario: Use button is disabled when remaining < cost
- **WHEN** a combatant has `legendaryActionsRemaining: 1`
- **AND** an action has `cost: 2`
- **THEN** the `[Use]` button for that action SHALL be disabled (not clickable)

#### Scenario: Remaining cannot go below 0
- **WHEN** `useLegendaryAction` is called with `remaining: 0` and `cost: 1`
- **THEN** the returned `legendaryActionsRemaining` SHALL be 0

---

### Requirement: DM can adjust the legendary action pool during combat
The DM SHALL be able to increase or decrease `legendaryActionCount` for a combatant inline from the detail panel. Increasing the pool SHALL preserve `legendaryActionsRemaining`; decreasing the pool SHALL clamp `legendaryActionsRemaining` to the new `legendaryActionCount` if it would otherwise exceed it.

#### Scenario: Pool increase via [+] button
- **WHEN** the DM clicks `[+]` on a combatant with `legendaryActionCount: 3` and `legendaryActionsRemaining: 2`
- **THEN** `legendaryActionCount` SHALL equal 4
- **AND** `legendaryActionsRemaining` SHALL remain 2

#### Scenario: Pool decrease via [−] button (clamp behavior)
- **WHEN** the DM clicks `[−]` on a combatant with `legendaryActionCount: 3` and `legendaryActionsRemaining: 3`
- **THEN** `legendaryActionCount` SHALL equal 2
- **AND** `legendaryActionsRemaining` SHALL equal 2

#### Scenario: Pool cannot be decreased below 0
- **WHEN** the DM clicks `[−]` on a combatant with `legendaryActionCount: 0`
- **THEN** `legendaryActionCount` SHALL remain 0

---

### Requirement: Restore All returns remaining to full pool
The DM SHALL be able to restore `legendaryActionsRemaining` to `legendaryActionCount` at any time via a `[Restore All]` button in the detail panel.

#### Scenario: Restore All resets remaining
- **WHEN** a combatant has `legendaryActionsRemaining: 1` and `legendaryActionCount: 3`
- **AND** the DM clicks `[Restore All]`
- **THEN** `legendaryActionsRemaining` SHALL equal 3

---

### Requirement: Counter badge visible in combatant row
A combatant with `legendaryActionCount > 0` SHALL display a counter badge showing `R/N` (remaining / total) in the combatant row during combat.

#### Scenario: Badge renders for legendary monster
- **WHEN** a combatant has `legendaryActionCount: 3` and `legendaryActionsRemaining: 2`
- **THEN** the combatant row SHALL display a badge reading `2/3`

#### Scenario: Badge absent for non-legendary combatants
- **WHEN** a combatant has no `legendaryActionCount` (or 0)
- **THEN** no legendary action badge SHALL be rendered in the row

#### Scenario: Badge updates after use
- **WHEN** the DM uses a legendary action reducing remaining to 1
- **THEN** the badge SHALL update to show `1/3` (for a pool of 3)

---

### Requirement: Per-action Use buttons with cost displayed in detail panel
When the detail panel is expanded for a combatant with `legendaryActionCount > 0`, each entry in `legendaryActions[]` SHALL show a `[Use — N ⚡]` button where N is the action's `cost` (defaulting to 1).

#### Scenario: Use buttons render with cost
- **WHEN** the detail panel is open for a legendary creature
- **THEN** each legendary action SHALL show a `[Use — 1 ⚡]` button (or appropriate cost)

#### Scenario: Pool editor renders in detail panel
- **WHEN** the detail panel is open for a combatant with `legendaryActionCount > 0`
- **THEN** a `[−] N [+]` pool editor SHALL be visible showing current `legendaryActionCount`
