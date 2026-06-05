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
