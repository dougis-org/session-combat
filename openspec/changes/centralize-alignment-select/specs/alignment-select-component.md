## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED AlignmentSelect reusable component

The system SHALL provide a reusable `AlignmentSelect` component in `lib/components/AlignmentSelect.tsx` that renders a labeled, accessible alignment dropdown.

#### Scenario: Component renders all valid alignments

- **Given** `AlignmentSelect` is rendered with `value=""`, `onChange` callback, and `disabled={false}`
- **When** the component mounts
- **Then** a `<label>` with text "Alignment" is rendered, a `<select>` with `aria-label="Alignment"` is rendered, and 10 options are present (1 placeholder "Select Alignment" + 9 valid D&D alignments from `VALID_ALIGNMENTS`)

#### Scenario: Component reflects controlled value

- **Given** `AlignmentSelect` is rendered with `value="Lawful Good"`
- **When** the component mounts
- **Then** the select element's selected option is "Lawful Good"

#### Scenario: Component fires onChange when selection changes

- **Given** `AlignmentSelect` is rendered with an `onChange` spy
- **When** the user selects "Chaotic Neutral"
- **Then** `onChange` is called once with the string `"Chaotic Neutral"`

#### Scenario: Component is disabled when saving

- **Given** `AlignmentSelect` is rendered with `disabled={true}`
- **When** the component mounts
- **Then** the `<select>` element has the `disabled` attribute

## MODIFIED Requirements

### Requirement: MODIFIED Character editor alignment field

The system SHALL use the `AlignmentSelect` component in `app/characters/page.tsx` in place of the inline alignment select, with identical behavior to the previous implementation.

#### Scenario: Character editor renders AlignmentSelect

- **Given** a character editor form is rendered
- **When** the form mounts
- **Then** a select with `aria-label="Alignment"` is present and populated with all 9 D&D alignments

#### Scenario: Removing unused AbilityScores import

- **Given** `app/characters/page.tsx` no longer uses `AbilityScores` directly
- **When** ESLint runs on the file
- **Then** no "unused import" lint error is reported

### Requirement: MODIFIED Monster editor alignment field

The system SHALL use the `AlignmentSelect` component in `app/monsters/page.tsx` in place of the inline alignment select.

#### Scenario: Monster editor renders AlignmentSelect

- **Given** a monster editor form is rendered
- **When** the form mounts
- **Then** a select with `aria-label="Alignment"` is present and populated with all 9 D&D alignments

## REMOVED Requirements

### Requirement: REMOVED Inline alignment select markup in character and monster editors

Reason for removal: Replaced by `AlignmentSelect` component to eliminate duplication. The inline `<select>` blocks in `app/characters/page.tsx` and `app/monsters/page.tsx` are removed and superseded by the new component.

## Traceability

- Proposal element "New AlignmentSelect component" → Requirement: ADDED AlignmentSelect reusable component
- Design Decision 1 (no wrapper, owns label) → Requirement: ADDED AlignmentSelect reusable component
- Design Decision 2 (string onChange) → Scenario: Component fires onChange when selection changes
- Requirement: ADDED AlignmentSelect → Task: Create lib/components/AlignmentSelect.tsx
- Requirement: MODIFIED Character editor → Task: Update app/characters/page.tsx
- Requirement: MODIFIED Monster editor → Task: Update app/monsters/page.tsx

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Screen reader can identify alignment control

- **Given** `AlignmentSelect` is rendered in either editor
- **When** a screen reader queries the select element
- **Then** the element is announced as a combobox with accessible name "Alignment" (verified via `getByRole('combobox', { name: 'Alignment' })` in RTL)
