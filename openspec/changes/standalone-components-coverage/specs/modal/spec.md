## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Modal renders children when open

The system SHALL render its children in the DOM when `isOpen` is true.

#### Scenario: Children rendered when open

- **Given** `Modal` receives `isOpen: true` and a child element with text "Hello Modal"
- **When** the component renders
- **Then** "Hello Modal" is present in the DOM

### Requirement: ADDED Modal renders title when provided

The system SHALL display the title string when a `title` prop is provided.

#### Scenario: Title visible when provided

- **Given** `Modal` receives `isOpen: true` and `title: "Confirm Action"`
- **When** the component renders
- **Then** "Confirm Action" is visible in the DOM

#### Scenario: No title element when title prop is absent

- **Given** `Modal` receives `isOpen: true` and no `title` prop
- **When** the component renders
- **Then** no heading matching a generic title placeholder is present

### Requirement: ADDED Close button calls onClose

The system SHALL call the `onClose` callback when the close button is clicked.

#### Scenario: Close button fires onClose

- **Given** `Modal` renders with `isOpen: true` and an `onClose` mock
- **When** the user clicks the close button
- **Then** `onClose` is called exactly once

### Requirement: ADDED Modal hides content when isOpen is false

The system SHALL not render its content in the DOM when `isOpen` is false.

#### Scenario: Content absent when closed

- **Given** `Modal` receives `isOpen: false` and a child element with text "Secret Content"
- **When** the component renders
- **Then** "Secret Content" is not present in the DOM

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (Modal thin wrapper, 4 tests) → Requirements above
- Design decision 7 (children, title, close, isOpen:false) → all scenarios
- Design decision 3 (`userEvent.setup()`) → close button scenario
- Requirements → Task T5 (Modal tests)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass in jsdom CI environment

- **Given** the jsdom test environment
- **When** `npm test` runs
- **Then** all `Modal` tests pass
