## GitHub Issues

- #811

## Why

- Problem statement: "End Combat" uses a native `window.confirm()` (`lib/hooks/useCombat.ts`, `endCombat`), which is unstyled, blocks the thread, cannot be themed, and is inconsistent with the app's in-app modal UX.
- Why now: Issue #811 requests consistent UX. The app has ~10 other native `confirm()` call sites, and there is no reusable confirmation component, so each fix would otherwise be a one-off.
- Business/user impact: Consistent, accessible, themed confirmation; clear action wording ("End Combat" / "Return to Combat") reduces accidental combat termination. A shared component enables follow-up migrations of the other call sites.

## Problem Space

- Current behavior: Clicking End Combat in `lib/components/ActiveCombatView.tsx` calls `endCombat()`, which first runs `confirm('Are you sure you want to end combat?')`.
- Desired behavior: Clicking End Combat opens an in-app `ConfirmDialog`. The confirm button (green) is labelled "End Combat"; the cancel button (red) is labelled "Return to Combat". The header "×" acts as cancel. Confirming runs the existing end-combat flow.
- Constraints:
  - `ConfirmDialog` is built on `lib/components/Modal.tsx`.
  - Callers must pass a required `titleId` so multiple dialogs can coexist without DOM id collisions. `Modal` currently hardcodes `id="modal-title"`, so `Modal` needs an optional `titleId` prop (default preserves current behavior for existing callers).
  - Confirm and cancel labels are caller-supplied props.
  - `endCombat` in the hook must no longer prompt; the UI owns confirmation.
- Assumptions:
  - Dialog open/close state lives in `ActiveCombatView`, not in `useCombat`.
  - Escape key, overlay click, and header "×" all map to cancel.
  - Colours follow the existing Tailwind palette (`bg-green-600`/`bg-red-600` families).
- Edge cases considered:
  - Two `ConfirmDialog` instances mounted at once must have distinct title ids (`aria-labelledby` resolves correctly).
  - `endCombat` failure still surfaces through the existing `error` state; the dialog closes on confirm.
  - Double-click on Confirm must not fire `endCombat` twice (close dialog synchronously before the async call).
  - `endCombat` with no `combatState` / server id remains a silent no-op.

## Scope

### In Scope

- New `lib/components/ConfirmDialog.tsx` (shared): required `titleId`, `title`, message/children, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, `isOpen`; green confirm, red cancel, "×" = cancel.
- `Modal.tsx`: optional `titleId` prop (backward compatible).
- `ActiveCombatView.tsx`: End Combat button opens the dialog with labels "End Combat" / "Return to Combat".
- `useCombat.ts`: remove `confirm()` from `endCombat`.
- Update unit tests (`useCombat`, `ActiveCombatView`), add `ConfirmDialog` unit tests, update e2e `tests/e2e/combat-core.spec.ts` to click the in-app dialog button.

### Out of Scope

- Migrating the other native `confirm()`/`alert()` call sites (characters, campaigns, parties, encounters, monsters, sessions, members, unlink, `InitiativeEntry`, `TargetActionModal`, other `useCombat` alerts). Tracked as follow-up.
- Restyling `Modal` beyond the `titleId` prop.
- Changes to end-combat server/persistence behavior.

## What Changes

- Add `ConfirmDialog` shared component.
- Add optional `titleId` to `Modal`.
- Wire End Combat through `ConfirmDialog` in `ActiveCombatView`.
- Remove native confirm from `useCombat.endCombat`.
- Test updates as listed above.

## Risks

- Risk: Removing `confirm()` from `endCombat` means any other caller of `endCombat` loses its prompt.
  - Impact: Accidental combat end.
  - Mitigation: Only `ActiveCombatView` calls it (verified); spec requires confirmation at the UI layer.
- Risk: Existing tests mock `window.confirm = () => true` and will silently stop exercising the confirm path.
  - Impact: False-positive coverage.
  - Mitigation: Tasks explicitly remove those mocks and assert the dialog flow.
- Risk: Changing `Modal` id handling affects existing modals.
  - Impact: Regressions in `aria-labelledby`.
  - Mitigation: Default remains `modal-title`; add a regression test.

## Open Questions

- Question: Should the follow-up migration of remaining native `confirm()` sites be filed as a separate issue now?
  - Needed from: Requester
  - Blocker for apply: no

## Non-Goals

- Redesigning the modal system or introducing a dialog library.
- Replacing `alert()` usage.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
