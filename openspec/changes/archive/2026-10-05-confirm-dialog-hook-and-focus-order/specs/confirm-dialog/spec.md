## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Positive action is first and focused

The system SHALL render the confirm button before the cancel button in DOM and visual order, SHALL give the confirm button initial focus when the dialog opens, and SHALL make it the first tab stop (the header "×" SHALL be excluded from tab order but remain clickable).

#### Scenario: Confirm is first and focused

- **Given** an open `ConfirmDialog`
- **When** it renders
- **Then** the confirm button precedes the cancel button among the dialog's tabbable buttons and `document.activeElement` is the confirm button

#### Scenario: Tab order

- **Given** an open `ConfirmDialog`
- **When** the user presses Tab once from the initial focus
- **Then** focus moves to the cancel button, and the "×" button has `tabindex="-1"`

#### Scenario: Close "×" still works

- **Given** an open `ConfirmDialog`
- **When** the user clicks "×" or presses Escape
- **Then** `onCancel` is called once and `onConfirm` is not called

### Requirement: ADDED Dialog variant

The system SHALL accept `variant?: 'default' | 'danger'` on `ConfirmDialog`. `default` SHALL render a green confirm and red cancel button; `danger` SHALL render a red confirm and gray cancel button.

#### Scenario: Default variant colors

- **Given** `variant` omitted or `'default'`
- **When** the dialog renders
- **Then** confirm has `bg-green-600` and cancel has `bg-red-600`

#### Scenario: Danger variant colors

- **Given** `variant="danger"`
- **When** the dialog renders
- **Then** confirm has `bg-red-600` and cancel has `bg-gray-600`

### Requirement: ADDED useConfirmDialog hook

The system SHALL provide `useConfirmDialog()` returning `{ confirm, dialog }`. Calling `confirm(options)` SHALL open the dialog with the given title, message, labels and variant; confirming SHALL close it then call `options.onConfirm` once; cancelling SHALL close it without calling `onConfirm`. Each hook instance SHALL use a unique `titleId`.

#### Scenario: Confirm path

- **Given** a component rendering `dialog` and having called `confirm({... onConfirm })`
- **When** the user activates the confirm button
- **Then** `onConfirm` is called once and the dialog is closed

#### Scenario: Cancel path

- **Given** an open hook-driven dialog
- **When** the user cancels via button, "×", Escape, or overlay
- **Then** `onConfirm` is not called and the dialog is closed

#### Scenario: Not open until requested

- **Given** a component using the hook that has not called `confirm`
- **When** it renders
- **Then** no dialog is in the document

#### Scenario: Unique ids across instances

- **Given** two components each using the hook with open dialogs
- **When** both render
- **Then** their `aria-labelledby` ids are distinct and each resolves to exactly one element

## MODIFIED Requirements

### Requirement: ConfirmDialog component

The system SHALL provide a shared `ConfirmDialog` component, built on `Modal`, that renders a title, a message, a confirm button (rendered first), and a cancel button, using caller-supplied `confirmLabel` and `cancelLabel` text. Button colors SHALL follow `variant` (default: green confirm, red cancel). The header "×" control, the Escape key, and an overlay click SHALL all invoke `onCancel`. The dialog SHALL render nothing when `isOpen` is false.

#### Scenario: Custom labels and colours

- **Given** a `ConfirmDialog` is open with `confirmLabel="End Combat"` and `cancelLabel="Return to Combat"` and no `variant`
- **When** it renders
- **Then** a button labelled "End Combat" with green styling (`bg-green-600`) and a button labelled "Return to Combat" with red styling (`bg-red-600`) are present

#### Scenario: Confirm invokes onConfirm only

- **Given** an open `ConfirmDialog`
- **When** the user clicks the confirm button
- **Then** `onConfirm` is called once and `onCancel` is not called

#### Scenario: Cancel button, "×", Escape, and overlay all cancel

- **Given** an open `ConfirmDialog`
- **When** the user clicks the cancel button, or the header "×", or presses Escape, or clicks the overlay
- **Then** `onCancel` is called once per action and `onConfirm` is never called

#### Scenario: Closed dialog renders nothing

- **Given** `isOpen` is false
- **When** the component renders
- **Then** no element with `role="dialog"` is in the document

### Requirement: End Combat uses ConfirmDialog

The active combat view SHALL open a confirmation dialog (driven by `useConfirmDialog`) with confirm label "End Combat" and cancel label "Return to Combat" when the End Combat button is clicked, and SHALL call `endCombat` only when the dialog is confirmed.

#### Scenario: Open dialog without ending combat

- **Given** an active combat is displayed
- **When** the user clicks the End Combat button
- **Then** the confirmation dialog is shown and `endCombat` has not been called

#### Scenario: Confirm ends combat once

- **Given** the End Combat confirmation dialog is open
- **When** the user clicks "End Combat" in the dialog (including a rapid double-click)
- **Then** the dialog closes and `endCombat` is called exactly once

#### Scenario: Return to Combat keeps combat running

- **Given** the End Combat confirmation dialog is open
- **When** the user clicks "Return to Combat" or "×"
- **Then** the dialog closes, `endCombat` is not called, and the combat remains active

## REMOVED Requirements

None.

## Traceability

- Proposal element (confirm-first) -> Requirement: Positive action is first and focused
- Proposal element (variant) -> Requirement: Dialog variant
- Proposal element (hook) -> Requirement: useConfirmDialog hook
- Proposal element (refactor existing use) -> Requirement: End Combat uses ConfirmDialog
- Design Decisions 1–4 -> corresponding requirements above
- Requirement -> Task(s): tasks.md Execution sections 1–5

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Single submission

- See existing `confirm-dialog` scenario "Single submission"; the hook SHALL preserve it (one `onConfirm` per confirm click).
