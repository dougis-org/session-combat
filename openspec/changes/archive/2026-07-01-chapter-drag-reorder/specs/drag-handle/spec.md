## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Drag handle on each chapter row

The system SHALL render a visible drag handle (⠿ grip icon) as the leftmost element of each chapter row in the campaign editor.

#### Scenario: Handle visible for each chapter

- **Given** a campaign with one or more chapters in the editor
- **When** the chapters accordion is expanded
- **Then** each chapter row has a drag handle element with `data-testid="drag-handle-{index}"` visible on its left side

#### Scenario: Handle disabled during save

- **Given** the campaign editor is saving
- **When** the save operation is in progress
- **Then** all drag handles are non-interactive (pointer-events-none, non-focusable via `tabindex="-1"`, or `aria-disabled`) so dragging cannot be initiated by pointer or keyboard input

## REMOVED Requirements

### Requirement: REMOVED ▲/▼ move buttons

Reason for removal: Replaced by drag handle. The ▲ (move up) and ▼ (move down) buttons are removed from every chapter row. The `data-testid="move-up-{index}"` and `data-testid="move-down-{index}"` elements no longer exist in the DOM.

## Traceability

- Proposal element "Replace ▲/▼ with drag handle" -> Requirement: ADDED Drag handle
- Design decision 3 (inline SortableChapterRow) -> Requirement: ADDED Drag handle
- Requirement -> Task: "Add drag handle and remove ▲/▼ buttons from CampaignEditor"

## Non-Functional Acceptance Criteria

### Requirement: Accessibility

#### Scenario: Handle has accessible role and label

- **Given** a chapter row with a drag handle
- **When** a screen reader focuses the handle
- **Then** the handle announces as a sortable/draggable control (role and aria-roledescription provided by @dnd-kit `{...attributes}`)
