## ADDED Requirements

This document details *changes* to requirements and is additive to the base design document ([design.md](../../changes/archive/2026-05-28-standalone-components-coverage/design.md)), not a replacement.

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

### Requirement: ADDED Optional non-tabbable close button

The system SHALL accept `closeButtonTabbable?: boolean` (default `true`) on `Modal`. When `false`, the header close button SHALL have `tabindex="-1"` while remaining clickable and still calling `onClose`.

#### Scenario: Default unchanged

- **Given** a `Modal` without the prop
- **When** it renders
- **Then** the close button has no `tabindex="-1"`

#### Scenario: Opt-out

- **Given** `closeButtonTabbable={false}`
- **When** it renders and the user clicks the close button
- **Then** it has `tabindex="-1"` and `onClose` is called once

### Requirement: ADDED Opt-in focus trap

The system SHALL accept `trapFocus?: boolean` (default `false`) on `Modal`. When `true`, it SHALL focus the first tabbable element on open, wrap Tab/Shift+Tab inside the dialog, and restore focus to the previously focused element on close.

#### Scenario: Trap and restore

- **Given** a `Modal` with `trapFocus` opened from a button
- **When** the user tabs past the last control, then closes the modal
- **Then** focus wraps to the first control and returns to the opener on close

### Requirement: ADDED Escape closes only the topmost modal

With several modals open, the Escape key SHALL call `onClose` only for the topmost.

#### Scenario: Stacked modals

- **Given** two open `Modal`s
- **When** the user presses Escape
- **Then** only the later-opened modal's `onClose` is called

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
- **When** `npm run test:unit` runs
- **Then** all `Modal` tests pass
