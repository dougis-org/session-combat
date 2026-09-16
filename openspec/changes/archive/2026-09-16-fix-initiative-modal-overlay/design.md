## Context

- Relevant architecture: `ActiveCombatView.tsx` owns `initiativeEditId` / `initiativeEditPosition` local state and renders the `InitiativeEntry` overlay as an absolutely-positioned `<div>` (lines ~282-302). `CombatantCardHeader.tsx`'s `InitiativeControl` renders the per-card "Initiative" readout/button and is the current trigger + anchor source (`onSetInitiative` callback, `rectToPosition(e.currentTarget.getBoundingClientRect())`). Each rendered `CombatantCard` root carries `data-combatant-id="<id>"` (already used by the existing post-save auto-advance `querySelector`). `sortCombatants` (`lib/utils/combat.ts`) already treats `!combatant.initiativeRoll` as the canonical "unrolled" signal, independent of the numeric `initiative` field.
- Dependencies: no new packages. Uses existing `rectToPosition` helper, existing `combatState.combatants` data, existing `InitiativeEntry` component (unchanged).
- Interfaces/contracts touched: `ActiveCombatView.tsx` (state + effect + render), `CombatantCardHeader.tsx` (`InitiativeControl` readout + anchor rect source). No API/schema changes.

## Goals / Non-Goals

### Goals

- Modal auto-opens for the first unrolled combatant on mount and whenever a newly added combatant is unrolled, without requiring a click.
- A DM-dismissed auto-opened modal does not reopen itself again for that same combatant.
- The modal is anchored to and stays visually pinned to its target `CombatantCard`, never overflowing the viewport, without relying on a hardcoded pixel width.
- Combatants with unset initiative are visually flagged ("N/A", red) on the card itself so the state is legible even when no modal is open.

### Non-Goals

- No change to `InitiativeEntry`'s internal form logic, roll computation, or persistence.
- No change to combatant list sort order.
- No redesign of the modal's visual chrome beyond positioning/clamping.

## Decisions

### Decision 1: Auto-open via a derived "eligible target" effect, gated by a per-session dismissed-set

- Chosen: Add `dismissedInitiativeIds` as a `Set<string>` held in a `useRef` (mutated in place, not driving re-renders by itself) inside `ActiveCombatView`. Add a `useEffect` keyed on a stable signature of unrolled combatant ids (e.g. `combatState.combatants.filter(c => !c.initiativeRoll).map(c => c.id).join(',')`) plus `initiativeEditId`. When no modal is currently open (`initiativeEditId === null`) and there exists an unrolled combatant whose id is not in `dismissedInitiativeIds`, auto-target the first such combatant (by the same `sortCombatants` ordering used elsewhere) using the card-anchored positioning from Decision 2.
  - On manual dismiss (`onClose`, click-outside, Escape), add the currently-open combatant's id to `dismissedInitiativeIds` before clearing `initiativeEditId`, but only when that close was *not* the result of a successful save (a save transitions the combatant to rolled, so it naturally drops out of the "unrolled" set and never needs dismissal tracking).
  - The existing post-save auto-advance in `handleSetInitiative` is left as-is and does **not** consult `dismissedInitiativeIds` — the DM is already mid-workflow in an open modal, so continuing to the next unrolled combatant is a continuation of their action, not a surprise reopen. Only the passive mount/new-combatant trigger respects dismissal.
- Alternatives considered:
  - Track dismissal in `combatState`/persisted storage: rejected — this is a per-DM-session UI affordance, not combat data; persisting it would leak into shared combat state other clients read.
  - Re-show the modal on every render for any unrolled combatant (no dismissal tracking): rejected per requester's explicit answer — feels un-dismissable.
- Rationale: Keeps the "unrolled" signal single-sourced (`!initiativeRoll`, already used by sort/auto-advance) and avoids adding a new persisted field to `CombatantState`.
- Trade-offs: `dismissedInitiativeIds` resets on full page reload (new `ActiveCombatView` mount), so a refreshed DM will see the modal auto-open again for previously-dismissed combatants. This matches "stay closed until reload/re-nav" from the requester's answer, not indefinite suppression.

### Decision 2: Card-anchored, measure-then-clamp positioning (replace hardcoded `INITIATIVE_MODAL_WIDTH`)

