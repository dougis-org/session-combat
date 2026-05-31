## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Two-column layout heading visibility

The system SHALL render "PLAYERS (N)" and "MONSTERS (N)" headings in the tooltip, where N reflects only alive combatants.

#### Scenario: Both column headings visible after hover

- **Given** a mix of alive player and alive monster combatants
- **When** the user hovers the info icon
- **Then** text matching `PLAYERS (1)` and `MONSTERS (1)` appears in the tooltip

#### Scenario: Dead combatants excluded from header counts

- **Given** one alive player and one dead monster
- **When** the user hovers the info icon
- **Then** `PLAYERS (1)` and `MONSTERS (0)` appear (dead monster not counted)

---

### Requirement: ADDED Same-name combatant grouping with ×N multiplier

The system SHALL group alive combatants sharing a name and display a `×N` multiplier when N > 1.

#### Scenario: Two monsters with the same name are grouped

- **Given** two alive monsters both named "Goblin"
- **When** the user hovers the info icon
- **Then** "Goblin" appears once with "×2" as a sibling text node
- **And** `MONSTERS (2)` appears in the column header

#### Scenario: Single combatant has no multiplier

- **Given** one alive monster named "Dragon"
- **When** the user hovers the info icon
- **Then** "Dragon" appears without any "×" multiplier text

---

### Requirement: ADDED Status condition display with duration

The system SHALL render each condition name and its duration (if set) below the combatant name.

#### Scenario: Condition with duration renders correctly

- **Given** an alive player with condition `{ name: "Poisoned", duration: 3 }`
- **When** the user hovers the info icon
- **Then** text "• Poisoned (3)" appears in the tooltip

#### Scenario: Condition without duration renders name only

- **Given** an alive player with condition `{ name: "Blinded", duration: undefined }`
- **When** the user hovers the info icon
- **Then** text "• Blinded" appears (no trailing parenthesis)

---

### Requirement: ADDED DEFEATED section with delimiter

The system SHALL render a "DEFEATED" label (and a visual delimiter) within a column when dead combatants of that type exist.

#### Scenario: DEFEATED label appears for dead monsters

- **Given** one dead monster
- **When** the user hovers the info icon
- **Then** the text "DEFEATED" appears in the Monsters column area

#### Scenario: No DEFEATED label when no dead combatants

- **Given** only alive combatants
- **When** the user hovers the info icon
- **Then** "DEFEATED" is not present in the tooltip

---

### Requirement: ADDED Strikethrough styling on dead combatants

The system SHALL render dead combatant names with CSS `line-through` applied via a parent element's class.

#### Scenario: Dead combatant name wrapped in line-through element

- **Given** one dead monster named "Goblin"
- **When** the user hovers the info icon
- **Then** the element containing "Goblin" has an ancestor with class `line-through`

---

### Requirement: ADDED "None" fallback text for empty alive section

The system SHALL display "None" (italic) in a column when no alive combatants of that type exist.

#### Scenario: Players column shows "None" when only monsters present

- **Given** one alive monster and no players
- **When** the user hovers the info icon
- **Then** "None" appears in the tooltip (Players column has no alive entries)

#### Scenario: Monsters column shows "None" when only players present

- **Given** one alive player and no monsters
- **When** the user hovers the info icon
- **Then** "None" appears in the tooltip (Monsters column has no alive entries)

---

### Requirement: ADDED Independent column alive+dead sections

The system SHALL render alive and dead sections per column independently; a dead entry in one column does not affect the other column's display.

#### Scenario: One alive player and one dead monster shows mixed state

- **Given** one alive player and one dead monster
- **When** the user hovers the info icon
- **Then** the Players column shows the alive player (no DEFEATED section)
- **And** the Monsters column shows a DEFEATED section with the dead monster

---

### Requirement: ADDED Empty state rendering

The system SHALL render without errors and show "No combatants" text when the combatant list is empty.

#### Scenario: Empty combatant list renders gracefully

- **Given** no combatants (empty array passed as prop)
- **When** the user hovers the info icon
- **Then** the tooltip shows "No combatants" and does not throw

## MODIFIED Requirements

None. No existing requirements are changed; only new test coverage is being added.

## REMOVED Requirements

None.

## Traceability

- Proposal element "two-column layout headings" -> Requirement: Two-column layout heading visibility
- Proposal element "alive-count in headers" -> Requirement: Two-column layout heading visibility
- Proposal element "×N grouping" -> Requirement: Same-name combatant grouping with ×N multiplier
- Proposal element "status conditions with durations" -> Requirement: Status condition display with duration
- Proposal element "delimiter / DEFEATED label" -> Requirement: DEFEATED section with delimiter
- Proposal element "strikethrough on dead" -> Requirement: Strikethrough styling on dead combatants
- Proposal element "'None' fallback" -> Requirement: "None" fallback text for empty alive section
- Proposal element "independent columns" -> Requirement: Independent column alive+dead sections
- Proposal element "empty state" -> Requirement: Empty state rendering
- Design Decision 1 -> All requirements (all tests go in the single existing file)
- Design Decision 2 -> All requirements (selectors grounded in actual component output)
- Design Decision 3 -> Grouping, condition, and independent-column requirements
- All requirements -> Task: Add missing RTL tests to CombatInfoIcon.test.tsx

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No test flake from async hover interactions

- **Given** `userEvent.setup()` pattern already used in the file
- **When** hover tests run in jsdom
- **Then** all tests pass consistently across runs (no timing-dependent failures)
