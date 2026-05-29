# Capability: TargetActionModal Test Migration

Covers `tests/unit/components/TargetActionModal.test.tsx` — migration to RTL. This file becomes the canonical RTL pattern reference for the project after migration.

## MODIFIED Requirements

### Requirement: MODIFIED TargetActionModal.test.tsx uses RTL APIs exclusively

The system SHALL test `TargetActionModal` using `@testing-library/react` and `@testing-library/user-event`, with no `createRoot`, `Root`, `act`, `findButton()`, `changeInputValue()`, or `IS_REACT_ACT_ENVIRONMENT`.

#### Scenario: Initial screen renders target info and action buttons

- **Given** `TargetActionModal` is rendered with a target (name="Goblin Target", hp=7, maxHp=7, ac=13)
- **When** the component mounts
- **Then** `screen.getByText('Goblin Target')` is in the document
- **Then** text containing "HP: 7/7" is visible
- **Then** text containing "AC: 13" is visible
- **Then** `screen.getByRole('button', { name: /apply damage/i })` is present
- **Then** `screen.getByRole('button', { name: /add condition/i })` is present
- **Then** `screen.getByRole('button', { name: /cancel/i })` is present

#### Scenario: Cancel button calls onClose

- **Given** `TargetActionModal` is rendered with a `onClose` mock and `userEvent.setup()`
- **When** the user clicks the Cancel button
- **Then** `onClose` has been called once

#### Scenario: Apply Damage button transitions to damage screen

- **Given** `TargetActionModal` is on the initial screen
- **When** the user clicks "Apply Damage"
- **Then** the initial action buttons are no longer in the document
- **Then** `screen.getByPlaceholderText('Damage amount')` is present (number input)
- **Then** `screen.getByRole('combobox', { name: /damage type/i })` is present

#### Scenario: Damage flow submits correct values to onApplyDamage

- **Given** the modal is in damage mode with `userEvent.setup()`
- **When** the user types "5" into the damage amount input
- **And** the user selects "fire" from the damage type combobox
- **Then** the Apply button label updates to include "(fire)"
- **When** the user clicks the Apply button
- **Then** `onApplyDamage` has been called with `(5, 'fire')`

#### Scenario: Damage flow with no type selected submits empty string type

- **Given** the modal is in damage mode with `userEvent.setup()`
- **When** the user types "3" into the damage amount input and does not change the damage type
- **And** clicks the Apply button (label is just "Apply")
- **Then** `onApplyDamage` has been called with `(3, '')`

#### Scenario: Add Condition button transitions to condition screen

- **Given** `TargetActionModal` is on the initial screen
- **When** the user clicks "Add Condition"
- **Then** the initial action buttons are no longer in the document
- **Then** `screen.getByPlaceholderText('Condition name')` is present
- **Then** `screen.getByPlaceholderText('Duration in rounds (optional)')` is present

#### Scenario: Condition flow submits correct values to onAddCondition

- **Given** the modal is in condition mode with `userEvent.setup()`
- **When** the user types "Stunned" into the condition name input
- **And** the user types "3" into the duration input
- **And** clicks the Add button
- **Then** `onAddCondition` has been called with `('Stunned', 3)`

#### Scenario: Condition flow with no duration calls onAddCondition with undefined duration

- **Given** the modal is in condition mode with `userEvent.setup()`
- **When** the user types "Blinded" into the condition name input and leaves duration empty
- **And** clicks the Add button
- **Then** `onAddCondition` has been called with `('Blinded', undefined)`

## REMOVED Requirements

### Requirement: REMOVED custom `findButton()` helper

Reason for removal: Replaced by `screen.getByRole('button', { name: /.../ })`.

### Requirement: REMOVED custom `changeInputValue()` native-setter hack

Reason for removal: Replaced by `await userEvent.type()` and `await userEvent.selectOptions()`.

## Traceability

- Proposal: "Migrate TargetActionModal.test.tsx; becomes canonical RTL reference" → Requirement above
- Design decision 2 (`userEvent.setup()` per test) → All interaction scenarios
- Design decision 4 (query strategy: `getByRole`, `getByPlaceholderText`, `getByRole('combobox')`) → All scenarios
- Requirement → Task: "Migrate TargetActionModal.test.tsx"

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No banned legacy imports remain

- **Given** `TargetActionModal.test.tsx` has been migrated
- **When** `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|findButton|changeInputValue" tests/unit/components/TargetActionModal.test.tsx` is run
- **Then** the output is empty

#### Scenario: File serves as RTL pattern reference

- **Given** the file uses `userEvent.setup()` per test, `screen.*` queries, and `await user.*` interactions
- **When** a contributor reads the file to understand how to write RTL component tests
- **Then** all patterns are self-consistent and represent current project conventions
