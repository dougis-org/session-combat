## MODIFIED Requirements

This document details changes to `tests/unit/components/CampaignsPage.test.tsx`.

### Requirement: MODIFIED CampaignsPage tests use RTL render and screen queries

The test file SHALL use `render` from `@testing-library/react` and `screen` queries exclusively. No `createRoot`, `act`, or `IS_REACT_ACT_ENVIRONMENT` shall remain.

#### Scenario: Component renders without old boilerplate

- **Given** `CampaignsPage.test.tsx` has been migrated
- **When** `npm run test:unit` is run
- **Then** all tests pass with zero `act()` warnings in output

#### Scenario: Text content assertions use screen matchers

- **Given** the migrated file
- **When** a test asserts page text like "Campaign Catalog", "Lost Mine of Phandelver", "4 chapters", "No campaign templates available yet", "Server error"
- **Then** it uses `expect(screen.getByText(...)).toBeInTheDocument()` — not `container.textContent.toContain(...)`

#### Scenario: Negative text assertions use queryBy

- **Given** the migrated file
- **When** a test asserts text does NOT appear (e.g., `not.toContain('📖 Current Chapter:')`)
- **Then** it uses `expect(screen.queryByText(/current chapter/i)).not.toBeInTheDocument()`

#### Scenario: Button queries use role

- **Given** the migrated file
- **When** a test finds the "Copy" button or checks for its presence
- **Then** it uses `screen.getByRole('button', { name: /copy/i })` — not `Array.from(querySelectorAll('button')).find(b => b.textContent.trim() === 'Copy')`

#### Scenario: Heading order verified with RTL

- **Given** the migrated file
- **When** a test checks the relative DOM order of headings ("Campaigns" before "Campaign Catalog")
- **Then** it uses RTL heading queries or `getAllByRole('heading')` to verify order — not raw DOM `querySelectorAll('h1, h2')` index comparison

#### Scenario: Async fetch tests use findBy

- **Given** the migrated file and a mocked fetch that resolves asynchronously
- **When** a test renders `<CampaignsPage />` and waits for fetched data to appear
- **Then** it uses `await screen.findByText('My Campaign')` rather than nested `act()` calls

#### Scenario: Loading state test

- **Given** the migrated file and a pending fetch (unresolved promise)
- **When** the component is rendered and the test checks for a loading/disabled "Copying..." button
- **Then** it uses `await screen.findByRole('button', { name: /copying/i })` to wait for the loading state

#### Scenario: Test count unchanged

- **Given** the migrated file
- **When** `npm run test:unit` is run
- **Then** the same number of test cases pass as before migration

## REMOVED Requirements

### Requirement: REMOVED createRoot render pattern

Reason for removal: Replaced by RTL `render()`.

### Requirement: REMOVED IS_REACT_ACT_ENVIRONMENT global mutation

Reason for removal: RTL sets this flag internally.

### Requirement: REMOVED @jest-environment jsdom docblock

Reason for removal: Will be set globally (see #264); redundant here.

## Traceability

- Proposal element (async fetch tests need findBy) → Scenario: Async fetch tests use findBy; Scenario: Loading state test
- Design decision 3 (findBy for async) → Scenario: Async fetch tests use findBy
- Design decision 1 (CampaignsPage migrated last) → all scenarios
- Design decision 2 (userEvent direct calls) → Scenario: Button queries use role (+ click)
- Requirement → Task: "Migrate CampaignsPage.test.tsx to RTL"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Async tests are not flaky

- **Given** the migrated CampaignsPage tests with `Promise.resolve()` fetch mocks
- **When** the test suite is run 3 times in succession
- **Then** all async tests pass consistently; no timeout errors occur within the default 1000ms `findBy` window
