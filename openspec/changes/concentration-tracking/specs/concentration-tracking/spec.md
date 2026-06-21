## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Concentration badge renders when combatant is concentrating

The system SHALL display a visual badge showing the spell name on a combatant's card when `concentratingOn` is set.

#### Scenario: Concentration badge visible

- **Given** a combatant with `concentratingOn: "Hold Person"` is rendered in `CombatantCard`
- **When** the card renders
- **Then** a badge/pill displaying "Hold Person" is visible in the combatant row

#### Scenario: No badge when not concentrating

- **Given** a combatant with `concentratingOn` undefined
- **When** the card renders
- **Then** no concentration badge is present in the DOM

---

### Requirement: ADDED CON save DC is displayed on the card after the combatant takes damage while concentrating

The system SHALL set `pendingConSaveDC` on the combatant and render a DC prompt on the card when a concentrating combatant takes effective damage greater than zero.

#### Scenario: DC prompt appears after damage

- **Given** a combatant with `concentratingOn: "Fly"` and current HP > 0
- **When** damage is applied and `effectiveDamage > 0`
- **Then** `pendingConSaveDC` is set to `max(10, floor(effectiveDamage / 2))` and the card renders a DC prompt showing that value

#### Scenario: DC prompt absent when no concentration

- **Given** a combatant with `concentratingOn` undefined
- **When** damage is applied
- **Then** `pendingConSaveDC` is not set and no DC prompt is rendered

#### Scenario: DC prompt absent when damage is fully absorbed by immunity (effectiveDamage = 0)

- **Given** a combatant with `concentratingOn: "Web"` and immunity to the damage type
- **When** damage is applied and `effectiveDamage = 0`
- **Then** `pendingConSaveDC` is not set and no DC prompt is rendered

#### Scenario: DC prompt dismissed

- **Given** a combatant card showing `pendingConSaveDC: 14`
- **When** the DM clicks the dismiss (×) button on the DC prompt
- **Then** `pendingConSaveDC` is cleared and the DC prompt is removed from the card

#### Scenario: DC prompt auto-clears on next damage

- **Given** a combatant card showing `pendingConSaveDC: 12`
- **When** a second damage event is applied to the same combatant while concentrating
- **Then** the DC prompt updates to the new DC value for the latest hit

---

### Requirement: ADDED `calcConSaveDC` computes the correct DC

The system SHALL compute CON save DC as `max(10, floor(effectiveDamage / 2))`.

#### Scenario: Damage below threshold

- **Given** `effectiveDamage = 14`
- **When** `calcConSaveDC(14)` is called
- **Then** the result is `10` (floor(14/2) = 7, max(10,7) = 10)

#### Scenario: Damage at threshold

- **Given** `effectiveDamage = 20`
- **When** `calcConSaveDC(20)` is called
- **Then** the result is `10` (floor(20/2) = 10, max(10,10) = 10)

#### Scenario: Damage above threshold

- **Given** `effectiveDamage = 21`
- **When** `calcConSaveDC(21)` is called
- **Then** the result is `10` (floor(21/2) = 10, max(10,10) = 10)

#### Scenario: High damage

- **Given** `effectiveDamage = 50`
- **When** `calcConSaveDC(50)` is called
- **Then** the result is `25` (floor(50/2) = 25, max(10,25) = 25)

#### Scenario: Odd damage

- **Given** `effectiveDamage = 19`
- **When** `calcConSaveDC(19)` is called
- **Then** the result is `9`... wait — floor(19/2) = 9, max(10,9) = 10. Result is `10`.

---

### Requirement: ADDED CON save notification fires to DM and affected player

The system SHALL invoke the `onConSaveRequired(dc)` callback on `CombatantCard` when `effectiveDamage > 0` and `concentratingOn` is set. `ActiveCombatView` SHALL implement this callback: for player-type combatants, resolve the player `userId` by extracting the character ID from the combatant ID (pattern `character-${character.id}`) and looking up the `Character` in `characters[]`, then POST a `CampaignMessage` with `visibility: { scope: "direct"; toUserId: character.userId }` to the campaign message API. For monster-type combatants, no player message is sent.

#### Scenario: Notification fires for player combatant

- **Given** a concentrating combatant with `type: "player"` and `id: "character-abc123"`, with a matching `Character` in `characters[]` with `userId: "user-xyz"`, and `effectiveDamage > 0`
- **When** damage is applied and `onConSaveRequired(dc)` is invoked
- **Then** `ActiveCombatView` POSTs a `CampaignMessage` with `visibility: { scope: "direct"; toUserId: "user-xyz" }` containing the CON save DC

#### Scenario: No player message for monster combatant