- Chosen: Change the anchor rect source from the Initiative button to the target `CombatantCard`'s own root element: `document.querySelector('[data-combatant-id="<id>"]')`, using its `getBoundingClientRect()` via the existing `rectToPosition` helper for the initial `{top, left}` (top-left corner of the card, per the existing spec text). Render the modal with that initial position, then in a `useLayoutEffect` keyed on `initiativeEditId`, measure the rendered modal's own `getBoundingClientRect()` via a `ref` and clamp `left`/`top` so the box never exceeds `window.innerWidth`/`window.innerHeight` (accounting for `window.scrollX/scrollY`), nudging left/up by the overflow amount with a `16px` minimum margin — mirroring the clamp already used for `RemoveConfirmPopup`. Drop the `INITIATIVE_MODAL_WIDTH` constant and the `left - INITIATIVE_MODAL_WIDTH` subtraction entirely.
- Alternatives considered:
  - Keep a hardcoded width but correct its value: rejected — any hardcoded width breaks again the moment content wraps (e.g. long combatant names, narrow viewports triggering the stacked mobile button layout in `InitiativeEntry`).
  - `position: fixed` relative to viewport only (no scroll offsets): rejected — the combatant list can be taller than the viewport and scrolls; a `fixed` modal would detach from its card as the page scrolls, whereas `absolute` + scroll-aware coordinates (already the pattern for `RemoveConfirmPopup`/`CombatantDetailPanel`) keeps it pinned to the card through scrolling.
- Rationale: Anchoring to the card (not the inner button) satisfies the existing spec's literal "pinned to the top-left corner of that specific card" requirement; measuring the actual rendered box before finalizing position removes the root cause of the overflow (an assumed width that doesn't match reality).
- Trade-offs: Adds one extra layout pass (`useLayoutEffect` + a brief clamp adjustment) per open/reposition; this is synchronous and runs before paint, so no visible flicker, consistent with existing React positioning patterns in this codebase.

### Decision 3: "N/A" / red readout driven by `!combatant.initiativeRoll`, not the numeric value

- Chosen: In `InitiativeControl` (`CombatantCardHeader.tsx`), render `combatant.initiativeRoll ? combatant.initiative : 'N/A'` for the numeric readout, and apply a red/warning text class (e.g. Tailwind `text-red-400`) conditioned on the same `!combatant.initiativeRoll` check, replacing the current unconditional `text-lg font-bold` styling for that state only.
- Alternatives considered:
  - Key the "N/A" display off `combatant.initiative === 0`: rejected — a legitimately rolled/entered total of `0` (e.g. large negative Dex/flat-bonus) is possible and must still display as a real value, not "N/A".
- Rationale: Reuses the exact boolean already treated as ground truth for "unrolled" elsewhere in the codebase (`sortCombatants`, auto-advance), keeping one definition of "unset."
- Trade-offs: None significant; purely additive conditional styling.

## Proposal to Design Mapping

- Proposal element: Auto-open modal for first unrolled combatant on mount and on new unrolled combatants
  - Design decision: Decision 1
  - Validation approach: Unit test mounting `ActiveCombatView` with combatants that have `initiativeRoll` unset asserts the modal renders targeting the correct combatant without any click; a follow-up test adds a combatant mid-render (simulating "+ Add Enemy") and asserts auto-open fires again.
- Proposal element: Dismissed auto-opened modal does not reopen for that combatant
  - Design decision: Decision 1 (`dismissedInitiativeIds`)
  - Validation approach: Unit test opens (auto), closes via `onClose`, then re-renders/updates unrelated state and asserts the modal does not reappear for that same combatant id while it remains unrolled.
- Proposal element: Modal anchored to card, not button; no overflow
  - Design decision: Decision 2
  - Validation approach: Unit test with a mocked narrow `window.innerWidth` and a card positioned near the right edge asserts the resulting `top`/`left` style keeps the modal's measured bounding box within `[16, innerWidth-16]` / `[16, innerHeight-16]`.
- Proposal element: "N/A" red readout for unset initiative
  - Design decision: Decision 3
  - Validation approach: Component test renders `CombatantCardHeader`/`InitiativeControl` with `initiativeRoll` undefined and asserts text content "N/A" and the red class; a second case with `initiativeRoll` set asserts the numeric value and default styling.

## Functional Requirements Mapping

- Requirement: Modal auto-opens without a click when initiative is unset
  - Design element: Decision 1 effect
  - Acceptance criteria reference: specs/modal-initiative-entry (to be added: auto-open scenarios)
  - Testability notes: Deterministic via `combatState.combatants` fixture with `initiativeRoll: undefined`; no timers/animation involved.
