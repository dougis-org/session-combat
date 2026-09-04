# legendary-action-tracking Specification

## Purpose

Track and manage each combatant's legendary-action pool during combat: storing
the pool size on monster stat blocks, initializing and resetting per-round
remaining actions, letting the DM spend/adjust/restore the pool from the
detail panel, and surfacing a discoverable, keyboard-accessible counter badge
on the combatant row that opens the detail panel focused on the Legendary
Actions section.

## Requirements

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
A combatant with `legendaryActionCount > 0` SHALL display a counter badge showing `R/N` (remaining / total) in the combatant row during combat. The badge SHALL be an interactive native `button` that, when activated, opens that combatant's detail panel — the same panel opened by the combatant-name control — with a request to focus the Legendary Actions section, so the spend/restore/pool controls are scrolled into view and keyboard-focused in one step. The badge SHALL retain its `data-testid="legendary-action-badge"` hook and its `R/N` text content. The badge SHALL only be rendered for combatants with `legendaryActionCount > 0` (legendary combatants); combatants that only have lair actions SHALL NOT receive this control.

#### Scenario: Badge renders for legendary monster
- **WHEN** a combatant has `legendaryActionCount: 3` and `legendaryActionsRemaining: 2`
- **THEN** the combatant row SHALL display a badge reading `2/3`
- **AND** the badge SHALL be exposed as a `button` with an accessible name referencing the combatant and legendary actions

#### Scenario: Badge absent for non-legendary combatants
- **WHEN** a combatant has no `legendaryActionCount` (or 0)
- **THEN** no legendary action badge SHALL be rendered in the row
- **AND** this holds even when the combatant has a non-empty `lairActions` array

#### Scenario: Badge updates after use
- **WHEN** the DM uses a legendary action reducing remaining to 1
- **THEN** the badge SHALL update to show `1/3` (for a pool of 3)

#### Scenario: Activating the badge opens the detail panel focused on legendary actions
- **GIVEN** a combatant row with a legendary-action badge and a detail-panel handler wired (as `ActiveCombatView` wires it)
- **WHEN** the DM clicks the badge, or focuses it and presses Enter or Space
- **THEN** the combatant's detail panel SHALL open (the handler receives that combatant's id and a legendary focus request)
- **AND** the panel SHALL scroll the Legendary Actions section into view and move focus into it
- **AND** the `LegendaryActionsPanel` spend / restore / pool controls SHALL be visible

#### Scenario: Opening the panel from the name control does not force scroll or focus
- **GIVEN** a combatant row
- **WHEN** the DM opens the detail panel via the combatant-name control (not the badge)
- **THEN** the panel SHALL open at its default scroll position
- **AND** focus SHALL NOT be forced into the Legendary Actions section

#### Scenario: Badge is inert when no detail-panel handler is supplied
- **GIVEN** a combatant card rendered without a detail-panel handler (e.g. in isolation or the setup view)
- **WHEN** the DM activates the badge
- **THEN** nothing SHALL happen and no error SHALL be raised

---

### Requirement: Detail panel focuses the legendary section on request

`CombatantDetailPanel` SHALL accept an optional request to open focused on the Legendary Actions section. When that request is present, the panel SHALL scroll the Legendary Actions section into view and move keyboard focus into it (to the first interactive control in the section, or to the section container if it has none). When the request is absent, the panel SHALL open with its default scroll position and SHALL NOT move focus into any section.

#### Scenario: Panel opens focused on the legendary section
- **GIVEN** a combatant with `legendaryActionCount: 3` and a non-empty `legendaryActions` array
- **WHEN** `CombatantDetailPanel` is rendered with the legendary focus request set
- **THEN** the Legendary Actions section SHALL be scrolled into view
- **AND** keyboard focus SHALL be within the Legendary Actions section

#### Scenario: Panel opens normally without a focus request
- **GIVEN** any combatant
- **WHEN** `CombatantDetailPanel` is rendered with no focus request
- **THEN** the panel SHALL NOT scroll to the Legendary Actions section
- **AND** focus SHALL NOT be moved into any section

#### Scenario: Focus request with no legendary content is a safe no-op
- **GIVEN** a combatant with `legendaryActionCount: 2` but an empty `legendaryActions` array (so the legendary panel renders nothing)
- **WHEN** `CombatantDetailPanel` is rendered with the legendary focus request set
- **THEN** no error SHALL be raised
- **AND** the panel SHALL render normally

---

### Requirement: Per-action Use buttons with cost displayed in detail panel
When the detail panel is expanded for a combatant with `legendaryActionCount > 0`, each entry in `legendaryActions[]` SHALL show a `[Use — N ⚡]` button where N is the action's `cost` (defaulting to 1).

#### Scenario: Use buttons render with cost
- **WHEN** the detail panel is open for a legendary creature
- **THEN** each legendary action SHALL show a `[Use — 1 ⚡]` button (or appropriate cost)

#### Scenario: Pool editor renders in detail panel
- **WHEN** the detail panel is open for a combatant with `legendaryActionCount > 0`
- **THEN** a `[−] N [+]` pool editor SHALL be visible showing current `legendaryActionCount`