- **Given** a concentrating combatant with `type: "monster"` and `effectiveDamage > 0`
- **When** damage is applied and `onConSaveRequired(dc)` is invoked
- **Then** no direct-message campaign POST is made (DM-only alert only)

#### Scenario: No notification when damage is zero

- **Given** a concentrating combatant immune to the incoming damage type
- **When** damage is applied and `effectiveDamage = 0`
- **Then** `onConSaveRequired` is not called and no campaign message is posted

---

### Requirement: ADDED End Concentration clears state

The system SHALL clear `concentratingOn` and `pendingConSaveDC` from the combatant when the DM clicks "End Concentration" in `CombatantDetailPanel`.

#### Scenario: End Concentration button clears fields

- **Given** `CombatantDetailPanel` rendered with a combatant where `concentratingOn: "Silence"` and `pendingConSaveDC: 11`
- **When** the DM clicks "End Concentration"
- **Then** `onUpdate` is called with `concentratingOn: undefined` and `pendingConSaveDC: undefined`

---

### Requirement: ADDED Setting a new spell replaces the previous concentration

The system SHALL overwrite `concentratingOn` when the DM submits a new spell name, regardless of the current value.

#### Scenario: New spell overwrites old

- **Given** a combatant with `concentratingOn: "Hold Monster"`
- **When** the DM enters "Bless" in the spell name input and saves
- **Then** `onUpdate` is called with `concentratingOn: "Bless"` and the previous value is gone

---

### Requirement: ADDED Concentration auto-clears when combatant reaches 0 HP

The system SHALL clear `concentratingOn` and `pendingConSaveDC` when damage reduces the combatant's HP to 0.

#### Scenario: Auto-clear at 0 HP

- **Given** a combatant with `concentratingOn: "Entangle"`, `hp: 5`, and incoming `damage: 10`
- **When** damage is applied
- **Then** `hp = 0`, `concentratingOn` is undefined, and `pendingConSaveDC` is undefined

#### Scenario: Concentration preserved when HP > 0 after damage

- **Given** a combatant with `concentratingOn: "Entangle"`, `hp: 10`, and incoming `damage: 5`
- **When** damage is applied
- **Then** `hp = 5` and `concentratingOn` remains `"Entangle"`

---

## MODIFIED Requirements

### Requirement: MODIFIED `CombatantState` type carries optional concentration fields

The `CombatantState` interface SHALL include two new optional fields: `concentratingOn?: string` and `pendingConSaveDC?: number`. All existing code that constructs or spreads `CombatantState` is unaffected because both fields are optional.

#### Scenario: Existing combatant construction is unchanged

- **Given** `buildCombatantFromSource` is called with a monster or character source
- **When** the returned `CombatantState` is inspected
- **Then** `concentratingOn` and `pendingConSaveDC` are both `undefined` (absent), and no existing tests break

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal: "Mark a combatant as concentrating on a named spell" → Requirement: Set Concentration / End Concentration (detail panel, D5)
- Proposal: "Auto-calculate and display CON save DC" → Requirement: `calcConSaveDC` + DC prompt (D2, D4)
- Proposal: "Visual indicator in the combatant row" → Requirement: Concentration badge
- Proposal: "End concentration button" → Requirement: End Concentration
- Proposal: "Auto-clear at 0 HP" → Requirement: Auto-clear at 0 HP (D3)
- Proposal: "Only one spell at a time" → Requirement: Single spell enforcement
- Proposal: "CON save notice to DM and player" → Requirement: Player Notification (D4)
- Design D1 → `CombatantState` MODIFIED Requirement
- Design D2 → `calcConSaveDC` Requirement + DC prompt Requirement
- Design D3 → Auto-clear at 0 HP Requirement
- Design D4 → CON save notification Requirement + DC prompt Requirement
- Design D5 → End Concentration Requirement + Set Concentration Requirement

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Immunity produces no CON save

- See functional scenario: "DC prompt absent when damage is fully absorbed by immunity (effectiveDamage = 0)"

#### Scenario: No DB write occurs during concentration state changes

- **Given** any concentration state update (set, clear, DC display)
- **When** the state change is applied
- **Then** no writes to `lib/storage.ts` or any MongoDB collection are made; all changes are in-memory only

### Requirement: Performance

#### Scenario: Concentration check adds no latency

- `calcConSaveDC` is O(1) integer math with no I/O. No dedicated latency scenario is required; complexity is trivially negligible.

### Requirement: Security

- DC value is rendered only in the DM-facing combatant card view. See functional scenario: "DC prompt appears after damage". No separate access-control scenario is required because the DC prompt renders within the existing DM-only card UI.
