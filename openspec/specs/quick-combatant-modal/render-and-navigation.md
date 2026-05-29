## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Unit tests for modal render and navigation

The system SHALL have automated tests verifying that `QuickCombatantModal` renders correctly and responds to navigation interactions.

#### Scenario: Modal renders with monsters tab active by default

- **Given** the component is rendered with monster templates and no active tab override
- **When** the component mounts
- **Then** the heading "Add Combatant" is visible, the Monsters tab has `aria-selected="true"`, and the Party Members and Create New tabs have `aria-selected="false"`

#### Scenario: Close button calls onClose

- **Given** the component is rendered
- **When** the user clicks the × close button
- **Then** the `onClose` callback is called exactly once

#### Scenario: Backdrop click calls onClose

- **Given** the component is rendered
- **When** the user clicks the backdrop (the outermost dialog overlay)
- **Then** the `onClose` callback is called exactly once

#### Scenario: Inner modal click does not call onClose

- **Given** the component is rendered
- **When** the user clicks inside the white modal card area
- **Then** the `onClose` callback is NOT called

#### Scenario: Switching to Party Members tab

- **Given** the component is rendered with the Monsters tab active
- **When** the user clicks the "Party Members" tab button
- **Then** the Party Members tab has `aria-selected="true"` and the Monsters tab has `aria-selected="false"`

#### Scenario: Switching to Create New tab

- **Given** the component is rendered with the Monsters tab active
- **When** the user clicks the "Create New" tab button
- **Then** the Create New tab has `aria-selected="true"` and the custom form is visible

#### Scenario: Tab switch resets search and filter

- **Given** the user has typed "Goblin" in the search box and set creator filter to "My"
- **When** the user switches to the Party Members tab
- **Then** the search query is cleared and the creator filter resets to "All"

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (close/backdrop behavior) -> Requirement: ADDED Unit tests for modal render and navigation
- Design decision: Decision 6 (aria-label query strategy) -> Scenario: Close button calls onClose
- Requirement -> Task(s): tasks.md §1 "Test: render and navigation"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Tests pass consistently

- **Given** the test suite runs in jsdom via Jest
- **When** `npm run test:unit -- tests/unit/components/QuickCombatantModal.test.tsx` is executed three times in succession
- **Then** all tests pass each time with no intermittent failures
