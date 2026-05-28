## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Unit tests for custom combatant form

The system SHALL have automated tests verifying that the Create New tab form validates input and calls `onAddMonster` with the correct payload on success.

#### Scenario: Custom form renders all fields

- **Given** the user switches to the "Create New" tab
- **When** the tab panel is visible
- **Then** fields for Name, Dexterity, AC, Max HP, Current HP, and Initiative are present, along with "Add Combatant" and "Cancel" buttons

#### Scenario: Happy path — submitting valid custom monster

- **Given** the Create New tab is active and the user fills: Name="Dragon", Dexterity=14, AC=15, Max HP=50, Current HP=50, Initiative (blank)
- **When** the user clicks "Add Combatant"
- **Then** `onAddMonster` is called with `{ name: 'Dragon', ac: 15, maxHp: 50, hp: 50, abilityScores: { dexterity: 14, ... } }` and `onClose` is called

#### Scenario: Happy path — custom monster with initiative set

- **Given** the user fills the form with Name="Dragon" and Initiative=18
- **When** the user clicks "Add Combatant"
- **Then** `onAddMonster` is called with an object containing `{ initiative: 18 }`

#### Scenario: Happy path — initiative blank omits field from payload

- **Given** the user fills the form with Name="Dragon" and leaves Initiative blank
- **When** the user clicks "Add Combatant"
- **Then** `onAddMonster` is called with an object that does NOT contain the `initiative` key

#### Scenario: Dexterity modifier display

- **Given** the Create New tab is active with default Dexterity=10
- **When** the user changes Dexterity to 14
- **Then** the modifier display shows "+2"

#### Scenario: Validation — empty name

- **Given** the Create New tab is active with all fields at default values (Name is empty)
- **When** the user clicks "Add Combatant"
- **Then** the error "Name is required" is visible and `onAddMonster` is NOT called

#### Scenario: Validation — dexterity out of range (too low)

- **Given** the user enters Name="Dragon" and Dexterity=0
- **When** the user clicks "Add Combatant"
- **Then** an error containing "Dexterity must be between 1 and 30" is visible and `onAddMonster` is NOT called

#### Scenario: Validation — dexterity out of range (too high)

- **Given** the user enters Name="Dragon" and Dexterity=31
- **When** the user clicks "Add Combatant"
- **Then** an error containing "Dexterity must be between 1 and 30" is visible and `onAddMonster` is NOT called

#### Scenario: Validation — AC less than 1

- **Given** the user enters Name="Dragon" and AC=0
- **When** the user clicks "Add Combatant"
- **Then** the error "AC must be at least 1" is visible and `onAddMonster` is NOT called

#### Scenario: Validation — Max HP less than 1

- **Given** the user enters Name="Dragon" and Max HP=0
- **When** the user clicks "Add Combatant"
- **Then** the error "Max HP must be at least 1" is visible and `onAddMonster` is NOT called

#### Scenario: Validation — Current HP exceeds Max HP

- **Given** the user enters Name="Dragon", Max HP=10, and Current HP=11
- **When** the user clicks "Add Combatant"
- **Then** the error "Current HP must be between 0 and Max HP" is visible and `onAddMonster` is NOT called

#### Scenario: Validation error clears on tab switch

- **Given** the user has triggered a validation error ("Name is required")
- **When** the user switches to the Monsters tab and back to Create New
- **Then** the error message is no longer visible

#### Scenario: Cancel button calls onClose

- **Given** the Create New tab is active
- **When** the user clicks "Cancel"
- **Then** `onClose` is called once

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (custom form happy path and all validation branches) -> Requirement: ADDED Unit tests for custom combatant form
- Design decision: Decision 1 (RTL) -> all userEvent.type/click interactions
- Design decision: Decision 5 (spy crypto.randomUUID) -> happy path payload assertion
- Requirement -> Task(s): tasks.md §6 "Test: custom form"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Validation prevents invalid submissions

- **Given** any combination of invalid field values
- **When** the form is submitted
- **Then** `onAddMonster` is never called and an error message is always displayed — no silent partial submissions
