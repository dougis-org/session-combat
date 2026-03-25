## ADDED Requirements

### Requirement: Combatants may have temporary hit points during combat

Each combatant in an active combat session SHALL support a `tempHp` value representing temporary hit points. When absent or zero, the combatant has no temp HP and all existing behaviour is unchanged.

#### Scenario: Combatant with no temp HP behaves as before

- **Given** a combatant with `hp = 40`, `maxHp = 40`, and no `tempHp`
- **When** damage or healing is applied
- **Then** behaviour is identical to the current implementation (no regression)

---

### Requirement: Damage drains temp HP before regular HP

When a combatant with temp HP takes damage, the system SHALL drain temp HP first. Any damage exceeding the available temp HP SHALL overflow into regular HP. Regular HP SHALL NOT decrease until temp HP is exhausted.

#### Scenario: Damage fully absorbed by temp HP

- **Given** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 14`
- **When** 10 damage is applied
- **Then** `tempHp = 4`, `hp = 30` (regular HP unchanged)

#### Scenario: Damage partially absorbed — overflow to regular HP

- **Given** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 6`
- **When** 10 damage is applied
- **Then** `tempHp = 0`, `hp = 26` (4 overflow absorbed by regular HP)

#### Scenario: Damage exactly equals temp HP

- **Given** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 10`
- **When** 10 damage is applied
- **Then** `tempHp = 0`, `hp = 30` (temp HP zeroed, regular HP unchanged)

#### Scenario: Damage exceeds temp HP and would reduce regular HP to zero

- **Given** a combatant with `hp = 5`, `maxHp = 40`, `tempHp = 3`
- **When** 20 damage is applied
- **Then** `tempHp = 0`, `hp = 0` (regular HP floored at 0)

---

### Requirement: Temp HP does not stack — higher value wins

When new temp HP is granted, the system SHALL apply the new value only if it is strictly greater than the current temp HP. If the new value is equal to or lower than the current, the current temp HP SHALL be preserved unchanged.

#### Scenario: Higher value replaces current temp HP

- **Given** a combatant with `tempHp = 6`
- **When** `setTempHp` is called with `14`
- **Then** `tempHp = 14`

#### Scenario: Lower value is ignored

- **Given** a combatant with `tempHp = 14`
- **When** `setTempHp` is called with `6`
- **Then** `tempHp = 14` (unchanged)

#### Scenario: Equal value is ignored

- **Given** a combatant with `tempHp = 10`
- **When** `setTempHp` is called with `10`
- **Then** `tempHp = 10` (unchanged)

---

### Requirement: Temp HP is visually distinct from regular HP in the health bar

The health bar SHALL render temp HP as a separate coloured segment appended to the right of the regular HP segment. The bar container SHALL represent `maxHp + tempHp` total. Regular HP and temp HP segments SHALL use different colours.

#### Scenario: Temp HP segment visible when combatant has temp HP

- **Given** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 14`
- **When** the combatant card is rendered
- **Then** a `[data-testid="temp-hp-bar"]` element is visible with width `> 0`
- **And** the regular HP bar segment width reflects `30 / 54` (≈ 55.6%) of the total bar
- **And** the temp HP segment reflects `14 / 54` (≈ 25.9%) of the total bar

#### Scenario: No temp HP segment when temp HP is zero

- **Given** a combatant with `hp = 30`, `maxHp = 40`, `tempHp = 0` (or undefined)
- **When** the combatant card is rendered
- **Then** `[data-testid="temp-hp-bar"]` is absent or has zero width
- **And** the regular HP bar segment width is `30 / 40` = 75% (unchanged behaviour)

---

### Requirement: Temp HP numeric display when non-zero

When a combatant has temp HP greater than zero, the combatant card SHALL display the temp HP value alongside the regular HP display, clearly labelled (e.g. `+14 tmp`).

#### Scenario: Temp HP label visible

- **Given** a combatant with `tempHp = 14`
- **When** the combatant card is rendered
- **Then** the text `+14 tmp` (or equivalent) is visible in the HP display area

#### Scenario: Temp HP label absent when zero

- **Given** a combatant with no temp HP
- **When** the combatant card is rendered
- **Then** no temp HP label is shown

---

### Requirement: Temp HP is settable via the HP adjustment widget

The HP adjustment widget SHALL include a "Temp" mode toggle. When the toggle is active, the action button that normally applies healing SHALL instead call `setTempHp` with the entered value.

#### Scenario: Setting temp HP via widget

- **Given** a combatant with `tempHp = 0`
- **When** the DM enables the Temp toggle, enters `14`, and clicks "Set Temp"
- **Then** `tempHp = 14`
- **And** the health bar shows a blue temp HP segment

#### Scenario: Temp toggle off — Heal button behaves normally

- **Given** the Temp toggle is not checked
- **When** the DM enters `10` and clicks "Heal"
- **Then** regular healing is applied (no change to temp HP)

---

### Requirement: Temp HP is cleared when combat ends

When the DM ends combat, temp HP SHALL not persist. The entire combat state (including all `tempHp` values) is discarded.

#### Scenario: Temp HP gone after combat ends

- **Given** a combat session where one combatant has `tempHp = 14`
- **When** the DM clicks "End Combat" and confirms
- **Then** the combat state is cleared and no temp HP values persist

---

## Traceability

- Proposal: "Temp HP field on each combatant" → Requirement: Combatants may have temporary hit points
- Proposal: "Damage applied to temp HP first" → Requirement: Damage drains temp HP before regular HP
- Proposal: "Temp HP visually distinct" → Requirement: Temp HP visually distinct in health bar + numeric display
- Proposal: "No stacking" → Requirement: Temp HP does not stack
- Proposal: "Temp HP editable during combat" → Requirement: Temp HP settable via widget
- Proposal: "Cleared when combat ends" → Requirement: Temp HP cleared when combat ends
- Design D2 (`applyDamage`) → Requirement: Damage drains temp HP
- Design D2 (`setTempHp`) → Requirement: No stacking
- Design D3 (Temp toggle) → Requirement: Settable via widget
- Design D4 (two-segment bar) → Requirement: Visual distinction
- Design D6 (natural clear) → Requirement: Cleared on combat end

## Non-Functional Acceptance Criteria

### Requirement: No regression on existing HP flows

#### Scenario: Existing damage/heal with no temp HP

- **Given** a combatant with no `tempHp`
- **When** any existing damage or heal action is applied
- **Then** behaviour is identical to pre-change (all existing unit and E2E tests pass)
