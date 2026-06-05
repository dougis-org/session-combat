## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED TextInputField generates accessible id from label

The system SHALL derive a stable `id` attribute for `TextInputField`'s `<input>` element from the `label` prop when no explicit `id` is supplied, by lowercasing, replacing non-alphanumeric character runs with `-`, and stripping leading/trailing hyphens.

#### Scenario: Auto-generated id links label to input

- **Given** a `TextInputField` rendered with `label="Campaign Name *"` and no `id` prop
- **When** the DOM is inspected
- **Then** the `<input>` has `id="campaign-name"` and the associated `<label>` has `for="campaign-name"`

#### Scenario: Explicit id overrides auto-generation

- **Given** a `TextInputField` rendered with `label="Campaign Name *"` and `id="my-custom-id"`
- **When** the DOM is inspected
- **Then** the `<input>` has `id="my-custom-id"` and the `<label>` has `for="my-custom-id"`

#### Scenario: RTL resolves input by accessible name

- **Given** `CampaignEditor` rendered with `campaign.name = "Test Campaign"`
- **When** `screen.getByRole('textbox', { name: /campaign name/i })` is called
- **Then** it returns the name input without throwing

---

### Requirement: ADDED Chapter title inputs have accessible names

The system SHALL render each chapter title `<input>` with `aria-label="Chapter N title"` where N is the 1-based position of the chapter in the list.

#### Scenario: Single chapter input is named

- **Given** `CampaignEditor` rendered with one chapter and the chapters accordion open
- **When** `screen.getByRole('textbox', { name: /chapter 1 title/i })` is called
- **Then** it returns the chapter title input without throwing

#### Scenario: Multiple chapter inputs are individually named

- **Given** `CampaignEditor` rendered with three chapters and the accordion open
- **When** `screen.getAllByRole('textbox', { name: /chapter \d+ title/i })` is called
- **Then** it returns an array of exactly 3 elements

---

### Requirement: ADDED Chapter remove button has accessible name

The system SHALL render each chapter's remove button with `aria-label="Remove <title>"` when the chapter has a non-empty title, or `aria-label="Remove chapter N"` when the title is empty.

#### Scenario: Remove button named by chapter title

- **Given** `CampaignEditor` rendered with a chapter titled "Arrival" and the accordion open
- **When** `screen.getByRole('button', { name: /remove arrival/i })` is called
- **Then** it returns the remove button without throwing

#### Scenario: Remove button named by ordinal when title is empty

- **Given** `CampaignEditor` rendered with an untitled (just-added) chapter and the accordion open
- **When** `screen.getByRole('button', { name: /remove chapter 1/i })` is called
- **Then** it returns the remove button without throwing

---

## MODIFIED Requirements

### Requirement: MODIFIED CampaignEditor unit tests use React Testing Library exclusively

The test file `tests/unit/components/CampaignEditor.test.tsx` SHALL use `@testing-library/react` and `@testing-library/user-event` for all rendering, querying, and interaction — with no remaining usage of `createReactRoot`, `unmountReactRoot`, `act`, `IS_REACT_ACT_ENVIRONMENT`, or manual DOM mutation.

#### Scenario: Legacy boilerplate is absent

- **Given** the migrated `CampaignEditor.test.tsx`
- **When** the file is grepped for `createReactRoot|unmountReactRoot|IS_REACT_ACT_ENVIRONMENT|@jest-environment jsdom`
- **Then** zero matches are found

#### Scenario: No manual DOM mutations remain

- **Given** the migrated `CampaignEditor.test.tsx`
- **When** the file is grepped for `\.value\s*=|dispatchEvent|\.click()`
- **Then** zero matches are found

#### Scenario: All 26 existing tests pass

- **Given** the migrated test file and updated component files
- **When** `jest --testPathPattern CampaignEditor` is run
- **Then** all 26 test cases report `pass` and the suite exits 0

#### Scenario: Tests are isolated (no shared mutable state)

- **Given** the migrated test file
- **When** tests are run in any order (including `--randomize`)
- **Then** pass/fail results are identical regardless of order

---

## REMOVED Requirements

### Requirement: REMOVED Direct DOM container access in CampaignEditor tests

The `container` variable and all `container.querySelector*`, `container.textContent`, `Array.from(container.querySelectorAll(…))` patterns are removed from `CampaignEditor.test.tsx`.

