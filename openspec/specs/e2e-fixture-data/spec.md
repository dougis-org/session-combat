## ADDED Requirements

### Requirement: E2E fixture files are external JSON consumed by parameterized tests
`tests/e2e/fixtures/characters.json` and `tests/e2e/fixtures/parties.json` SHALL exist as standalone JSON files importable via `import fixtures from './fixtures/characters.json'`. Each file SHALL be a JSON array of objects whose fields match the fixture usage in the corresponding spec file. Fixture files SHALL NOT contain test logic, assertions, or Playwright API calls.

#### Scenario: characters.json is a valid JSON array
- **WHEN** `tests/e2e/fixtures/characters.json` is parsed
- **THEN** it is a non-empty JSON array where each element has `name`, `class`, `race`, and `alignment` string fields
- **AND** all `name` values are unique across the array

#### Scenario: parties.json is a valid JSON array
- **WHEN** `tests/e2e/fixtures/parties.json` is parsed
- **THEN** it is a non-empty JSON array where each element has `name` and `description` string fields
- **AND** all `name` values are unique across the array

### Requirement: Fixture data covers meaningful domain variations
`characters.json` SHALL include entries covering at least 3 distinct D&D class/race combinations sourced from `VALID_CLASSES` and `VALID_RACES` in `lib/types.ts`. `parties.json` SHALL include at least one entry with an empty description string to verify optional field handling.

#### Scenario: character fixtures span multiple classes and races
- **WHEN** `characters.json` fixture entries are enumerated
- **THEN** at least 3 distinct values appear in the `class` field
- **AND** at least 3 distinct values appear in the `race` field
- **AND** all `class` values are members of `VALID_CLASSES`
- **AND** all `race` values are members of `VALID_RACES`

#### Scenario: party fixtures include an empty description entry
- **WHEN** `parties.json` fixture entries are enumerated
- **THEN** at least one entry has `"description": ""`
- **AND** the corresponding parameterized party test covers saving the party and showing it in the list

### Requirement: Fixture files can be extended without touching spec code
Adding a new entry to `characters.json` or `parties.json` SHALL automatically generate a new parameterized test on the next run without modifying any `.ts` file.

#### Scenario: New JSON entry produces new test
- **WHEN** a valid entry is appended to `characters.json`
- **AND** `npm run test:regression` is executed
- **THEN** a new test named after the entry's `name` field appears in the Playwright report
- **AND** no `.ts` file was modified
