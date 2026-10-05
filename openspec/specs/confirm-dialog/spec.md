## Purpose

Define the shared `ConfirmDialog` component (built on `Modal`, with a caller-supplied `titleId`), its use for End Combat in the active combat view, and the removal of the native `confirm()` prompt from `useCombat.endCombat`. Introduced by `shared-confirm-dialog-end-combat` (#811, 2026-10-01); design rationale in [`design.md`](../../changes/archive/2026-10-01-shared-confirm-dialog-end-combat/design.md). Extended by `confirm-dialog-hook-and-focus-order` (#821 part 1, 2026-10-05): confirm-first order and focus, `variant`, and the `useConfirmDialog()` hook (`const { confirm, dialog } = useConfirmDialog()` — render `dialog` once, call `confirm({ title, message, confirmLabel, cancelLabel, variant?, onConfirm })` to open it); rationale in [`design.md`](../../changes/archive/2026-10-05-confirm-dialog-hook-and-focus-order/design.md).

## Requirements

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

### Requirement: Positive action is first and focused

The system SHALL render the confirm button before the cancel button in DOM and visual order, SHALL give the confirm button initial focus when the dialog opens, and SHALL make it the first tab stop (the header "×" SHALL be excluded from tab order but remain clickable). Focus SHALL stay inside the dialog (Tab and Shift+Tab wrap) and return to the opener on close.

#### Scenario: Confirm is first and focused

- **Given** an open `ConfirmDialog`
- **When** it renders
- **Then** the confirm button precedes the cancel button and `document.activeElement` is the confirm button

#### Scenario: Tab order

- **Given** an open `ConfirmDialog`
- **When** the user presses Tab once from the initial focus
- **Then** focus moves to the cancel button, and the "×" button has `tabindex="-1"`

#### Scenario: Close "×" still works

- **Given** an open `ConfirmDialog`
- **When** the user clicks "×" or presses Escape
- **Then** `onCancel` is called once and `onConfirm` is not called

### Requirement: Dialog variant

The system SHALL accept `variant?: 'default' | 'danger'` on `ConfirmDialog`. `default` SHALL render a green confirm and red cancel button; `danger` SHALL render a red confirm and gray cancel button.

#### Scenario: Default variant colors

- **Given** `variant` omitted or `'default'`
- **When** the dialog renders
- **Then** confirm has `bg-green-600` and cancel has `bg-red-600`

#### Scenario: Danger variant colors

- **Given** `variant="danger"`
- **When** the dialog renders
- **Then** confirm has `bg-red-600` and cancel has `bg-gray-600`

### Requirement: useConfirmDialog hook

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

### Requirement: Caller-supplied title id

`ConfirmDialog` SHALL require a `titleId` prop, and the dialog title element id and the dialog's `aria-labelledby` SHALL both use it, so multiple dialogs can be mounted without id collisions.

#### Scenario: Two dialogs coexist

- **Given** two open `ConfirmDialog`s with `titleId="a-title"` and `titleId="b-title"`
- **When** both render
- **Then** the document contains exactly one element with id `a-title` and one with id `b-title`, and each dialog's `aria-labelledby` resolves to its own title

### Requirement: End Combat uses ConfirmDialog

The active combat view SHALL open a confirmation dialog (driven by `useConfirmDialog`, `danger` variant) with confirm label "End Combat" and cancel label "Return to Combat" when the End Combat button is clicked, and SHALL call `endCombat` only when the dialog is confirmed.

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

### Requirement: Modal title id

`Modal` SHALL accept an optional `titleId` prop used for the title element id and `aria-labelledby`, defaulting to `modal-title` when omitted.

#### Scenario: Default id preserved

- **Given** a `Modal` rendered without `titleId`
- **When** it renders
- **Then** the title element id and `aria-labelledby` are `modal-title`

#### Scenario: Custom id applied

- **Given** a `Modal` rendered with `titleId="custom-title"`
- **When** it renders
- **Then** the title element id and `aria-labelledby` are `custom-title`

### Requirement: endCombat no longer prompts

`useCombat.endCombat` SHALL NOT call `window.confirm`; confirmation is the responsibility of the calling UI. When invoked it SHALL perform the end-combat request and state reset as before.

#### Scenario: endCombat runs without native confirm

- **Given** an active combat with a server combat id
- **When** `endCombat()` is called
- **Then** `window.confirm` is not called, the PUT `{ isActive: false }` is sent, and local combat state is cleared on success

#### Scenario: endCombat failure preserved

- **Given** the PUT request fails
- **When** `endCombat()` is called
- **Then** local combat state is preserved and `error` is set

### Requirement: Accessibility

An open `ConfirmDialog` SHALL expose dialog semantics (`role="dialog"`, `aria-modal="true"`, accessible name equal to its title).

#### Scenario: Dialog semantics

- **Given** an open `ConfirmDialog`
- **When** queried by role `dialog`
- **Then** it has `aria-modal="true"` and an accessible name equal to the dialog title

### Requirement: Reliability

Confirming End Combat SHALL call `endCombat` at most once per dialog open.

#### Scenario: Single submission

- See functional scenario: "Confirm ends combat once".

**Traceability**

- Replaced behavior: the native browser `confirm()` previously used by End Combat (#811) is superseded by `ConfirmDialog`; no existing spec requirement is modified or removed.

- Proposal element -> Requirement: Shared ConfirmDialog -> "ConfirmDialog component"; required titleId -> "Caller-supplied title id"; End Combat adoption -> "End Combat uses ConfirmDialog"; hook change -> "endCombat no longer prompts"; Modal id -> "Modal title id".
- Design decision -> Requirement: D1/D3/D4 -> "ConfirmDialog component"; D2 -> "Caller-supplied title id", "Modal title id"; D5 -> "End Combat uses ConfirmDialog", "endCombat no longer prompts".
- Requirement -> Task(s): see [`tasks.md`](../../changes/archive/2026-10-01-shared-confirm-dialog-end-combat/tasks.md) (Modal, ConfirmDialog, ActiveCombatView, useCombat, tests).
