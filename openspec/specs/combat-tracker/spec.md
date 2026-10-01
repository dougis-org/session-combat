## Purpose

Defines the requirements for the combat tracker's handling of combatant sorting and batch initiative rolling.

## Requirements

### Requirement: Batch Monster Initiative Rolling

The system SHALL allow batch rolling of initiative for all unrolled monsters via the `InitiativeEntry` UI when at least one monster lacks an initiative roll.

#### Scenario: Multiple unrolled monsters

- **Given** an encounter has started with 3 unrolled monsters and 2 unrolled players
- **When** the DM clicks "Roll d20 for all 3 unrolled Monsters" in the initiative modal for the first monster
- **Then** all 3 monsters receive an initiative roll, the combatants list re-sorts, and the modal snaps to the first unrolled player

#### Scenario: Applying advantage and flat bonus to batch

- **Given** the modal for the first unrolled monster has "Advantage" checked and a flat bonus of "+2" entered
- **When** the DM clicks the batch roll button
- **Then** every unrolled monster is rolled with advantage and a +2 flat bonus applied to their respective dexterity modifier

### Requirement: Unrolled Combatant Sorting

The system SHALL prioritize sorting unrolled monsters above unrolled players when determining the Initiative Order list and modal auto-pop target.

#### Scenario: Encounter Start Sorting

- **Given** an encounter has started with unrolled monsters and unrolled players
- **When** the combatants list is rendered
- **Then** all unrolled monsters appear at the top of the list, followed by all unrolled players

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** a combat with 20 unrolled monsters
- **When** the batch roll button is clicked
- **Then** the UI updates and re-sorts within 100ms without perceptible lag
