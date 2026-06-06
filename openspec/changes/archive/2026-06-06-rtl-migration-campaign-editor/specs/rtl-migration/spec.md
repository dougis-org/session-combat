## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED RTL render pattern

The system SHALL render `CampaignEditor` in tests using `render` from `@testing-library/react` via a local `renderEditor(overrides?)` helper, with no `createReactRoot`, `container`, or `root` variables.

#### Scenario: Render with defaults

- **Given** `BASE_CAMPAIGN` and stub callbacks
- **When** `renderEditor()` is called with no overrides
- **Then** the component is mounted with no `document.body` container manipulation required by the test

#### Scenario: Render with overrides

- **Given** a partial campaign object (e.g. `{ name: '' }`)
- **When** `renderEditor({ campaign: { ...BASE_CAMPAIGN, name: '' } })` is called
- **Then** the component renders with the overridden props

---

### Requirement: ADDED Accessible button queries

The system SHALL locate buttons using `screen.getByRole('button', { name: ... })`.

#### Scenario: Save Campaign button found by name

- **Given** the component is rendered with `canSave=true`
- **When** `screen.getByRole('button', { name: 'Save Campaign' })` is called
- **Then** the element is found and not disabled

#### Scenario: Save Campaign button is disabled when name is empty

- **Given** the component is rendered with `campaign.name = ''`
- **When** `screen.getByRole('button', { name: 'Save Campaign' })` is queried
- **Then** `expect(button).toBeDisabled()` passes

#### Scenario: Chapters accordion button matched by regex

- **Given** the component is rendered (button text is `📖 Chapters (N) ▼`)
- **When** `screen.getByRole('button', { name: /chapters/i })` is called
- **Then** the accordion toggle button is found

---

### Requirement: ADDED Label-based input queries

The system SHALL locate Campaign Name and Module/Adventure inputs using `screen.getByLabelText(...)`.

#### Scenario: Campaign Name input found by label

- **Given** `TextInputField` renders `<label htmlFor={id}>Campaign Name *</label>` and `<input id={id} />`
- **When** `screen.getByLabelText('Campaign Name *')` is called
- **Then** the correct input element is returned

#### Scenario: Module/Adventure input found by label

- **Given** `TextInputField` renders `<label htmlFor={id}>Module / Adventure</label>` and `<input id={id} />`
- **When** `screen.getByLabelText('Module / Adventure')` is called
- **Then** the correct input element is returned

---

### Requirement: ADDED testId-based queries for unlabelled controls

The system SHALL locate status select, notes textarea, chapter controls, and current-chapter select using `screen.getByTestId(...)` / `screen.getAllByTestId(...)`.

#### Scenario: Status select found by testId

- **Given** the component is rendered
- **When** `screen.getByTestId('status-select')` is called
- **Then** the `<select>` element is returned

#### Scenario: Notes textarea found by testId

- **Given** the component is rendered
- **When** `screen.getByTestId('notes-textarea')` is called
- **Then** the `<textarea>` element is returned

#### Scenario: Chapter title inputs found by testId (plural)

- **Given** the component is rendered with `chapters` having N items and the accordion is expanded
- **When** `screen.getAllByTestId('chapter-title-input')` is called
- **Then** an array of N input elements is returned

---

### Requirement: ADDED userEvent.setup() interaction pattern

The system SHALL drive all user interactions via a `userEvent.setup()` instance created per test.

#### Scenario: Button click via user.click

- **Given** a `user` instance from `userEvent.setup()`
- **When** `await user.click(screen.getByRole('button', { name: 'Save Campaign' }))` is called
- **Then** `onSave` is called once with the current campaign state

#### Scenario: Select change via user.selectOptions

- **Given** a `user` instance and the status select is in the DOM
- **When** `await user.selectOptions(screen.getByTestId('status-select'), 'completed')` is called
- **Then** the select reflects the new value and `onSave` includes `status: 'completed'` when Save is clicked

#### Scenario: Text input change via user.type

