## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (first tab stop) -> Requirement: Optional non-tabbable close button
- Design Decision 2 -> this requirement
- Requirement -> Task(s): tasks.md Execution section 1

## Non-Functional Acceptance Criteria

### Requirement: Reliability

- See functional scenario: "Default unchanged" — other `Modal` consumers are unaffected.

## Addendum (PR review)

- `Modal` accepts opt-in `trapFocus?: boolean` (default `false`): focuses the first tabbable on open, wraps Tab/Shift+Tab, restores focus to the opener on close. `ConfirmDialog` enables it (initial focus now comes from the trap rather than `autoFocus`, so the opener is captured correctly).
- With stacked modals, Escape SHALL close only the topmost.
- End Combat uses `variant: 'danger'` and reads `endCombat` through a ref so confirming uses the latest function.
