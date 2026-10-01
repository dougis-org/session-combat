## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Initiative entry controls are never visually clipped

The system SHALL render the `InitiativeEntry` inputs (dice roll, total, flat bonus) so that their full border and focus indicator are visible on every side while focused, including when the content sits inside the modal's scrollable region.

#### Scenario: Focused entry input shows its full border

- **Given** the initiative modal is open in "Enter Dice Roll" or "Enter Total" mode
- **When** the DM focuses the entry input
- **Then** the scroll container has padding on all four sides (`p-1`), so the input's border/focus ring is not clipped at the bottom, top or left.

#### Scenario: Tall content still scrolls

- **Given** the modal content is taller than 70% of the viewport height
- **When** the modal renders
- **Then** the scroll container still has `max-h-[70vh]` and `overflow-y-auto`.

### Requirement: ADDED Entry row spans the available width

The system SHALL render the dice-roll and total entry rows at the full width of the controls column, with the input growing to fill the space left of the "Set" button, while keeping the row's horizontal (`flex` row) direction.

#### Scenario: Dice mode fills the width

- **Given** the modal is open in "Enter Dice Roll" mode
- **When** the modal renders
- **Then** the entry row has `w-full min-w-0`, the input has `min-w-0 flex-1`, and the row is not `flex-col`.

#### Scenario: Total mode fills the width

- **Given** the modal is open in "Enter Total" mode
- **When** the modal renders
- **Then** the same width classes apply as in dice mode.

### Requirement: ADDED Modal is re-clamped after entry mode changes

The system SHALL re-measure and re-clamp the initiative modal to the viewport when the entry mode changes, so content added by the new mode never leaves the modal outside the viewport margin.

#### Scenario: Switching to a taller mode near the viewport bottom

- **Given** the modal is open in "Roll d20" mode, positioned near the bottom of the viewport
- **When** the DM switches to "Enter Dice Roll" and the modal grows taller
- **Then** the modal's top is moved up so its bottom edge is at least 16px inside the viewport.

#### Scenario: Re-measure with an unmounted modal

- **Given** the modal has been closed
- **When** a re-measure is requested
- **Then** nothing happens and no error is thrown.

## MODIFIED Requirements

None. The existing "Pinned Initiative Modal Overlay" requirement is unchanged; the re-clamp on mode change is added as a separate requirement above.

## REMOVED Requirements

None.

## Traceability

- Proposal element (focus ring clipped) -> Requirement: Initiative entry controls are never visually clipped
- Proposal element (blank space) -> Requirement: Entry row spans the available width
- Proposal element (stale clamp) -> Requirement: Modal is re-clamped after entry mode changes
- Design Decision 1 -> Never visually clipped; Decision 2 -> Entry row spans width; Decision 3 -> Re-clamped after mode change
- Requirement -> Task(s): see `tasks.md` Execution items 1–4

## Non-Functional Acceptance Criteria

### Accessibility

- See functional scenario: "Focused entry input shows its full border" (keyboard focus indicator remains fully visible).

### Reliability

- See functional scenario: "Re-measure with an unmounted modal" (no errors when the modal is absent).
