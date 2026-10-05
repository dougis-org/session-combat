## Context

- Relevant architecture: `lib/components/ConfirmDialog.tsx` wraps `lib/components/Modal.tsx` (header "×" button precedes body in DOM; Escape/overlay call `onClose`). Sole consumer: `lib/components/ActiveCombatView.tsx` (End Combat via `showEndCombatConfirm` state; auto-end prompt via derived `showAutoEndPrompt`).
- Dependencies: React `useId`, `useState`, `useCallback`.
- Interfaces/contracts touched: `ConfirmDialogProps` (+`variant`), `Modal` props (+`closeButtonTabbable`), new `useConfirmDialog` API. Test ids unchanged.

## Goals / Non-Goals

### Goals

- Confirm action first visually and in tab order, focused on open.
- One-line adoption for call sites via a hook; unique `titleId` handled internally.
- Destructive styling available via `variant`.

### Non-Goals

- Focus trap/restore; promise-based API; touching other Modal consumers.

## Decisions

### Decision 1: `useConfirmDialog` hook, callback-based

- Chosen: `const { confirm, dialog } = useConfirmDialog();` — `confirm({ title, message, confirmLabel, cancelLabel, variant?, onConfirm })` stores options in state; `dialog` is a `<ConfirmDialog>` element (or `null`-open) to render once. `titleId` from `useId()`. Confirm closes the dialog then calls `onConfirm`; cancel just closes.
- Alternatives considered: promise-returning `await confirm()` (drop-in for native, but dangling promises on unmount); per-site state (boilerplate ×9).
- Rationale: callback avoids unresolved promises, is trivial to unit test, and keeps `titleId` uniqueness in one place.
- Trade-offs: call sites restructure `if (!confirm()) return;` into a callback.

### Decision 2: Confirm-first order + initial focus

- Chosen: render Confirm before Cancel in DOM (`justify-end` keeps them right-aligned, so Confirm is left of Cancel); `autoFocus` on Confirm; `Modal` gets `closeButtonTabbable` (default true) and `ConfirmDialog` passes false → "×" gets `tabIndex={-1}`.
- Alternatives considered: `initialFocusRef` only (leaves "×" first in tab order, doesn't satisfy "first tab stop"); reorder `Modal` DOM (affects all modals).
- Rationale: smallest change that makes Confirm the first tab stop; "×", Escape, overlay remain functional by mouse/keyboard (Escape).
- Trade-offs: keyboard users reach "×" only via Escape equivalent (acceptable — Cancel is reachable).

### Decision 3: `variant` prop

- Chosen: `variant?: 'default' | 'danger'`. default = today's colors (confirm green, cancel red). danger = confirm red, cancel gray.
- Alternatives considered: free-form `confirmClassName`/`cancelClassName` (loses consistency).
- Rationale: wider reuse (deletes) without per-site styling.
- Trade-offs: two fixed palettes.

### Decision 4: Refactor ActiveCombatView

- Chosen: End Combat uses the hook; the auto-end prompt (derived state, not a user trigger) keeps a direct `<ConfirmDialog>` with its fixed `titleId`.
- Alternatives considered: force the hook onto the auto-end prompt (would need effect-driven `confirm()` calls, worse than derived state).
- Rationale: hook is for user-initiated confirmations.

## Proposal to Design Mapping

- Proposal element: confirm first / first tab stop
  - Design decision: Decision 2
  - Validation approach: unit DOM-order + focus tests; E2E tab-order check
- Proposal element: `variant`
  - Design decision: Decision 3
  - Validation approach: class assertions for both variants
- Proposal element: hook
  - Design decision: Decision 1
  - Validation approach: hook unit tests (open/confirm/cancel/unique id)
- Proposal element: refactor existing use
  - Design decision: Decision 4
  - Validation approach: updated `ActiveCombatView` tests + `combat-core.spec.ts`

## Functional Requirements Mapping

- Requirement: confirm-first order and focus
  - Design element: Decision 2
  - Acceptance criteria reference: `specs/confirm-dialog/spec.md` — "Positive action is first and focused"
  - Testability notes: `toHaveFocus`, DOM order via `getAllByRole('button')`
- Requirement: hook behavior
  - Design element: Decision 1
  - Acceptance criteria reference: `specs/confirm-dialog/spec.md` — "useConfirmDialog" scenarios
  - Testability notes: render a harness component with RTL

## Non-Functional Requirements Mapping

- Requirement category: operability/accessibility
  - Requirement: no id collisions; keyboard-operable
  - Design element: `useId`, Decision 2
  - Acceptance criteria reference: spec NFAC
  - Testability notes: two hook instances → two distinct `aria-labelledby` ids

## Risks / Trade-offs

- Risk/trade-off: auto-focused destructive confirm
  - Impact: accidental Enter confirms
  - Mitigation: requested behavior; danger styling + explicit labels

## Rollback / Mitigation

- Rollback trigger: E2E/a11y regression or reviewer rejection of focus behavior.
- Rollback steps: revert the PR (no data/schema changes).
- Data migration considerations: none.
- Verification after rollback: `ActiveCombatView` and `ConfirmDialog` unit suites green.

## Operational Blocking Policy

- If CI checks fail: fix, validate locally, push; do not merge red.
- If security checks fail: remediate before merge.
- If required reviews are blocked/stale: re-request; escalate to the requester after 24h.
- Escalation path and timeout: report stall to the requester after three no-progress iterations.

## Open Questions

- Danger-variant cancel color (default gray); callback vs promise hook (default callback).
