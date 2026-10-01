## Context

- Relevant architecture:
  - `lib/components/Modal.tsx` is the shared dialog shell (overlay, Escape, "×" close button, `role="dialog"`, `aria-labelledby`). It hardcodes `titleId = 'modal-title'`.
  - `lib/hooks/useCombat.ts` `endCombat()` currently prompts with `confirm()` and then does PUT `/api/combat/:id` `{ isActive: false }`, clears history and local state.
  - `lib/components/ActiveCombatView.tsx` renders the End Combat button (`onClick={endCombat}`) and already owns other local modal state (e.g. `showLairForm`).
- Dependencies: React, Tailwind classes already in use. No new packages.
- Interfaces/contracts touched:
  - New `ConfirmDialogProps` (`lib/components/ConfirmDialog.tsx`).
  - `ModalProps` gains optional `titleId`.
  - `UseCombatReturn.endCombat` keeps signature `() => Promise<void>` but no longer prompts.

## Goals / Non-Goals

### Goals

- Reusable `ConfirmDialog` with caller-supplied confirm/cancel labels, green confirm, red cancel, "×" = cancel, and a required `titleId`.
- End Combat uses it with "End Combat" / "Return to Combat".
- Multiple dialogs can coexist without id collisions.

### Non-Goals

- Migrating other native `confirm()`/`alert()` call sites.
- A dialog manager/context or imperative `confirm()` promise API.

## Decisions

### Decision 1: `ConfirmDialog` composes `Modal`

- Chosen: `ConfirmDialog` renders `<Modal isOpen title titleId onClose={onCancel} size="small">` with the message and two buttons in the body.
- Alternatives considered: standalone dialog implementation; a dialog library.
- Rationale: Reuses Escape/overlay/scroll-lock/a11y behavior; visual consistency with the rest of the app.
- Trade-offs: Inherits Modal's body styling (`max-h-96 overflow-y-auto`), acceptable for short confirmation text.

### Decision 2: Required `titleId` prop, threaded into `Modal`

- Chosen: `ConfirmDialog` requires `titleId: string`. `Modal` gains `titleId?: string` defaulting to `'modal-title'`; used for the `<h2 id>` and `aria-labelledby`.
- Alternatives considered: `useId()` auto-generation inside Modal; leaving the hardcoded id.
- Rationale: The requester explicitly wants callers to supply the id. A default keeps every existing `Modal` caller unchanged.
- Trade-offs: Callers must choose unique ids; uniqueness is not enforced at runtime.

### Decision 3: "×", Escape, and overlay click all mean cancel

- Chosen: `Modal.onClose` is wired to `onCancel`. The red cancel button also calls `onCancel`.
- Alternatives considered: separate dismiss callback.
- Rationale: A dismissal must never perform the destructive action; single code path.
- Trade-offs: No way to distinguish dismiss from explicit cancel (not needed).

### Decision 4: Button colours and labels

- Chosen: Confirm button `bg-green-600 hover:bg-green-700`; cancel button `bg-red-600 hover:bg-red-700`; labels from required `confirmLabel` and `cancelLabel` props. Test ids `confirm-dialog-confirm` and `confirm-dialog-cancel`.
- Alternatives considered: default labels ("Yes"/"No"); a `destructive` variant swapping colours.
- Rationale: Per requester, "yes" is green and "no" is red regardless of action; labels are always caller-supplied so required props avoid generic wording.
- Trade-offs: Green-confirm on a destructive action is a deliberate request; wording ("Return to Combat" on red) carries the safety cue.

### Decision 5: Confirmation owned by the UI, not the hook

- Chosen: Remove `confirm()` from `endCombat`. `ActiveCombatView` holds `showEndCombatConfirm` state; End Combat button sets it true; dialog confirm sets it false synchronously, then calls `endCombat()`.
- Alternatives considered: dialog state in `useCombat`; keeping `confirm` as a fallback.
- Rationale: Hook stays UI-free and testable; closing before the async call prevents double submission.
- Trade-offs: Any future caller of `endCombat` must provide its own confirmation.

## Proposal to Design Mapping

- Proposal element: Shared `ConfirmDialog` with custom labels, green/red, "×" = cancel
  - Design decision: Decisions 1, 3, 4
  - Validation approach: `ConfirmDialog` unit tests
- Proposal element: Required `titleId`, no collisions
  - Design decision: Decision 2
  - Validation approach: unit test rendering two dialogs; `Modal` default regression test
- Proposal element: End Combat adoption, remove native confirm
  - Design decision: Decision 5
  - Validation approach: `ActiveCombatView` + `useCombat` unit tests; e2e `combat-core.spec.ts`

## Functional Requirements Mapping

- Requirement: ConfirmDialog renders caller labels and invokes the right callback
  - Design element: Decisions 1, 3, 4
  - Acceptance criteria reference: specs/confirm-dialog/spec.md "ConfirmDialog component"
  - Testability notes: RTL; click each control and assert callbacks.
- Requirement: Unique title ids
  - Design element: Decision 2
  - Acceptance criteria reference: specs/confirm-dialog/spec.md "Caller-supplied title id"
  - Testability notes: Render two dialogs; assert distinct ids and matching `aria-labelledby`.
- Requirement: End Combat flow
  - Design element: Decision 5
  - Acceptance criteria reference: specs/confirm-dialog/spec.md "End Combat uses ConfirmDialog"
  - Testability notes: Component test + e2e.

## Non-Functional Requirements Mapping

- Requirement category: operability/accessibility
  - Requirement: Dialog has `role="dialog"`, `aria-modal`, labelled by title id; Escape cancels.
  - Design element: Modal reuse (Decision 1)
  - Acceptance criteria reference: spec NFAC Accessibility
  - Testability notes: Query by role `dialog` and accessible name.
- Requirement category: reliability
  - Requirement: Confirm triggers `endCombat` at most once per open.
  - Design element: Decision 5
  - Acceptance criteria reference: spec NFAC Reliability
  - Testability notes: Double-click confirm; assert one call.

## Risks / Trade-offs

- Risk/trade-off: Other callers of `endCombat` lose prompt.
  - Impact: Accidental end.
  - Mitigation: Only `ActiveCombatView` calls it; verified during tasks.
- Risk/trade-off: Tests relying on `global.confirm` mock go stale.
  - Impact: False coverage.
  - Mitigation: Remove mock at `tests/unit/hooks/useCombat.test.ts:235` and assert no `confirm` call.
- Risk/trade-off: Green confirm on destructive action.
  - Impact: Perceived mismatch with convention.
  - Mitigation: Explicit requester decision; distinct labels.

## Rollback / Mitigation

- Rollback trigger: Regression in combat end flow or any Modal rendering.
- Rollback steps: Revert the PR; `endCombat` regains `confirm()`.
- Data migration considerations: None.
- Verification after rollback: Run unit tests and `combat-core` e2e.

## Operational Blocking Policy

- If CI checks fail: Fix on the branch; do not merge or bypass (no admin merge).
- If security checks fail: Resolve findings; waive only on explicit human acceptance.
- If required reviews are blocked/stale: Address every PR comment; re-request review.
- Escalation path and timeout: Ask the requester if blocked more than one working day.

## Open Questions

- Should the follow-up migration of the remaining native `confirm()` sites be filed as its own issue? (non-blocking)
