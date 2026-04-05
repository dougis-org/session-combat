## ADDED Requirements

### Requirement: Party creation happy-path is data-driven across name/description variants
`tests/e2e/parties.spec.ts` SHALL use `test.each(partyFixtures)` where `partyFixtures` is imported from `tests/e2e/fixtures/parties.json`. Each fixture entry SHALL produce a named test that creates a party and asserts it appears in the party list. The fixture file SHALL contain at least 3 distinct entries covering different name and description combinations (including an empty description).

#### Scenario: Each fixture variant produces a named passing test
- **WHEN** `test.each(partyFixtures)` runs with a fixture entry `{ name, description }`
- **THEN** a party is created via the UI using those values
- **AND** the party's name appears in the party list after saving
- **AND** the test title includes the party name

#### Scenario: New fixture entry requires no code change
- **WHEN** a new entry is added to `tests/e2e/fixtures/parties.json`
- **THEN** a new parameterized test is automatically generated on the next test run without modifying any `.ts` file

### Requirement: Party creation validates empty name
`tests/e2e/parties.spec.ts` SHALL include a test asserting that the Save Party button is disabled when the party name field is empty.

#### Scenario: Save button disabled with empty party name
- **WHEN** the party creation form is open and the name field is empty or cleared
- **THEN** the Save Party button is disabled and cannot be clicked to submit

#### Scenario: Validation error shown when name is blank on save
- **WHEN** the party name contains only whitespace and a save is attempted
- **THEN** the UI displays "Party name is required"

### Requirement: Party form shows no-members message when user has no characters
`tests/e2e/parties.spec.ts` SHALL include a test verifying that the party form displays a "No characters available" message when the authenticated user has zero characters.

#### Scenario: No characters available message displayed
- **WHEN** the user has no characters
- **AND** the party creation form is opened
- **THEN** the form displays text matching "No characters available"
- **AND** no checkboxes are shown for member selection

### Requirement: Party with members shows correct member count and names in list
`tests/e2e/parties.spec.ts` SHALL include a test that API-seeds a character, creates a party with that character as a member, and asserts the party card shows the correct member count and the character's name.

#### Scenario: Party card shows member count after creation
- **WHEN** a party is created with one member
- **THEN** the party list card displays "Members: 1"

#### Scenario: Party card shows member names after creation
- **WHEN** a party is created with a seeded character named "Seed Fighter"
- **THEN** the party list card displays "Seed Fighter" in the member names area

### Requirement: Party with no members can be created and persists
`tests/e2e/parties.spec.ts` SHALL include a test that creates a party without selecting any members and asserts it appears in the list showing zero members.

#### Scenario: Empty party persists in list
- **WHEN** a party is created with a name but no members checked
- **THEN** the party list shows the party name
- **AND** the card shows "Members: 0"

### Requirement: Party name can be edited and change persists
`tests/e2e/parties.spec.ts` SHALL include a test that creates a party, edits its name, saves, and asserts the new name is displayed.

#### Scenario: Edited party name persists in list
- **WHEN** an existing party's name is changed via the Edit form and saved
- **THEN** the party list shows the new name
- **AND** the old name no longer appears in the list

### Requirement: Party can be deleted
`tests/e2e/parties.spec.ts` SHALL include a test that creates a party, deletes it, and asserts it no longer appears in the list.

#### Scenario: Deleted party disappears from list
- **WHEN** a party's Delete button is clicked and the confirmation dialog is accepted
- **THEN** the party no longer appears in the party list
