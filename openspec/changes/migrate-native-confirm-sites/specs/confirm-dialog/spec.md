## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Destructive actions use ConfirmDialog

The system SHALL gate each of the following actions behind a `ConfirmDialog` (via `useConfirmDialog`, `variant: 'danger'`) instead of a native `confirm()`, and SHALL perform the action only when the dialog is confirmed: delete character (list and detail pages), delete monster template, delete campaign, remove campaign member, unlink campaign encounter, delete session log, delete party, delete encounter.

#### Scenario: Confirm performs the action once

- **Given** a page showing an item with a delete/remove/unlink control
- **When** the user clicks the control and then the dialog's confirm button
- **Then** the corresponding DELETE request is sent exactly once for that item and the list refreshes

#### Scenario: Cancel performs nothing

- **Given** the confirmation dialog is open for an item
- **When** the user clicks cancel, "×", presses Escape, or clicks the overlay
- **Then** no DELETE request is sent and the item remains

#### Scenario: Correct row targeted

- **Given** a list with several items
- **When** the user starts deleting the second item and confirms
- **Then** the DELETE request URL contains the second item's id

#### Scenario: Labels name the action

- **Given** the delete-character dialog is open
- **When** it renders
- **Then** the confirm button reads "Delete" and the cancel button reads "Keep"; for unlink the confirm reads "Unlink" with the existing unlink message

### Requirement: ADDED No native confirm in app code

The system SHALL NOT call `window.confirm`/`confirm` in `app/` or `lib/` (`alert()` is out of scope).

#### Scenario: No native confirm remains

- **Given** the merged change
- **When** `rg "\bconfirm\(" app lib` runs (excluding the dialog hook's own `confirm` function)
- **Then** there are no native-dialog call sites

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element (nine sites) -> Requirement: Destructive actions use ConfirmDialog
- Proposal element (test rewrite) -> Requirement: No native confirm in app code
- Design Decisions 1–4 -> requirements above
- Requirement -> Task(s): tasks.md Execution sections 1–4

## Non-Functional Acceptance Criteria

### Requirement: Reliability

- See functional scenarios: "Confirm performs the action once", "Correct row targeted" (single submission; no stale-target deletes).
