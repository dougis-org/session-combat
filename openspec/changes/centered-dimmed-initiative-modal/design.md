## Context

- Relevant architecture:
  - `lib/components/ActiveCombatView.tsx` renders the modal (currently an absolutely positioned `div` with inline `top/left/width/transform`) and passes position/ref callbacks to and from `lib/hooks/useInitiativeModal.ts`.
  - `useInitiativeModal` owns: `initiativeEditId`, `initiativeEditPosition`, the modal ref, dismissal set, auto-open effect, removed-combatant recovery effect, and `clampModalToViewport` (+ `ResizeObserver`, scroll and resize listeners).
  - `lib/components/InitiativeEntry.tsx` owns the entry UI plus Escape and outside-`mousedown` close handling, and fires `onModeChange` so the host can re-clamp.
- Dependencies: React 19, Tailwind (existing classes only), Jest + Testing Library (unit), Playwright (e2e). No new packages.
- Interfaces/contracts touched:
  - `UseInitiativeModalResult`: remove `initiativeEditPosition`, `initiativeModalRef`, `getCardAnchorPosition`, `remeasureInitiativeModal`; `openInitiativeModal(id: string | null)`.
  - `InitiativeEntryProps`: remove `onModeChange`.
  - New `useFocusTrap(containerRef, active)` hook.
  - DOM contract kept: `data-testid="initiative-modal"` is the dialog element; new `data-testid="initiative-modal-backdrop"`.

## Goals / Non-Goals

### Goals

- The modal's width is whatever the content needs, up to viewport minus 16px, with no horizontal scrollbar for any combatant name (#807).
- The main screen is faintly dimmed with the page content still visible; the modal is centered in the viewport.
- Accessible dialog semantics, focus trap and focus restore.
- Net deletion of positioning code.

### Non-Goals

- Changing initiative logic, auto-open/auto-advance/dismiss semantics, or batch rolling.
- A shared modal system or portal infrastructure.

## Decisions

### Decision 1: CSS-sized, flex-centered fixed overlay replaces JS measure-and-clamp

- Chosen: `<div fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-black/40 data-testid="initiative-modal-backdrop">` containing `<div role="dialog" aria-modal="true" class="w-max max-w-full ..." data-testid="initiative-modal">`. The backdrop's `p-4` provides the 16px viewport margin; `w-max max-w-full` makes the browser size the dialog to its content, capped at the available width.
- Alternatives considered:
  - A. Keep absolute positioning but measure with the modal unconstrained (`left:0; width:max-content`) and then place it. Fixes #807 but keeps all the measuring/clamping code and listeners.
  - B′. Flex-centered horizontally, vertically offset to the card's top. Keeps a measurement of the card and the card-anchoring requirement the requester no longer needs.
  - C. Truncate the name. Hides information and ignores the request that the modal grow.
- Rationale: The root cause is that JS measures a box whose width is capped by its own `left` offset. Letting the browser lay out a centered box removes the cause and the code that worked around it. With a dimmed backdrop, card anchoring is no longer needed for emphasis.
- Trade-offs: The modal no longer visually points at its card (mitigated by the combatant name/type shown in the modal). The reversal of #752/#753 is recorded in the delta spec.

### Decision 2: Faint dim

- Chosen: `bg-black/40` on the backdrop (lighter than the 50% used by `Modal.tsx`), so the combat tracker behind stays legible.
- Alternatives considered: No dim (no emphasis); 50–60% dim (hides context the DM may want to glance at).
- Rationale: Requester asked for a faint dim that keeps content visible.
- Trade-offs: Contrast between the dialog and the backdrop is lower; the dialog keeps its `shadow-2xl` and `border` so it still reads as foreground.

### Decision 3: Vertical overflow lives on the backdrop; dialog and entry have no scroller

