## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-01-chapter-drag-reorder/design.md) document, not a replacement.

### Requirement: ADDED Mouse/pointer drag reorders chapters

The system SHALL reorder chapters when a user drags a chapter row's handle to a new position using a pointer (mouse or stylus).

#### Scenario: Drag chapter to a later position

- **Given** a campaign with chapters ["Arrival", "The Inn", "The Dungeon"] in the editor
- **When** the user drags the handle of "Arrival" (index 0) onto "The Dungeon" (index 2)
- **Then** the chapter list displays ["The Inn", "The Dungeon", "Arrival"] and the `order` values are 0, 1, 2 respectively

#### Scenario: Drag chapter to an earlier position

- **Given** a campaign with chapters ["Arrival", "The Inn", "The Dungeon"] in the editor
- **When** the user drags the handle of "The Dungeon" (index 2) onto "Arrival" (index 0)
- **Then** the chapter list displays ["The Dungeon", "Arrival", "The Inn"] and the `order` values are 0, 1, 2 respectively

#### Scenario: Drag cancelled with Escape

- **Given** a user has started dragging a chapter row
- **When** the user presses Escape before releasing
- **Then** the chapter list returns to its original order (no state change)

#### Scenario: Drag to same position is a no-op

- **Given** a user picks up a chapter row
- **When** the user drops it on its original position
- **Then** the chapter list order is unchanged

### Requirement: ADDED Touch drag reorders chapters (tablet)

The system SHALL reorder chapters when a user drag-and-drops a chapter row's handle using a touch gesture on a tablet.

#### Scenario: Touch drag reorder

- **Given** a campaign with multiple chapters on a touch-enabled device
- **When** the user touch-drags a chapter handle to a new row position
- **Then** the chapter list reflects the new order after the touch gesture completes

## Traceability

- Proposal element "Drag handle reorders chapters" -> Requirements: ADDED Mouse/pointer drag reorders chapters, ADDED Touch drag reorders chapters (tablet)
- Design decision 1 (@dnd-kit) -> Requirements: both drag requirements
- Design decision 2 (PointerSensor + TouchSensor) -> Requirements: both drag requirements
- Design decision 4 (arrayMove + renormalization) -> Requirements: both drag requirements
- Requirements -> Task: "Implement DndContext + SortableContext + onDragEnd in CampaignEditor"

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Animation does not cause layout thrash

- **Given** a chapter list with up to 20 chapters
- **When** the user drags a chapter row
- **Then** sibling rows animate their position using only CSS `transform` (no top/left/margin changes), keeping repaints GPU-composited

### Requirement: Reliability

#### Scenario: Cancel restores order

See functional scenario: "Drag cancelled with Escape"
