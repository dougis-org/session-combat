## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Unit tests for monster selection

The system SHALL have automated tests verifying that clicking Add on a monster row invokes `onAddMonster` with the correct payload.

#### Scenario: Adding a monster calls onAddMonster with correct payload

- **Given** the monsters tab is active with at least one monster template (Goblin, id="g1")
- **When** the user clicks the "Add" button for Goblin (aria-label: "Add Goblin to encounter")
- **Then** `onAddMonster` is called once with an object containing `{ id: 'test-uuid', templateId: 'g1', name: 'Goblin' }` and all other fields spread from the template

#### Scenario: Adding a monster shows success toast

- **Given** `showToast=true` (default)
- **When** the user clicks Add for Goblin
- **Then** a toast with the text "Goblin added successfully" is visible

#### Scenario: Adding a monster with showToast=false shows no toast

- **Given** `showToast=false`
- **When** the user clicks Add for Goblin
- **Then** no toast element is rendered

#### Scenario: Modal stays open after adding a monster

- **Given** the monsters tab is active
- **When** the user clicks Add for Goblin
- **Then** the modal is still visible (the "Add Combatant" heading is still present) and `onClose` has not been called

#### Scenario: Global badge shown for global monster

- **Given** a monster with `userId === GLOBAL_USER_ID`
- **When** the monsters tab renders
- **Then** "(Global)" badge is visible next to that monster's name

#### Scenario: Mine badge shown for user's own monster

- **Given** a monster with `userId === userId` prop
- **When** the monsters tab renders
- **Then** "(Mine)" badge is visible next to that monster's name

#### Scenario: Shared badge shown for other user's monster

- **Given** a monster with `userId` that is neither GLOBAL_USER_ID nor the current userId
- **When** the monsters tab renders
- **Then** "(Shared)" badge is visible next to that monster's name

### Requirement: ADDED Unit tests for character selection

The system SHALL have automated tests verifying that clicking Add on a character row invokes `onAddCharacter` with the correct payload.

#### Scenario: Adding a character calls onAddCharacter with the character object

- **Given** the characters tab is active with "Aria" (id="c1")
- **When** the user clicks the "Add" button for Aria (aria-label: "Add Aria to combat")
- **Then** `onAddCharacter` is called once with the Aria character object

#### Scenario: Adding a character shows success toast

- **Given** `showToast=true` and the characters tab is active
- **When** the user clicks Add for Aria
- **Then** a toast with the text "Aria added successfully" is visible

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (monster selection, character selection callbacks) -> Requirement: ADDED Unit tests for monster/character selection
- Design decision: Decision 5 (spy crypto.randomUUID) -> Scenario: Adding a monster calls onAddMonster with correct payload
- Design decision: Decision 1 (RTL) -> all click scenarios use `userEvent.click`
- Requirement -> Task(s): tasks.md §4 "Test: monster selection", §5 "Test: character tab"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Selection callbacks are called exactly once per click

- **Given** a monster template in the list
- **When** the Add button is clicked once
- **Then** `onAddMonster` is called exactly once (toHaveBeenCalledTimes(1)) — no double-fire
