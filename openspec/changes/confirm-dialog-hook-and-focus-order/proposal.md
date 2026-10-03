## GitHub Issues

- #821 (part 1 of 2 — refs only; the follow-up change `migrate-native-confirm-sites` closes it)

## Why

- Problem statement: #821 asks to migrate ~9 remaining native `confirm()` calls to `ConfirmDialog`. Done naively, each call site repeats a `useState` flag, a unique `titleId`, and an inline `<ConfirmDialog>`. Separately, `ConfirmDialog` currently renders Cancel before Confirm and the header "×" is the first tab stop, so the positive action is neither first visually nor first in keyboard order.
- Why now: the shared component has one consumer (`ActiveCombatView`). Fixing its API and a11y before nine more consumers adopt it avoids touching every site twice.
- Business/user impact: consistent, keyboard-friendly confirmations; destructive deletes can be styled as destructive.

## Problem Space

- Current behavior: `lib/components/ConfirmDialog.tsx` renders `[Cancel(red)] [Confirm(green)]`; `Modal` renders the "×" header button before body content, so Tab from open lands on "×". No hook; `ActiveCombatView` hand-rolls `showEndCombatConfirm` state. Colors are hardcoded (confirm green, cancel red), which reads backwards for deletes.
- Desired behavior:
  1. Positive (confirm) action renders first (visually left) and is the first tab stop / initial focus when the dialog opens.
  2. `ConfirmDialog` accepts a `variant` (`'default' | 'danger'`) so destructive confirmations can be styled appropriately.
  3. A `useConfirmDialog()` hook owns open/close state, the unique `titleId` (via `useId`), and returns a ready-to-render dialog element plus a `confirm(options)` trigger.
  4. `ActiveCombatView`'s End Combat prompt uses the hook.
- Constraints: Escape, "×", overlay click, and Cancel must still all call `onCancel` only. `data-testid`s `confirm-dialog-confirm` / `confirm-dialog-cancel` stay stable (E2E in `tests/e2e/combat-core.spec.ts` depends on them).
- Assumptions: "scope to allow wider use" (request wording) is read as the `variant` prop above. Hook is callback-based (`onConfirm`), not promise-based.
- Edge cases considered: two dialogs mounted at once (distinct ids); the auto-end-combat prompt is derived state, not user-triggered, so it keeps using `ConfirmDialog` directly; "×" must stay mouse-clickable and Escape must still close even if "×" leaves the tab order.

## Scope

### In Scope

- `ConfirmDialog`: button order (confirm first), initial focus on confirm, `variant` prop.
- `Modal`: optional prop to take the header "×" out of tab order (used by `ConfirmDialog`).
- New `lib/hooks/useConfirmDialog.tsx` (+ unit tests).
- Refactor `ActiveCombatView` End Combat to the hook; update the auto-end prompt for new order.
- Update `ConfirmDialog` / `ActiveCombatView` unit tests, and `combat-core.spec.ts` if it assumes DOM order.
- Spec deltas for `confirm-dialog` and `modal`.

### Out of Scope

- Migrating any other `confirm()` call site (PR 2: `migrate-native-confirm-sites`).
- Focus trapping / focus restore for `Modal` generally.
- `alert()` calls.

## What Changes

- `ConfirmDialog` DOM order becomes Confirm, Cancel; confirm gets `autoFocus`; new `variant` prop (danger: confirm red, cancel neutral gray; default: unchanged colors).
- `Modal` gains `closeButtonTabbable?: boolean` (default `true`); `ConfirmDialog` passes `false`.
- New `useConfirmDialog()` returning `{ confirm, dialog }`.
- `ActiveCombatView` End Combat uses the hook.

## Risks

- Risk: Enter/Space on the auto-focused destructive confirm deletes immediately.
  - Impact: accidental deletion by a held/double Enter.
  - Mitigation: required by the requester; "danger" variant makes the destructive action visually explicit; labels name the action ("Delete"). Flagged for review.
- Risk: `autoFocus` behaves differently in jsdom vs browsers.
  - Impact: flaky focus assertions.
  - Mitigation: assert `toHaveFocus()` after render in unit tests; verify real tab order in E2E.
- Risk: E2E selectors relying on button order.
  - Impact: broken `combat-core.spec.ts`.
  - Mitigation: selectors use `data-testid`; verify in task list.

## Open Questions

- Question: Danger-variant cancel color — neutral gray acceptable?
  - Needed from: requester
  - Blocker for apply: no (default: gray)
- Question: Hook style — callback (`onConfirm`) chosen over promise-returning; acceptable?
  - Needed from: requester
  - Blocker for apply: no

## Non-Goals

- A general focus-trap implementation.
- Changing `Modal` behavior for any other consumer.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
