## Purpose
Define the shared alignment selection UI used by character and monster editors.

## Requirements

### Requirement: A reusable AlignmentSelect component exists
The system SHALL provide a reusable `AlignmentSelect` component in `lib/components/AlignmentSelect.tsx` that renders a labeled, accessible alignment dropdown.

#### Scenario: Component renders all standard alignments
- **GIVEN** `AlignmentSelect` is rendered with `value=""`, an `onChange` callback, and `disabled={false}`
- **WHEN** the component mounts
- **THEN** a `<label>` with text `"Alignment"` is rendered
- **AND** a `<select>` with `aria-label="Alignment"` is rendered
- **AND** 10 options are present: one placeholder plus the 9 standard D&D alignments

#### Scenario: Component reflects a controlled value
- **GIVEN** `AlignmentSelect` is rendered with `value="Lawful Good"`
- **WHEN** the component mounts
- **THEN** the selected option is `"Lawful Good"`

#### Scenario: Component fires onChange with the selected value
- **GIVEN** `AlignmentSelect` is rendered with an `onChange` spy
- **WHEN** the user selects `"Chaotic Neutral"`
- **THEN** `onChange` is called once with `"Chaotic Neutral"`

#### Scenario: Component is disabled while saving
- **GIVEN** `AlignmentSelect` is rendered with `disabled={true}`
- **WHEN** the component mounts
- **THEN** the `<select>` element is disabled

### Requirement: Character editor uses AlignmentSelect
The system SHALL use `AlignmentSelect` in `app/characters/page.tsx` instead of inline alignment-select markup.

#### Scenario: Character editor renders the shared alignment control
- **GIVEN** the character editor form is open
- **WHEN** the form mounts
- **THEN** a combobox with accessible name `"Alignment"` is present
- **AND** it is populated with the standard D&D alignments

### Requirement: Monster editor uses AlignmentSelect
The system SHALL use `AlignmentSelect` in `app/monsters/page.tsx` instead of inline alignment-select markup.

#### Scenario: Monster editor renders the shared alignment control
- **GIVEN** the monster editor form is open
- **WHEN** the form mounts
- **THEN** a combobox with accessible name `"Alignment"` is present
- **AND** it is populated with the available monster alignment options