Reason for removal: Replaced by `screen.getBy*` / `screen.queryBy*` queries, which are more resilient and semantically correct.

---

## Traceability

- Proposal element "TextInputField generates id from label" → Requirement "TextInputField generates accessible id from label" → Task: Update `lib/components/ui.tsx`
- Proposal element "Chapter title inputs gain accessible name" → Requirement "Chapter title inputs have accessible names" → Task: Update `app/campaigns/CampaignEditor.tsx`
- Proposal element "Remove button gains aria-label" → Requirement "Chapter remove button has accessible name" → Task: Update `app/campaigns/CampaignEditor.tsx`
- Proposal element "All act()/dispatchEvent hacks removed" → Requirement "CampaignEditor tests use RTL exclusively" → Task: Rewrite `tests/unit/components/CampaignEditor.test.tsx`
- Design Decision 1 → Requirement "TextInputField generates accessible id"
- Design Decision 2 → Requirements "Chapter title inputs" + "Chapter remove button"
- Design Decision 3 → Requirement "CampaignEditor tests use RTL exclusively"
- Design Decision 4 → Requirement "CampaignEditor tests use RTL exclusively" (openChapters helper)

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Test isolation

- **Given** the migrated test suite
- **When** tests run in random order
- **Then** all 26 pass regardless of order (RTL automatic cleanup between tests)

### Requirement: Operability — TypeScript

#### Scenario: Clean compilation

- **Given** the updated source files (`ui.tsx`, `CampaignEditor.tsx`, `CampaignEditor.test.tsx`)
- **When** `tsc --noEmit` is run
- **Then** zero TypeScript errors are reported

---

## ADDED Requirements — 4-file RTL migration (migrate-createreactroot-to-rtl)

### Requirement: Component test infrastructure — 4 files use RTL

The system SHALL render all 4 migrated test components using RTL `render` from `@testing-library/react` with no manual container setup.

#### Scenario: CombatStatsRow, CharacterMiniSummary, LairForm, LairActionsSlot render with RTL

- **Given** any of `CombatStatsRow.test.tsx`, `CharacterMiniSummary.test.tsx`, `LairForm.test.tsx`, `LairActionsSlot.test.tsx`
- **When** the test suite runs
- **Then** RTL `render(...)` is called with no `createReactRoot`, no `act` wrapper, and no manual `container`/`root` lifecycle

---

### Requirement: Component test assertions use semantic RTL queries

The system SHALL query rendered output using `screen.getByRole`, `screen.getByText`, `screen.getByTestId`, `toHaveTextContent`, or equivalent RTL screen queries — not raw `container.textContent`, `container.querySelector`, or `container.querySelectorAll`.

#### Scenario: Button found by role

- **Given** `LairForm.test.tsx` migrated
- **When** the test queries for the "Add Lair" button
- **Then** it uses `screen.getByRole('button', { name: /Add Lair/i })`

#### Scenario: data-testid elements found via `getByTestId`

- **Given** `LairActionsSlot.test.tsx` migrated
- **When** a test queries an element by `data-testid`
- **Then** it uses `screen.getByTestId('...')`

---

### Requirement: Click interactions use `userEvent.setup()` per test

The system SHALL simulate user interactions using `userEvent.setup()` instantiated per test (before render), consistent with project convention.

#### Scenario: Click interaction in LairForm and LairActionsSlot

- **Given** any migrated test that simulates a click
- **When** the test runs
- **Then** `const user = userEvent.setup()` is called before `render`, and `await user.click(el)` performs the interaction

---

### Requirement: No `createReactRoot` imports in the 4 migrated files

The system SHALL have zero imports from `@/tests/unit/helpers/reactRoot` in the 4 migrated test files.

#### Scenario: Import removed post-migration

- **Given** any of the 4 migrated test files
- **When** `grep "reactRoot" tests/unit/LairForm.test.tsx tests/unit/CharacterMiniSummary.test.tsx tests/unit/LairActionsSlot.test.tsx tests/unit/CombatStatsRow.test.tsx` is run
- **Then** the command returns no matches

---

### Requirement: REMOVED Manual DOM container lifecycle (4 files)

Reason for removal: `createReactRoot` setup (`let container`, `let root`, `beforeEach`, `afterEach` with `unmountReactRoot`) is replaced by RTL's automatic render and cleanup in the 4 migrated files.
