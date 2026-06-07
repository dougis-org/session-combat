## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED EncountersPage unit test coverage

The system SHALL have unit tests for `EncountersContent` covering fetch-on-mount, list rendering, empty state, error handling, the Add button, and the delete flow.

Additionally, `EncountersContent` SHALL be a named export from `app/encounters/page.tsx` so it can be imported directly in tests.

#### Scenario: Renders encounter list after successful fetch

- **Given** `fetch('/api/encounters')` returns an array of encounters
- **When** `EncountersContent` mounts
- **Then** each encounter's name is visible in the DOM

#### Scenario: Shows empty state when no encounters exist

- **Given** `fetch('/api/encounters')` returns an empty array
- **When** `EncountersContent` mounts
- **Then** a message indicating no encounters are present is displayed (e.g. "No encounters yet")

#### Scenario: Renders "Add New Encounter" button

- **Given** `EncountersContent` has mounted and the fetch has resolved
- **When** the user views the page
- **Then** a button labeled "Add New Encounter" is present

#### Scenario: Handles fetch error gracefully

- **Given** `fetch('/api/encounters')` throws or returns a non-OK response
- **When** `EncountersContent` mounts
- **Then** an error message is displayed and the page does not crash

#### Scenario: Delete calls confirm, sends DELETE request, and refreshes list

- **Given** `window.confirm` is mocked to return `true` and a delete button is visible for an encounter
- **When** the user clicks the delete button
- **Then** `fetch` is called with the DELETE method for that encounter's URL and the list is re-fetched

#### Scenario: Delete is cancelled when user dismisses confirm dialog

- **Given** `window.confirm` is mocked to return `false`
- **When** the user clicks the delete button
- **Then** no DELETE request is made

## MODIFIED Requirements

### Requirement: MODIFIED EncountersContent export visibility

The `EncountersContent` function in `app/encounters/page.tsx` SHALL be a named export (adding the `export` keyword).

#### Scenario: Named import works in test

- **Given** `import { EncountersContent } from '@/app/encounters/page'` in a test file
- **When** the module is resolved
- **Then** `EncountersContent` is a renderable React component

## REMOVED Requirements

_(None.)_

## Traceability

- Proposal element (EncountersContent coverage + export) → Requirement: ADDED EncountersPage unit test coverage
- Design decision 1 (extraction strategy — export EncountersContent) → MODIFIED export visibility
- Design decision 2 (RTL pattern) → All scenarios
- Requirement → Task: `tests/unit/components/EncountersPage.test.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No real network calls

- **Given** the test suite runs in jest without network access
- **When** any `EncountersContent` test executes
- **Then** all `fetch` calls are intercepted by `global.fetch = jest.fn()`; `afterEach` restores the original
