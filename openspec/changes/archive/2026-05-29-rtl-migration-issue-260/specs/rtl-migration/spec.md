## MODIFIED Requirements

This document details changes to requirements for the RTL migration of three component test files.

### Requirement: MODIFIED AlignmentSelect test suite uses RTL

The system SHALL test `AlignmentSelect` using `render`, `screen`, and `userEvent` from `@testing-library/react` and `@testing-library/user-event`, with no `createRoot`, `act`, or `container.querySelector*` usage.

#### Scenario: All existing AlignmentSelect test cases pass after migration

- **Given** `tests/unit/components/AlignmentSelect.test.tsx` is migrated to RTL
- **When** `npx jest tests/unit/components/AlignmentSelect.test.tsx --no-coverage` is run
- **Then** all 9 test cases pass with 0 failures

#### Scenario: AlignmentSelect select element is found via role query

- **Given** `AlignmentSelect` is rendered with `value=""` and an `onChange` handler
- **When** `screen.getByRole('combobox', { name: 'Alignment' })` is called
- **Then** the select element is returned without error

#### Scenario: AlignmentSelect onChange is called with selected value

- **Given** `AlignmentSelect` is rendered with a mock `onChange` handler
- **When** `userEvent.selectOptions(combobox, 'Chaotic Evil')` is awaited
- **Then** the mock `onChange` is called with `'Chaotic Evil'`

#### Scenario: AlignmentSelect disabled state is asserted semantically

- **Given** `AlignmentSelect` is rendered with `disabled={true}`
- **When** `screen.getByRole('combobox', { name: 'Alignment' })` is checked
- **Then** `expect(combobox).toBeDisabled()` passes

---

### Requirement: MODIFIED NavBar test suite uses RTL

The system SHALL test `NavBar` using `render`, `screen`, and `userEvent`, with no `createRoot`, `act`, or `container.querySelector*` usage, and preserve `jest.mock` call order above imports.

#### Scenario: All existing NavBar test cases pass after migration

- **Given** `tests/unit/components/NavBar.test.tsx` is migrated to RTL
- **When** `npx jest tests/unit/components/NavBar.test.tsx --no-coverage` is run
- **Then** all 5 test cases pass with 0 failures

#### Scenario: NavBar navigation links found via role query

- **Given** `NavBar` is rendered with unauthenticated state
- **When** `screen.getByRole('link', { name: 'Campaigns' })` through `{ name: 'Combat' }` are called
- **Then** all 6 link elements are found without error

#### Scenario: Logout button absent when unauthenticated

- **Given** `NavBar` is rendered with `isAuthenticated: false`
- **When** `screen.queryByTestId('logout-button')` is called
- **Then** `expect(element).not.toBeInTheDocument()` passes

#### Scenario: Logout callback invoked via userEvent

- **Given** `NavBar` is rendered with `isAuthenticated: true` and a mock `logout` function
- **When** `userEvent.click(screen.getByTestId('logout-button'))` is awaited
- **Then** the mock `logout` is called exactly once

---

### Requirement: MODIFIED CreatureStatBlock test suite uses RTL

The system SHALL test `CreatureStatBlock` using `render` and `screen` from `@testing-library/react`, with no `createRoot`, `act`, or `container.querySelector*` usage.

#### Scenario: All existing CreatureStatBlock test cases pass after migration

- **Given** `tests/unit/components/CreatureStatBlock.test.tsx` is migrated to RTL
- **When** `npx jest tests/unit/components/CreatureStatBlock.test.tsx --no-coverage` is run
- **Then** all 6 test cases pass with 0 failures

#### Scenario: AC and HP stats rendered and queryable by text

- **Given** `CreatureStatBlock` is rendered with `ac={16}`, `hp={30}`, `maxHp={30}`
- **When** `screen.getByText('AC')`, `screen.getByText('16')`, `screen.getByText('30/30')` are called
- **Then** all three elements are found without error

#### Scenario: Ability scores hidden in compact mode

- **Given** `CreatureStatBlock` is rendered with `isCompact={true}`
- **When** `screen.queryByText('STR')` is called
- **Then** `expect(element).not.toBeInTheDocument()` passes

---

## REMOVED Requirements

### Requirement: REMOVED Manual lifecycle boilerplate in three test files

Reason for removal: `createRoot`/`act`/`container` setup/teardown pattern replaced by RTL's automatic cleanup. The `IS_REACT_ACT_ENVIRONMENT` global is removed; RTL sets it automatically.

---

## Traceability

- Proposal element (Replace `container.querySelector*`) -> Requirement: MODIFIED AlignmentSelect/NavBar/CreatureStatBlock test suites use RTL
- Design decision 1 (semantic role queries) -> Requirement: All three MODIFIED requirements
- Design decision 2 (jest.mock placement) -> Requirement: MODIFIED NavBar test suite
- Design decision 3 (@jest-environment pragma) -> Requirement: All three MODIFIED requirements
- Requirement (AlignmentSelect) -> Task: Migrate AlignmentSelect.test.tsx
- Requirement (NavBar) -> Task: Migrate NavBar.test.tsx
- Requirement (CreatureStatBlock) -> Task: Migrate CreatureStatBlock.test.tsx

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Full unit suite passes after migration

- **Given** all three test files have been migrated to RTL
- **When** `npm run test:unit` is run
- **Then** all test suites pass with zero regressions compared to pre-migration baseline
