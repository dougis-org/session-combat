## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Combatant Concentration State

The system SHALL allow a combatant to be marked as concentrating on a named spell.

#### Scenario: Set concentration on a combatant

- **Given** A combatant in an active combat
- **When** The DM opens the combatant detail popup and enters a spell name in the Concentration field
- **Then** The combatant row displays a concentration indicator with the spell name and an [End] button

#### Scenario: End concentration manually

- **Given** A combatant with an active concentration spell
- **When** The DM clicks the [End] button on the combatant row
- **Then** The concentration spell is cleared, the indicator is removed, and a toast appears: "[Name] ended concentration on [Spell]"

### Requirement: ADDED Concentration DC Reminder

The system SHALL display a DC badge when damage is dealt to a concentrating combatant.

#### Scenario: DC badge appears on damage

- **Given** A combatant concentrating on "Hold Person" with 45 HP
- **When** 24 damage is dealt to the combatant
- **Then** A DC badge appears showing "DC 12 (took 24 dmg)" where DC = max(10, floor(24/2)) = 12

#### Scenario: DC badge updates on subsequent damage

- **Given** A combatant concentrating with an existing DC badge showing DC 10 (took 20 dmg)
- **When** An additional 8 damage is dealt to the combatant
- **Then** The DC badge updates to show "DC 14 (took 28 dmg)"

#### Scenario: DC badge clears on turn advance

- **Given** A combatant concentrating with a visible DC badge
- **When** The turn advances (nextTurn is called)
- **Then** The DC badge is no longer visible

### Requirement: ADDED Concentration Auto-Clear on Unconsciousness

The system SHALL automatically clear concentration when a combatant reaches 0 HP.

#### Scenario: Concentration clears at 0 HP

- **Given** A combatant concentrating on "Hold Person" with 5 HP
- **When** 10 damage is dealt (reducing HP to 0)
- **Then** The concentration spell is cleared, and a toast appears: "[Name] lost concentration on Hold Person"

#### Scenario: Concentration persists when temp HP absorbs damage

- **Given** A combatant concentrating on "Hold Person" with 30 HP and 5 temp HP
- **When** 10 damage is dealt (temp HP absorbs 5, actual HP drops to 25)
- **Then** The concentration persists (HP is not 0, temp HP cushion applies)

### Requirement: ADDED Concentration Field in Detail Popup

The system SHALL display a concentration field in the combatant detail popup at all times.

#### Scenario: Detail popup shows concentration field

- **Given** Any combatant
- **When** The DM clicks the detail toggle on the combatant row
- **Then** The detail popup includes a "Concentration" field (free-text input)

## MODIFIED Requirements

None — this is a new feature with no existing requirements being modified.

## REMOVED Requirements

None.

## Traceability

| Proposal Element | Requirement |
|-----------------|-------------|
| Add `concentrationSpell?: string` to CombatantState | ADDED Combatant Concentration State |
| Concentration indicator in combatant row | ADDED Combatant Concentration State |
| End Concentration button with toast | ADDED Combatant Concentration State |
| DC badge on damage to concentrator | ADDED Concentration DC Reminder |
| Auto-clear concentration on 0 HP | ADDED Concentration Auto-Clear on Unconsciousness |
| Concentration field in detail popup | ADDED Concentration Field in Detail Popup |

| Design Decision | Requirement |
|-----------------|-------------|
| Decision 1: Data Model | ADDED Combatant Concentration State |
| Decision 2: DC Calculation | ADDED Concentration DC Reminder |
| Decision 3: DC Badge Trigger & Clear | ADDED Concentration DC Reminder |
| Decision 4: Auto-Clear Trigger | ADDED Concentration Auto-Clear on Unconsciousness |
| Decision 5: Toast Notifications | ADDED Combatant Concentration State, Concentration Auto-Clear |
| Decision 6: Concentration Field | ADDED Concentration Field in Detail Popup |

| Requirement | Task(s) |
|-------------|---------|
| ADDED Combatant Concentration State | Add concentrationSpell field, add indicator in CombatantCard, add End button handler |
| ADDED Concentration DC Reminder | Add DC badge state, calculate on damage, clear on turn advance |
| ADDED Concentration Auto-Clear on Unconsciousness | Add hp === 0 check in adjustHp, clear concentration, show toast |
| ADDED Concentration Field in Detail Popup | Add field to detail popup, wire to updateCombatant |

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Non-blocking UX

- **Given** A combatant concentrating, 20 damage dealt
- **When** the DC badge appears
- **Then** No dialog, alert, or confirmation blocks the UI; the DM can continue combat immediately

#### Scenario: Toast visibility

- **Given** Concentration ends (manual or auto-clear)
- **When** Toast appears
- **Then** Toast is visible for 3 seconds then auto-dismisses; user can continue without action