## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Keyboard sorting via drag handle

The system SHALL allow keyboard users to reorder chapters by focusing the drag handle and using Space + arrow keys.

#### Scenario: Keyboard reorder moves chapter up

- **Given** a campaign with chapters ["Arrival", "The Inn", "The Dungeon"] and keyboard focus on the drag handle of "The Inn" (index 1)
- **When** the user presses Space to activate sorting, then presses ArrowUp, then presses Space to drop
- **Then** the chapter list displays ["The Inn", "Arrival", "The Dungeon"] and the `order` values are 0, 1, 2 respectively

#### Scenario: Keyboard reorder moves chapter down

- **Given** focus on the drag handle of "Arrival" (index 0) with chapters in original order
- **When** the user presses Space, then ArrowDown, then Space
- **Then** "Arrival" moves to index 1 and the list reflects the new order

#### Scenario: Keyboard sort cancelled with Escape

- **Given** a user has activated keyboard sorting (Space pressed, item lifted)
- **When** the user presses Escape
- **Then** the chapter returns to its original position (no state change)

## REMOVED Requirements

### Requirement: REMOVED ▲/▼ button keyboard fallback

Reason for removal: The KeyboardSensor on the drag handle replaces the previous keyboard affordance (Tab to ▲/▼ button, Enter/Space to activate). There is no hidden fallback button; the drag handle itself is keyboard-operable.

## Traceability

- Proposal element "Keyboard accessibility" -> Requirement: ADDED Keyboard sorting via drag handle
- Design decision 2 (KeyboardSensor + sortableKeyboardCoordinates) -> Requirement: ADDED Keyboard sorting via drag handle
- Requirement -> Task: "Register KeyboardSensor in DndContext"

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Handle focus not clipped by container

- **Given** the chapter list container has CSS `overflow` properties
- **When** a keyboard user Tabs to a drag handle
- **Then** the focus ring is fully visible (not clipped), confirming the container allows visible focus
