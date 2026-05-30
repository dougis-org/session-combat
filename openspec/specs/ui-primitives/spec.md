# Capability: UI Primitives Test Migration

Covers `tests/unit/components/ui.test.tsx` — migration to RTL for `ErrorBanner`, `ValidationError`, `LoadingState`, `FormField`, `EditorShell`, `textInputClass`, and `TextInputField`.

## MODIFIED Requirements

### Requirement: MODIFIED ui.test.tsx uses RTL APIs exclusively

The system SHALL render and interact with UI primitives using `@testing-library/react` and `@testing-library/user-event`, with no `createRoot`, `Root`, `act`, `IS_REACT_ACT_ENVIRONMENT`, or `createReactRoot`/`unmountReactRoot` imports.

#### Scenario: ErrorBanner renders nothing when message is null

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `ErrorBanner` is rendered with `message={null}`
- **Then** `screen.queryByRole('alert')` returns null / the component renders nothing

#### Scenario: ErrorBanner renders message text when provided

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `ErrorBanner` is rendered with `message="Something went wrong"`
- **Then** `screen.getByText('Something went wrong')` resolves and `.toBeInTheDocument()`

#### Scenario: ValidationError renders nothing when message is null

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `ValidationError` is rendered with `message={null}`
- **Then** no content is present in the document

#### Scenario: ValidationError renders message text when provided

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `ValidationError` is rendered with `message="Name is required"`
- **Then** `screen.getByText('Name is required')` is in the document

#### Scenario: LoadingState renders label text

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `LoadingState` is rendered with `label="Loading data..."`
- **Then** `screen.getByText('Loading data...')` is in the document

#### Scenario: FormField renders label and children

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `FormField` is rendered with `label="My Field"` and a child input
- **Then** `screen.getByText('My Field')` is present and the child is rendered

#### Scenario: FormField wires htmlFor when provided

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `FormField` is rendered with `label="Email"` and `htmlFor="email-input"`
- **Then** `screen.getByLabelText('Email')` resolves to the associated input

#### Scenario: EditorShell renders title as heading

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `EditorShell` is rendered with `title="Test Editor"`
- **Then** `screen.getByRole('heading', { name: 'Test Editor' })` is in the document

#### Scenario: EditorShell save button shows saveLabel or Saving...

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `EditorShell` is rendered with `saving={false}` and `saveLabel="Save"`
- **Then** `screen.getByRole('button', { name: /save/i })` is present and enabled
- **When** `EditorShell` is rendered with `saving={true}`
- **Then** the save button shows "Saving..." and is disabled

#### Scenario: EditorShell save and cancel buttons fire callbacks

- **Given** `ui.test.tsx` is migrated to RTL with a `userEvent.setup()` instance
- **When** the user clicks the save button
- **Then** `onSave` has been called once
- **When** the user clicks the cancel button
- **Then** `onCancel` has been called once

#### Scenario: EditorShell disables cancel when saving

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `EditorShell` is rendered with `saving={true}`
- **Then** `screen.getByRole('button', { name: /cancel/i })` is disabled

#### Scenario: EditorShell shows validation error

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `EditorShell` is rendered with `validationError="Fix errors"`
- **Then** `screen.getByText('Fix errors')` is in the document

#### Scenario: textInputClass returns the correct CSS string

- **Given** `textInputClass` is a pure function
- **When** called with no arguments
- **Then** returns `'w-full bg-gray-700 rounded px-3 py-2 text-white'` (unchanged — this test requires no RTL)

#### Scenario: TextInputField renders label and input value

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `TextInputField` is rendered with `label="Username"` and `value="alice"`
- **Then** `screen.getByLabelText('Username')` resolves and has value `"alice"`

#### Scenario: TextInputField calls onChange on user input

- **Given** `ui.test.tsx` is migrated to RTL with `userEvent.setup()`
- **When** the user types into the TextInputField
- **Then** the `onChange` callback is called

#### Scenario: TextInputField respects disabled and placeholder props

- **Given** `ui.test.tsx` is migrated to RTL
- **When** `disabled={true}` is passed
- **Then** `screen.getByLabelText(...)` is disabled
- **When** `placeholder="Enter username"` is passed
- **Then** the input has the correct placeholder

## REMOVED Requirements

### Requirement: REMOVED legacy `createReactRoot` / `unmountReactRoot` usage in ui.test.tsx

Reason for removal: RTL handles DOM cleanup automatically; the helper is no longer needed for this file.

## Traceability

- Proposal: "Migrate `ui.test.tsx` to RTL" → Requirement: MODIFIED ui.test.tsx uses RTL APIs exclusively
- Design decision 1 (migration order) → This spec is first in implementation sequence
- Design decision 4 (query strategy: `getByLabelText`, `getByRole`, `getByText`) → All scenarios above
- Requirement → Task: "Migrate ui.test.tsx"

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No banned legacy imports remain

- **Given** `ui.test.tsx` has been migrated
- **When** `grep -E "createRoot|IS_REACT_ACT_ENVIRONMENT|reactRoot" tests/unit/components/ui.test.tsx` is run
- **Then** the output is empty (exit code 1 or no matches)
