## MODIFIED Requirements

This document details changes to `tests/unit/components/SessionsPage.test.tsx`.

### Requirement: MODIFIED SessionsPage tests use RTL render and screen queries

The test file SHALL use `render` from `@testing-library/react` and `screen` queries exclusively. No `createRoot`, `act`, or `IS_REACT_ACT_ENVIRONMENT` shall remain.

#### Scenario: Component renders without old boilerplate

- **Given** `SessionsPage.test.tsx` has been migrated
- **When** `npm run test:unit` is run
- **Then** all tests in the file pass with zero `act()` warnings in output

#### Scenario: Button queries use role

- **Given** the migrated file
- **When** a test needs to find the "New Session" button
- **Then** it uses `screen.getByRole('button', { name: /new session/i })` — not `querySelectorAll('button').find(textContent)`

#### Scenario: Text assertions use screen matchers

- **Given** the migrated file
- **When** a test asserts that session data appears in the rendered output (e.g., "Into the Mines", "#3", "Level 5")
- **Then** it uses `expect(screen.getByText('Into the Mines')).toBeInTheDocument()` — not `container.textContent.toContain(...)`

#### Scenario: Button click uses userEvent

- **Given** the migrated file
- **When** a test simulates clicking "New Session"
- **Then** it uses `await userEvent.click(screen.getByRole('button', { name: /new session/i }))` — not `act(() => { btn.click() })`

#### Scenario: Test count unchanged

- **Given** the migrated file
- **When** `npm run test:unit` is run
- **Then** the same number of test cases pass as before migration (verified by comparing `--verbose` output)

## REMOVED Requirements

### Requirement: REMOVED createRoot render pattern

Reason for removal: Replaced by RTL `render()` which handles root creation, act wrapping, and cleanup automatically.

### Requirement: REMOVED IS_REACT_ACT_ENVIRONMENT global mutation

Reason for removal: RTL sets this flag internally when rendering.

### Requirement: REMOVED @jest-environment jsdom docblock

Reason for removal: Will be set globally via jest config (see #264); redundant here.

## Traceability

- Proposal element (replace createRoot pattern) → Requirement: MODIFIED SessionsPage tests use RTL render
- Design decision 1 (migration order — SessionsPage first) → Requirement: all scenarios
- Design decision 2 (userEvent direct calls) → Scenario: Button click uses userEvent
- Requirement → Task: "Migrate SessionsPage.test.tsx to RTL"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No flaky async behavior

- **Given** the migrated SessionsPage tests
- **When** the test suite is run 3 times in succession
- **Then** all tests pass consistently with no intermittent failures
