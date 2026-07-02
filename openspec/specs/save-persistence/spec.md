## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-01-chapter-drag-reorder/design.md) document, not a replacement.

### Requirement: MODIFIED Chapter order persists after save

The system SHALL save chapters in the order produced by drag-and-drop reordering, with `order` values renormalized to 0-based contiguous integers.

#### Scenario: Drag reorder then save persists new order

- **Given** a campaign with chapters ["Arrival" (order:0), "The Inn" (order:1), "The Dungeon" (order:2)] that has been saved
- **When** the user drags "The Inn" to position 0, then clicks "Save Campaign"
- **Then** the database stores chapters as [{ title: "The Inn", order: 0 }, { title: "Arrival", order: 1 }, { title: "The Dungeon", order: 2 }]

#### Scenario: Reloading the editor shows persisted order

- **Given** chapters were drag-reordered and saved
- **When** the user navigates away and reopens the campaign editor
- **Then** the chapter list displays in the saved order (sorted by `order` ascending)

#### Scenario: Active chapter identity preserved after reorder

- **Given** "The Inn" is the active chapter (currentChapterId = inn-id)
- **When** the user reorders chapters so "The Inn" moves to a different index
- **Then** "The Inn" still shows the ACTIVE badge (identity tracked by id, not index)

## Traceability

- Proposal element "Saving persists new order" -> Requirement: MODIFIED Chapter order persists
- Design decision 4 (arrayMove + renormalization) -> Requirement: MODIFIED Chapter order persists
- Requirement -> Task: "Add Playwright E2E test for drag-reorder save persistence"

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Save after reorder does not duplicate or drop chapters

- **Given** a campaign with N chapters that have been drag-reordered
- **When** the user saves
- **Then** the saved campaign has exactly N chapters, each with a unique `order` value in [0, N-1]
