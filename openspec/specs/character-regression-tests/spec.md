## ADDED Requirements

### Requirement: Character creation happy-path is data-driven across class/race/alignment variants
`tests/e2e/characters.spec.ts` SHALL iterate over `characterFixtures` (imported from `tests/e2e/fixtures/characters.json`) to generate one test per entry. Each fixture entry SHALL produce a named test that creates a character and asserts it appears in the character list. The fixture file SHALL contain at least 3 distinct entries covering different class/race/alignment combinations.

#### Scenario: Each fixture variant produces a named passing test
- **WHEN** a fixture entry `{ name, class, race, alignment }` is iterated
- **THEN** a character is created via the UI using those values
- **AND** the character's name appears in the character list after saving
- **AND** the test title includes the character name, class, and race for traceability

#### Scenario: New fixture entry requires no code change
- **WHEN** a new entry is added to `tests/e2e/fixtures/characters.json`
- **THEN** a new parameterized test is automatically generated on the next test run without modifying any `.ts` file

### Requirement: Character creation validates empty name
`tests/e2e/characters.spec.ts` SHALL include a test asserting that the Save Character button is disabled when the name field is empty.

#### Scenario: Save button disabled with empty name
- **WHEN** the character creation form is open and the name field is cleared
- **THEN** the Save Character button is disabled and cannot be clicked to submit

#### Scenario: Save button disabled with whitespace-only name
- **WHEN** the name field contains only whitespace
- **THEN** the Save Character button is disabled and cannot be clicked to submit

### Requirement: Character creation validates HP exceeds maxHP
`tests/e2e/characters.spec.ts` SHALL include a test asserting that attempting to save a character with current HP greater than max HP shows a validation error.

#### Scenario: HP greater than maxHP shows error
- **WHEN** the character form has current HP set to a value greater than max HP
- **AND** the user attempts to save
- **THEN** the UI displays "Current HP cannot be greater than Max HP"
- **AND** the character is not saved

### Requirement: Character form exposes class, race, and alignment dropdowns
`tests/e2e/characters.spec.ts` SHALL include tests verifying that the class, race, and alignment select elements are present, enabled, and accept valid option selections.

#### Scenario: Class dropdown accepts a valid class selection
- **WHEN** the character creation form is open
- **THEN** `aria-label="Character class"` select is visible and enabled
- **AND** selecting "Rogue" updates the displayed value to "Rogue"

#### Scenario: Race dropdown accepts a valid race selection
- **WHEN** the character creation form is open
- **THEN** `aria-label="Character race"` select is visible and enabled
- **AND** selecting "Tiefling" updates the displayed value to "Tiefling"

#### Scenario: Alignment dropdown accepts a valid alignment selection
- **WHEN** the character creation form is open
- **THEN** `aria-label="Alignment"` select is visible and enabled
- **AND** selecting "Chaotic Good" updates the displayed value to "Chaotic Good"

### Requirement: Multiclass support is testable via the character form
`tests/e2e/characters.spec.ts` SHALL include a test verifying that a second class can be added via the "Add Class" button and that the Remove button is disabled when only one class remains.

#### Scenario: Add Class button appends a second class entry
- **WHEN** the character form is open with one class
- **AND** the user clicks "Add Class"
- **THEN** a second class row appears with its own class select and level input

#### Scenario: Remove button disabled when only one class exists
- **WHEN** the character form has exactly one class entry
- **THEN** the Remove button for that entry is disabled

### Requirement: Created character appears in list with class/level info
`tests/e2e/characters.spec.ts` SHALL include a test that creates a character and asserts the character list card displays the character name and class/level text.

#### Scenario: Character card shows name and class after creation
- **WHEN** a character named "Persistence Test" with class "Paladin" level 1 is saved
- **THEN** the character list shows a card with text "Persistence Test"
- **AND** the card contains text matching "Paladin Level 1"

### Requirement: Character can be edited and name change persists
`tests/e2e/characters.spec.ts` SHALL include a test that creates a character, edits its name, saves, and asserts the new name is displayed.

#### Scenario: Edited character name persists in list
- **WHEN** an existing character's name is changed via the Edit form and saved
- **THEN** the character list shows the new name
- **AND** the old name no longer appears in the list

### Requirement: Character can be deleted
`tests/e2e/characters.spec.ts` SHALL include a test that creates a character, deletes it, and asserts it no longer appears in the list.

#### Scenario: Deleted character disappears from list
- **WHEN** a character's Delete button is clicked and the confirmation dialog is accepted
- **THEN** the character no longer appears in the character list
