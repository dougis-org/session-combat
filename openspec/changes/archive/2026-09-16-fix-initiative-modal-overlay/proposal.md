## GitHub Issues

- #747

## Why

- Problem statement: The initiative-entry modal for a combatant is a click-to-open overlay. When combat starts (or is reloaded) with combatants that have no initiative set, nothing prompts the DM to set it — they must notice the unset "Initiative" readout and click it manually. Separately, when the modal does open, it is positioned off of the wrong anchor element and with a hardcoded width offset, so it frequently overflows the viewport or lands away from the combatant card it belongs to.
- Why now: Filed as a user-facing bug (#747) with screenshots showing the overlay detached from its card and overflowing. Un-set initiative is also the state every new combat starts in, so this is a first-impression bug.
- Business/user impact: DMs starting combat get an initiative list that looks broken (unsorted "0" entries) with no visual cue that action is needed, and when they do open the entry overlay it can render off-card or off-screen, making it hard to use, especially on narrower viewports.

## Problem Space

- Current behavior:
  - `ActiveCombatView` (`lib/components/ActiveCombatView.tsx`) holds `initiativeEditId` / `initiativeEditPosition`, both `null` on mount. Nothing sets them until the DM clicks the "Initiative" control in a card header (`CombatantCardHeader.tsx` `InitiativeControl`) or until `handleSetInitiative` auto-advances to the next unrolled combatant *after* a save.
  - The overlay's anchor position is computed from the "Initiative" button's `getBoundingClientRect()` (`CombatantCardHeader.tsx:146`, via `rectToPosition`), not from the combatant card's own bounding rect. That button sits at the far right of the card header (`ml-auto pr-4`).
  - The overlay's left offset is `Math.max(16, initiativeEditPosition.left - INITIATIVE_MODAL_WIDTH)`, where `INITIATIVE_MODAL_WIDTH` is a hardcoded `320` (`ActiveCombatView.tsx:84`). The overlay's actual rendered width is `w-80` (320px) *only* when its content doesn't wrap; on narrow viewports the mode buttons stack and the box can grow taller/differ from the assumed width, and on narrow cards `button.left - 320` goes negative and clamps to a fixed `16px`, snapping the modal to the screen's left edge instead of the card.
- Desired behavior:
  - When combat has one or more combatants with no initiative set, the entry modal opens automatically (without requiring a click) targeting the first such combatant, matching the existing auto-advance-after-save behavior but also firing on initial mount / whenever the "no initiative set" condition first becomes true.
  - The modal is always anchored to, and visually pinned within, the bounding rect of the target `CombatantCard` itself (per the existing spec requirement `openspec/specs/modal-initiative-entry/spec.md`: "pinned to the top-left corner of that specific card"), not the inner Initiative button, and never overflows the viewport.
- Constraints:
  - Must not change `InitiativeEntry`'s internal form behavior (roll/dice/total entry, advantage, flat bonus) — this is a positioning/triggering fix, not a redesign of the entry UI.
  - Must preserve the existing auto-advance-on-save behavior (`handleSetInitiative`) and the "click outside closes" / Escape-to-close behavior already specced.
  - Must not break the existing DM-initiated open-by-click flow for combatants that already have an initiative (re-editing).
- Assumptions:
  - "Auto-open on unset initiative" should not re-open a modal the DM just closed for a combatant they intend to leave at 0 — closing behavior for that case needs an explicit answer (see Open Questions).
  - The combatant card container already exposes a stable DOM hook (`[data-combatant-id="..."]`) usable as the anchor rect; confirmed present in `ActiveCombatView.tsx:143` selector usage.
- Edge cases considered:
  - No combatants at all, or all combatants already have initiative set (no auto-open).
  - A combatant is removed while it is the auto-opened target (existing spec already requires graceful recovery from a missing DOM node).
  - Viewport is narrow (mobile width) — anchor and clamp math must keep the modal fully on-screen without relying on a hardcoded pixel width.
  - Multiple combatants with unset initiative simultaneously (e.g., combat just started) — only one modal should auto-open at a time, following existing sequential auto-advance ordering.

### In Scope

- Auto-opening the initiative modal for the first unrolled combatant when the combat view detects at least one combatant with no initiative set, firing on initial mount and again whenever a newly added combatant has unset initiative (e.g. via "+ Add Enemy"/"+ Add Party Member"), reusing/extending the existing `handleSetInitiative` auto-advance targeting logic.
- Once the DM manually dismisses the auto-opened modal for a given combatant (X / Escape / click-outside), that combatant is not auto-reopened again this session even though its initiative remains unset; the DM can still open it manually via the Initiative control. A combatant becomes eligible for auto-open again only the first time it is newly detected as unrolled (i.e., new combatants, not previously-dismissed ones).
- Re-anchoring the modal's position calculation to the target `CombatantCard`'s own bounding rect instead of the inner Initiative button's rect.
- Removing the hardcoded `INITIATIVE_MODAL_WIDTH` left-offset math and replacing it with viewport-aware positioning that keeps the modal fully within the visible viewport and visually associated with its card.
- Visual cue on the combatant card itself: when a combatant's initiative is unset, the Initiative readout (`CombatantCardHeader.tsx` `InitiativeControl`) shows "N/A" instead of "0", styled in a red/warning color, so unset initiative is visible even without the modal open (e.g. after a DM dismisses the auto-opened modal).
- Updating/adding tests covering: initial auto-open, mid-combat auto-open for newly added combatants, dismiss-then-no-reopen behavior, the "N/A" red readout, viewport-boundary clamping, and anchor-to-card behavior.

### Out of Scope

- Redesigning `InitiativeEntry`'s internal form (roll/dice/total modes, advantage, flat bonus UI).
- Changing the unified combatant list sort order (already specced/implemented separately).
- Any change to how initiative values are computed or persisted.

## What Changes

- `ActiveCombatView.tsx`: add logic (effect or derived state) that auto-opens the initiative modal for the first unrolled combatant (`!combatant.initiativeRoll`) whenever such a combatant is newly detected (mount, or a newly added combatant) and hasn't already been dismissed by the DM; track dismissed-combatant IDs so a manual close doesn't immediately reopen. Drop `INITIATIVE_MODAL_WIDTH`/left-offset subtraction in favor of card-anchored, viewport-clamped positioning.
- `CombatantCardHeader.tsx` and/or `ActiveCombatView.tsx`: change the anchor rect source from the Initiative button to the combatant card's own element (`[data-combatant-id]`) so `top`/`left` are derived from the card, not the button.
- `CombatantCardHeader.tsx` (`InitiativeControl`): when `!combatant.initiativeRoll`, render "N/A" in place of the numeric `0` and apply a red/warning text style; once `initiativeRoll` is set, render the numeric total as today.
- Add/adjust tests in `tests/unit/combat/` and `tests/unit/components/` for the new auto-open trigger, dismiss-then-stay-closed behavior, the "N/A" red readout, and the revised anchoring/clamping math.

## Risks

- Risk: Auto-opening on mount and on new-combatant-add could surprise DMs who intentionally leave some combatants (e.g., lair actions or delayed joiners) without initiative.
  - Impact: Modal repeatedly reopens or blocks interaction with the list.
  - Mitigation: Auto-open fires once per combatant the first time it's detected unrolled; dismissing it (X / Escape / click-outside) marks that combatant as dismissed for the rest of the session so it won't auto-reopen, while the DM can still open it manually via the Initiative control (now visually flagged red/"N/A").
- Risk: Switching the anchor from the button to the card could shift the modal's on-card position in a way that conflicts with existing spec wording ("pinned to the top-left corner of that specific card") if interpreted literally against current visual design.
  - Impact: Visual regression versus current click-triggered placement near the Initiative control.
  - Mitigation: Follow the existing spec text literally (top-left of card) since it already documents the intended design distinct from current behavior; validate with screenshots before merging.
- Risk: Distinguishing "unset" from "legitimately rolled a total of 0" purely by the numeric `initiative` field would misfire (a rolled total of 0 is possible with negative bonuses).
  - Impact: A combatant who rolled 0 could be wrongly flagged "N/A"/red, or vice versa.
  - Mitigation: Use presence of `combatant.initiativeRoll` (already the existing "unrolled" signal used by `sortCombatants`/auto-advance) as the unset condition, not the numeric value.

## Open Questions

None — both prior open questions were resolved by the requester:
- Dismissing the auto-opened modal for a combatant marks it as not-to-be-auto-reopened for the rest of the session (manual open via the Initiative control remains available); the card's Initiative readout also shows "N/A" in red instead of "0" while unset, so the unresolved state stays visible after dismissal.
- Auto-open fires both on initial mount and whenever a new combatant with unset initiative is added mid-combat.

## Non-Goals

- No changes to initiative calculation, advantage/flat-bonus semantics, or the combatant list sort order.
- No visual redesign of the `InitiativeEntry` form contents beyond what's needed for correct anchoring/clamping.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