- Requirement: Dismissed modal stays closed for that combatant this session
  - Design element: Decision 1 `dismissedInitiativeIds`
  - Acceptance criteria reference: specs/modal-initiative-entry (dismiss-then-no-reopen scenario)
  - Testability notes: Assert via re-render after simulated `onClose`; no persistence/storage involved so no mocking needed.
- Requirement: Modal stays anchored to and inside the bounds of its card
  - Design element: Decision 2
  - Acceptance criteria reference: specs/modal-initiative-entry (anchor-to-card, viewport-clamp scenarios)
  - Testability notes: Requires mocking `getBoundingClientRect` for both the card and the modal ref; existing tests already mock `getBoundingClientRect` for similar popovers (`RemoveConfirmPopup`) as precedent.
- Requirement: Unset initiative is visually distinguishable on the card
  - Design element: Decision 3
  - Acceptance criteria reference: specs/modal-initiative-entry (N/A readout scenario)
  - Testability notes: Pure prop-driven rendering; straightforward RTL assertion.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Auto-advance/auto-open must not cause visible layout jumps in the main combatant list (existing NFAC in `openspec/specs/modal-initiative-entry/spec.md`).
  - Design element: Decision 2 (absolute positioning stays outside document flow; measure-then-clamp happens before paint via `useLayoutEffect`).
  - Acceptance criteria reference: existing spec's "UI Layout Jumps" scenario, unchanged by this design.
  - Testability notes: No new automated coverage proposed beyond existing; visually verified via manual QA per proposal risk mitigation.
- Requirement category: reliability
  - Requirement: Graceful handling if the anchor combatant/card no longer exists in the DOM (existing NFAC).
  - Design element: Decision 2 — if `document.querySelector('[data-combatant-id="<id>"]')` returns `null` (e.g. combatant removed mid-render), fall back to `null` position, which the existing render guard (`initiativeEditId && initiativeEditPosition`) already treats as "don't render."
  - Acceptance criteria reference: existing spec's "Recovery behavior from missing DOM node" scenario.
  - Testability notes: Unit test removes the target combatant from `combatState.combatants` between renders and asserts the modal unmounts without throwing.

## Risks / Trade-offs

- Risk/trade-off: `useLayoutEffect`-based measure-then-clamp adds a second positioning pass.
  - Impact: Negligible — synchronous, pre-paint, same pattern already used implicitly by other absolutely-positioned popovers in this view.
  - Mitigation: None needed beyond standard React testing (RTL doesn't require special handling for `useLayoutEffect`).
- Risk/trade-off: Auto-open on "newly added combatant" could fire immediately after "+ Add Enemy"/"+ Add Party Member" while the DM is still interacting with that modal's form, feeling abrupt.
  - Impact: Minor UX friction — modal snaps to the new combatant right after add.
  - Mitigation: Matches the requester's explicit decision (mount + new unrolled combatants); the dismiss-and-stay-closed behavior (Decision 1) gives the DM an easy, permanent-for-session escape hatch if unwanted.

## Rollback / Mitigation

- Rollback trigger: Auto-open/anchoring changes cause a regression in existing initiative-entry or combat-view tests, or a user-reported regression (e.g. modal auto-opening in an unwanted context, readout misreading rolled `0` as "N/A").
- Rollback steps: Revert the `ActiveCombatView.tsx` and `CombatantCardHeader.tsx` changes for this proposal (single, self-contained diff — no data migrations involved); no persisted/schema state introduced by this change to unwind.
- Data migration considerations: None — all state introduced (`dismissedInitiativeIds`) is transient, in-memory, component-local.
- Verification after rollback: Re-run `tests/unit/combat/initiativeEntry.test.tsx`, `tests/unit/components/InitiativeEntry.test.tsx`, and the `ActiveCombatView` test suite to confirm prior click-to-open behavior is restored.

## Operational Blocking Policy

- If CI checks fail: Fix the failing unit/component tests before requesting review; do not merge with red CI.
- If security checks fail: Not expected to trigger any (no new data flows, API calls, or external input handling introduced); if Verity/security gate flags something, investigate before waiving — no waiver is pre-authorized by this design.
- If required reviews are blocked/stale: Follow standard repo PR review process; no special exception for this change.
- Escalation path and timeout: Standard project PR review cadence; no proposal-specific SLA.

## Open Questions

None. All ambiguity from the proposal (dismiss behavior, auto-open trigger scope) was resolved by the requester before this design was written.
