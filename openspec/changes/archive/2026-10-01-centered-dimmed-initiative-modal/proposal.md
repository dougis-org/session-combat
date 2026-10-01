## GitHub Issues

- #807

## Why

- Problem statement: The initiative entry modal still shows a scrollbar / overflow when a combatant has a long name (#807). The modal is `position:absolute` with `left = viewport center` and `transform: translateX(-50%)`; an absolutely positioned box's auto width is capped by the space between its `left` and the containing block's right edge (~half the viewport), so content is squeezed. `clampModalToViewport` then measures that already-capped width, so it can never discover the width the content actually needs. The inner controls column (`min-w-0 flex-1 max-h-[70vh] overflow-y-auto`) also computes `overflow-x: auto`, turning any overflow into a visible scrollbar.
- Why now: Two earlier fixes (#802/#803 clipping, #806 post-batch-roll reopen) patched symptoms of the same hand-rolled measure-and-clamp positioning. #798 (batch monster rolls) is archived, so the modal code is free to change.
- Business/user impact: The DM enters initiative for every combatant at the start of every combat. The modal should look right for any name, and should be the clear focus of the screen while it is open.

## Problem Space

- Current behavior: Modal is anchored to the target `CombatantCard`'s vertical position, horizontally centered, sized by JS measurement, clamped to the viewport by `useInitiativeModal`. There is no backdrop dim, no focus management, and no dialog semantics. The click-outside/Escape close is handled inside `InitiativeEntry`.
- Desired behavior: When the initiative modal opens, the main screen is faintly dimmed (cards behind it remain visible) and the modal is centered in the viewport, sized to its content (up to the viewport minus a 16px margin) by the browser rather than by JS. The dialog is accessible: `role="dialog"`, `aria-modal`, an accessible name, focus moved into it on open, focus trapped while open, and focus restored on close.
- Constraints:
  - Must keep existing behaviors: auto-open on unrolled combatants, auto-advance after Set, dismiss-suppression of auto-reopen, Escape / close button / click-outside to dismiss, batch "Roll all monsters" button, `data-testid="initiative-modal"`.
  - Must not regress the #802/#803 input-clipping fix (focus ring visible on all sides).
  - Follow the existing precedent in `lib/components/Modal.tsx` (fixed overlay, body scroll lock) without reusing it directly: it has a mandatory title header, fixed `max-w-*` sizes and no focus trap.
- Assumptions:
  - The card anchoring was for emphasis/context, not function (confirmed by the requester). A dimmed, centered dialog supplies the emphasis better.
  - The modal already shows the combatant's name and type, so losing the visual link to the card is acceptable.
- Edge cases considered:
  - Very long combatant names (the #807 case) and narrow viewports: modal width caps at viewport minus 16px; name wraps.
  - Dialog taller than the viewport (e.g. "Enter Dice Roll" mode on a short screen): the backdrop scrolls; the page behind does not.
  - Auto-advance to the next combatant: the dim must not flash and focus must move to the new combatant's first control.
  - Combatant removed while the modal is open: modal closes (existing recovery effect), focus is restored.
  - Other absolutely positioned popups on the page (detail panel, remove-confirm) must not paint above the dim.

## Scope

### In Scope

- Render the initiative modal as a `fixed inset-0` faint-dim backdrop (`bg-black/40`-class) with a flex-centered dialog sized by CSS (`w-max max-w-full`).
- Delete JS positioning: card anchor lookup, position state, `clampModalToViewport`, `ResizeObserver`/scroll/resize listeners, `remeasureInitiativeModal` and the `InitiativeEntry` `onModeChange` prop (added in #802 solely for re-measuring).
- Move vertical overflow handling from the inner controls column to the backdrop so the dialog itself never shows a horizontal scrollbar.
- Accessibility: `role="dialog"`, `aria-modal="true"`, accessible name from the "Set Initiative" and combatant-name headings, initial focus, Tab/Shift+Tab focus trap, focus restore on close, body scroll lock while open.
- Update the `modal-initiative-entry` spec and the affected unit/e2e tests.

### Out of Scope

- Other modals (`Modal.tsx`, `TargetActionModal`, detail panel, remove-confirm popup) and a generic shared focus-trap rollout beyond a reusable hook.
- Changing initiative rules, sorting, batch roll behavior, or auto-open/auto-advance/dismiss logic.
- Highlighting or scrolling to the target card behind the dim.

## What Changes

- `lib/components/ActiveCombatView.tsx`: replace the absolutely positioned modal `div` with the backdrop + dialog; drop position/ref/remeasure plumbing; `onSetInitiative` just opens the modal.
- `lib/hooks/useInitiativeModal.ts`: state reduces to `initiativeEditId`; remove `initiativeEditPosition`, `initiativeModalRef`, `getCardAnchorPosition`, `remeasureInitiativeModal`, `MODAL_VIEWPORT_MARGIN`, the clamp and its listeners. `openInitiativeModal(id)` takes only an id. Auto-open no longer depends on locating a card element.
- `lib/hooks/useFocusTrap.ts` (new): focus-on-open, Tab wrap, focus restore, reusable.
- `lib/components/InitiativeEntry.tsx`: remove `onModeChange`; drop inner `max-h-[70vh] overflow-y-auto`; add heading ids for `aria-labelledby`; allow the name to wrap.
- `openspec/specs/modal-initiative-entry/spec.md`: modify the anchoring/clamp/re-clamp/reliability requirements, add backdrop, content-sized width and accessibility requirements (via delta spec).
- Tests: remove anchoring/clamp/re-measure tests; add backdrop, sizing-class, focus-trap and long-name tests.

## Risks

- Risk: Dimmed overlay is painted under other `z-50` absolutely positioned popups (detail panel, remove-confirm) that are later in the DOM.
  - Impact: A popup could appear un-dimmed above the backdrop, or intercept clicks.
  - Mitigation: Verify stacking in the e2e/manual check; give the backdrop a higher z-index only if needed.
- Risk: A `transform`/`filter` ancestor makes `fixed` position relative to that ancestor instead of the viewport.
  - Impact: Backdrop would not cover the screen.
  - Mitigation: Check the ancestors of the render site during implementation; render inline unless one exists, otherwise portal to `document.body`.
- Risk: Body scroll lock and focus restore interact badly with auto-advance (modal unmounts/remounts the entry per combatant).
  - Impact: Scroll position jumps or focus lands on `<body>`.
  - Mitigation: Keep the backdrop/dialog mounted while `initiativeEditId` is non-null, keying only `InitiativeEntry`; restore focus only when the backdrop unmounts.
- Risk: Reversing the earlier "anchor to the card" decisions (#752, #753) surprises future readers.
  - Impact: Confusing history.
  - Mitigation: The delta spec records the reversal and its reason; the archive/reflection step notes it.

## Open Questions

- All open questions resolved during exploration:
  - Dim strength: faint, so the content behind stays visible (requester).
  - Vertical placement: viewport-centered, not card-anchored (requester).
  - Accessibility: `role="dialog"`/`aria-modal`/labelled and focus trap are required (requester).
  - Page scroll lock while open: yes, following the `Modal.tsx` precedent (default; low risk, reversible).
  - Click on the dim closes the modal: yes, via the existing outside-click handler in `InitiativeEntry` (unchanged behavior, now with a visible backdrop).

## Non-Goals

- Reworking `InitiativeEntry`'s internal layout beyond what is needed for width/overflow.
- Introducing a modal library or a portal infrastructure.
- Animating the dim or the dialog.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