- **Given** a `user` instance and a chapter title input is in the DOM
- **When** `await user.clear(input); await user.type(input, 'New Arrival')` is called
- **Then** `expect(input).toHaveValue('New Arrival')`

---

### Requirement: ADDED openChapters helper

The system SHALL provide an `openChapters()` async helper that expands the chapters accordion only when it is currently collapsed.

#### Scenario: Chapters collapsed on empty campaign

- **Given** `BASE_CAMPAIGN` with `chapters: []` (accordion starts collapsed)
- **When** `await openChapters()` is called
- **Then** `screen.queryByText('+ Add Chapter')` returns a DOM element

#### Scenario: Chapters already open when campaign has chapters

- **Given** a campaign with existing chapters (accordion starts expanded due to `chaptersExpanded = true`)
- **When** `await openChapters()` is called
- **Then** the accordion is not clicked a second time (no double-toggle)

---

### Requirement: ADDED Chapter display assertion uses input values

The system SHALL assert chapter titles via `screen.getByDisplayValue(title)` rather than `container.textContent`.

#### Scenario: Chapter title visible in input

- **Given** a campaign with `chapters: [{ title: 'Arrival', ... }, ...]` (accordion auto-expanded)
- **When** `screen.getByDisplayValue('Arrival')` is called
- **Then** the chapter title input with value `'Arrival'` is found

---

## MODIFIED Requirements

### Requirement: MODIFIED CampaignEditor test setup/teardown

The system SHALL NOT use `beforeEach` / `afterEach` blocks for mounting or unmounting. RTL handles cleanup automatically via its own `afterEach(cleanup)`.

#### Scenario: No manual DOM teardown

- **Given** a test that renders `CampaignEditor`
- **When** the test completes
- **Then** RTL's automatic cleanup unmounts the component without explicit `unmountReactRoot` calls

---

## REMOVED Requirements

### Requirement: REMOVED createReactRoot / unmountReactRoot usage

Reason for removal: Replaced by RTL's `render` and automatic `cleanup`. The `@/tests/unit/helpers/reactRoot` import is no longer needed in this file.

### Requirement: REMOVED container / root module-level variables

Reason for removal: RTL exposes `screen` as a global query surface; no container reference is needed.

### Requirement: REMOVED findButton / getInput local helpers

Reason for removal: Replaced by `screen.getByRole`, `screen.getByLabelText`, and `screen.getByTestId`.

### Requirement: REMOVED raw act() / dispatchEvent interactions

Reason for removal: Replaced by `userEvent.setup()` instance methods (`click`, `selectOptions`, `type`, `clear`).

---

## Traceability

- Proposal: replace `findButton` → Requirement: ADDED Accessible button queries → Task: Migrate button interactions
- Proposal: replace `getInput` → Requirement: ADDED Label-based input queries → Task: Migrate input queries
- Proposal: use `userEvent.setup()` → Requirement: ADDED userEvent.setup() pattern → Task: Add user instance per test
- Proposal: keep `openChapters()` helper → Requirement: ADDED openChapters helper → Task: Write openChapters RTL helper
- Proposal: shift chapter display to `getByDisplayValue` → Requirement: ADDED Chapter display assertion → Task: Migrate chapters display test
- Design Decision 1 (query strategy) → Requirement: ADDED Accessible button/label/testId queries
- Design Decision 2 (userEvent.setup scoping) → Requirement: ADDED userEvent.setup() pattern
- Design Decision 3 (local helpers) → Requirements: ADDED renderEditor + openChapters helpers
- Design Decision 4 (getByDisplayValue) → Requirement: ADDED Chapter display assertion
- Design Decision 5 (remove boilerplate) → Requirement: MODIFIED setup/teardown

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Test suite passes consistently

- **Given** the migrated test file
- **When** `npm test -- --testPathPattern=CampaignEditor` is run three times in succession
- **Then** all 25 test cases pass each time with no flakiness

### Requirement: No legacy imports

#### Scenario: reactRoot import absent

- **Given** the migrated file
- **When** `grep "reactRoot" tests/unit/components/CampaignEditor.test.tsx` is run
- **Then** the command returns no output (exit code 1)