- Chosen: Remove `max-h-[70vh] overflow-y-auto` from the `InitiativeEntry` controls column. The backdrop has `overflow-y-auto` and the dialog has `max-w-full` only. The `p-1` padding stays so input focus rings are never clipped (#802/#803).
- Alternatives considered: Keep the inner scroller and add `overflow-x-hidden` (clips real overflow and hides the symptom); put `max-h` + `overflow-y-auto` on the dialog (again makes `overflow-x` compute to `auto`, the original #807 symptom).
- Rationale: Setting `overflow-y` to anything but `visible` forces `overflow-x` to `auto`, so any sub-pixel horizontal overflow shows a scrollbar. Scrolling the backdrop only matters when the dialog is taller than the viewport, and the dialog is `max-w-full`, so it cannot create horizontal overflow.
- Trade-offs: On a very short viewport the whole dialog scrolls (including the heading and close button) instead of just the body. Acceptable.

### Decision 4: Remove all positioning state from the hook; `openInitiativeModal(id)` takes only an id

- Chosen: `useInitiativeModal` keeps `initiativeEditId`, the dismissal set, the auto-open effect, the removed-combatant recovery effect, `handleSetInitiative`, `closeInitiativeModal`. Delete position state, the ref, `getCardAnchorPosition`, the clamp, the listeners, `remeasureInitiativeModal`, and `onModeChange` in `InitiativeEntry`.
- Alternatives considered: Keep an optional position for a possible later anchoring (YAGNI).
- Rationale: With no anchor, the "card not found, so don't open" guard also goes away, so auto-open and manual open cannot silently fail because a card element was missing.
- Trade-offs: The "Reliability: missing DOM node" requirement is replaced by "removed combatant closes the modal" (already implemented by the recovery effect).

### Decision 5: Focus trap via a small reusable `useFocusTrap` hook

- Chosen: `useFocusTrap(ref, active, { restoreFocus })` in `lib/hooks/useFocusTrap.ts`. On activation it remembers `document.activeElement`, moves focus to the first tabbable descendant (falling back to the container with `tabIndex={-1}`), wraps Tab/Shift+Tab at the ends via a `keydown` listener on the container, and restores focus to the remembered element on deactivation if it is still in the document. Re-focuses the first control when the target combatant changes (auto-advance) without restoring focus in between. It does not handle Escape (already handled by `InitiativeEntry`).
- Alternatives considered: `focus-trap-react` or similar library (new dependency for ~40 lines); `inert` on the page behind (broad browser/React 19 plumbing, and the tracker is not wrapped in a single root); no trap (violates the accessibility requirement).
- Rationale: The repo has no focus-trap helper (`Modal.tsx` has `aria-modal` only). A small hook is testable in jsdom and reusable by other modals later.
- Trade-offs: Tabbable-element detection uses a selector list (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`, excluding `disabled`); sufficient for this dialog.

### Decision 6: Dialog semantics and naming

- Chosen: Dialog element gets `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the "Set Initiative" heading and the combatant-name heading ids (generated with `useId`, passed into `InitiativeEntry`). Accessible name reads, e.g., "Set Initiative Orc".
- Alternatives considered: `aria-label` string (duplicates visible text and goes stale); native `<dialog>` with `showModal()` (built-in trap and backdrop, but jsdom support is partial and it changes the stacking/testing model of the whole app's modals).
- Rationale: Ties the accessible name to visible headings.
- Trade-offs: `InitiativeEntry` gains id props.

### Decision 7: Body scroll lock while open

- Chosen: Set `document.body.style.overflow = 'hidden'` while the backdrop is mounted and restore the previous value on unmount, matching `Modal.tsx`.
- Alternatives considered: No lock (page behind scrolls under the dim); `overscroll-behavior` only.
- Rationale: Precedent in the repo; the dimmed page should not scroll under the dialog. Defaulted by the proposal's open-question resolution.
- Trade-offs: Scrollbar disappearance can shift layout by the scrollbar width; the shift is hidden under the dim.

## Proposal to Design Mapping

- Proposal element: Fix long-name scrollbar/overflow (#807)
  - Design decision: Decisions 1 and 3
  - Validation approach: Unit test of classes (`w-max max-w-full`, no inline `left/top/width`, no inner `overflow-y-auto`); Playwright e2e with a long name on a narrow viewport asserts no horizontal scroll.
- Proposal element: Faint dim of the main screen
  - Design decision: Decision 2
  - Validation approach: Unit test that the backdrop exists with the dim class; visual check.
- Proposal element: Centered, viewport-pinned modal
  - Design decision: Decision 1
  - Validation approach: Unit test of the flex-centering classes; e2e bounding-box check against the viewport.
- Proposal element: Delete JS positioning and re-measure plumbing
  - Design decision: Decision 4
  - Validation approach: Removed symbols no longer exported; typecheck; tests updated.
- Proposal element: Accessibility and focus trap
  - Design decision: Decisions 5, 6, 7
  - Validation approach: Hook unit tests; component tests for role/name/focus/restore; e2e Tab-cycle check.

## Functional Requirements Mapping

- Requirement: Backdrop and centered, content-sized dialog
  - Design element: Decision 1, 2, 3
  - Acceptance criteria reference: Spec scenarios "Backdrop dims the screen", "Dialog is centered and content-sized", "Long name does not create a scrollbar"
  - Testability notes: Class assertions in jsdom (no layout engine); real layout verified in Playwright.
- Requirement: Dismissal and auto-open/advance behaviors continue to work without anchoring
  - Design element: Decision 4
  - Acceptance criteria reference: Spec scenarios under "Auto-Open", "Auto-Advance", "Dismiss", "Reliability"
  - Testability notes: Existing `ActiveCombatView` tests minus position assertions.
- Requirement: Accessible dialog with focus management
  - Design element: Decision 5, 6
  - Acceptance criteria reference: Spec scenarios "Dialog semantics", "Focus moves in on open", "Tab wraps", "Focus restores on close", "Auto-advance refocuses"
  - Testability notes: `useFocusTrap` unit tests with real DOM + `userEvent.tab()`.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: No JS layout measurement or scroll/resize listeners while the modal is open.
  - Design element: Decision 1, 4
  - Acceptance criteria reference: NFAC "No layout listeners"
  - Testability notes: Assert `ResizeObserver`/scroll listeners are not registered by the hook.
- Requirement category: reliability
  - Requirement: Opening never silently fails because an anchor element is missing; removing the target combatant closes the modal and restores focus.
  - Design element: Decision 4, 5
  - Acceptance criteria reference: Spec "Recovery behavior from missing DOM node"
  - Testability notes: Existing recovery-effect test retained.
- Requirement category: operability/accessibility
  - Requirement: WCAG 2.1 AA dialog behaviors (name, modal semantics, keyboard operation, focus not lost).
  - Design element: Decision 5, 6
  - Acceptance criteria reference: Accessibility scenarios in the delta spec
  - Testability notes: Role/name queries and keyboard tests.
- Requirement category: security
  - Requirement: None affected (no data, network or auth changes).
  - Design element: N/A
  - Acceptance criteria reference: N/A
  - Testability notes: N/A

## Risks / Trade-offs

- Risk/trade-off: Lost visual link between modal and card.
  - Impact: DM must read the combatant name in the modal.
  - Mitigation: Name and type are already prominent; the dim is faint so the list stays visible.
- Risk/trade-off: Stacking order against other `z-50` popups.
  - Impact: Popup above the dim.
  - Mitigation: Verify in e2e/manual; adjust z-index only if observed.
- Risk/trade-off: `fixed` inside a transformed ancestor.
  - Impact: Backdrop not full-screen.
  - Mitigation: Inspect ancestors at the render site; portal to `document.body` only if needed.
- Risk/trade-off: Hand-written focus trap misses an exotic focusable.
  - Impact: Tab escapes the dialog.
  - Mitigation: Selector covers all controls used by `InitiativeEntry`; test covers every mode (roll/dice/total) and the batch-roll button.

## Rollback / Mitigation

- Rollback trigger: Regression in initiative entry flow (cannot open/close/advance), unusable layout on common viewports, or focus trap blocking input in production.
- Rollback steps: Revert the PR (single squash commit); no data or schema changes.
- Data migration considerations: None.
- Verification after rollback: Run `tests/unit/components/ActiveCombatView.test.tsx`, `tests/unit/combat/initiativeEntry.test.tsx` and the combat e2e spec.

## Operational Blocking Policy

- If CI checks fail: Fix on the branch, validate locally (unit, integration, e2e, build), push, re-run. Never merge with a red required check (`ci-gate`, Codacy). Never use `--admin`.
- If security checks fail: Remediate, re-scan; no waivers without an explicit human-accepted risk citing the source.
- If required reviews are blocked/stale: Re-request review and address all comments; do not bypass branch protection (main is squash-merge only, auto-merge uses `--squash`).
- Escalation path and timeout: If blocked for more than one working day or after three no-progress review iterations, report the stall with remaining findings and wait for human guidance.

## Open Questions

- None outstanding. Scroll lock and click-on-dim behaviors were defaulted as recorded in the proposal.
