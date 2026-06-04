## MODIFIED Requirements

This document details changes to `tests/unit/components/PartiesPage.test.tsx`.

### Requirement: MODIFIED PartiesPage tests use RTL render and screen queries

The test file SHALL use `render` from `@testing-library/react` and `screen` queries exclusively. No `createRoot`, `act`, `setupUiTest`, or `IS_REACT_ACT_ENVIRONMENT` shall remain.

#### Scenario: Component renders without old boilerplate

- **Given** `PartiesPage.test.tsx` has been migrated
- **When** `npm run test:unit` is run
- **Then** all tests in the file pass with zero `act()` warnings in output

#### Scenario: Text content assertions use screen matchers

- **Given** the migrated file
- **When** a test asserts party member names appear (e.g., "Thorin", "Barliman", "Bill") or error states ("Unknown")
- **Then** it uses `expect(screen.getByText('Thorin')).toBeInTheDocument()` — not `ctx.container.textContent.toContain(...)`

#### Scenario: aria-label query migrated to RTL

- **Given** the migrated file
- **When** a test needs to find elements with `aria-label^="Member section:"`
- **Then** it uses `screen.getAllByLabelText(/member section/i)` (the elements are `<p>` tags with `aria-label`, no explicit `role`), selecting the same element set as the old `querySelectorAll` call

#### Scenario: Element count from aria-label query preserved

- **Given** the migrated aria-label query
- **When** the test runs with the same fixture data
- **Then** the returned element array has the same length as the old `querySelectorAll('[aria-label^="Member section:"]')` result

#### Scenario: Test count unchanged

- **Given** the migrated file
- **When** `npm run test:unit` is run
- **Then** the same number of test cases pass as before migration

## REMOVED Requirements

### Requirement: REMOVED setupUiTest / createReactRoot helper usage

Reason for removal: RTL `render()` handles DOM setup and cleanup; `setupUiTest` is not needed for RTL-based tests.

### Requirement: REMOVED IS_REACT_ACT_ENVIRONMENT global mutation

Reason for removal: Already set globally in `jest.setup.ts`; per-file mutation was redundant.

### Requirement: REMOVED @jest-environment jsdom docblock

Reason for removal: Will be set globally via jest config (see #264); redundant here.

## Traceability

- Proposal element (replace createRoot pattern) → Requirement: MODIFIED PartiesPage tests use RTL render
- Design decision 4 (aria-label query migration) → Scenario: aria-label query migrated to RTL
- Design decision 4 → Scenario: Element count from aria-label query preserved
- Design decision 2 (userEvent direct calls) → applies if PartiesPage has click interactions
- Requirement → Task: "Migrate PartiesPage.test.tsx to RTL"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: aria-label query selects correct elements

- **Given** the migrated PartiesPage tests
- **When** the party fixture contains N members
- **Then** the `getAllBy` query returns exactly N elements matching the aria-label pattern
