## GitHub Issues

- #695

## Why

- Problem statement: `lib/components/CombatantCard.tsx` shows a passive `⚡ N/M` legendary-action badge but provides no way to act on it. It also carries dead imports of `LegendaryActionsPanel` and `LairActionsSlot` that are never rendered. The spend/restore controls already exist — `LegendaryActionsPanel` is mounted inside `lib/components/CombatantDetailPanel.tsx`, and `LairActionsSlot` is rendered as its own initiative-order entry in `lib/components/ActiveCombatView.tsx` for `type === 'lair'` combatants — but a DM looking at the card has no visible affordance pointing to them.
- Why now: Issue #695 was split from #680 (decompose `CombatantCard`). The exploration for #695 established that the legendary/lair UX is already implemented and coherent; the real gap is discoverability, not missing functionality. `CombatantCard` already accepts an `onShowDetails?: (combatantId, position) => void` prop that `ActiveCombatView` wires to open `CombatantDetailPanel` (used today by the combatant-name button at `CombatantCard.tsx:483-486`); this change makes the badge a button that triggers it, and — per the requester's decision — has the panel scroll and move focus to the Legendary Actions section when opened that way. It is independent of the #680 decomposition and removes the misleading dead imports.
- Business/user impact: DMs running legendary creatures can go from the row badge straight to the spend/restore/pool controls — panel open, scrolled, focused — in one action, instead of opening the panel and hunting for the section. Removing dead imports reduces confusion for future contributors and shrinks the surface #680 must reason about.

## Problem Space

- Current behavior:
  - `CombatantCard.tsx:551-558` renders a non-interactive `<span data-testid="legendary-action-badge">` when `combatant.legendaryActionCount > 0`.
  - `CombatantCard.tsx:8-9` imports `LegendaryActionsPanel` and `LairActionsSlot`; neither is referenced in the render tree.
  - `CombatantDetailPanel.tsx:95` renders `<LegendaryActionsPanel>` (full spend / restore / pool editor), wired via `onUpdate(combatant.id, updates)`.
  - `ActiveCombatView.tsx` owns the detail panel: it renders `<CombatantDetailPanel>` (`ActiveCombatView.tsx:393-400`) gated on `selectedDetailCombatantId` + `detailPosition` state, and renders `<CombatantCard>` (`ActiveCombatView.tsx:164`) per non-lair combatant in initiative order.
  - `CombatantCard` already declares `onShowDetails?: (combatantId: string, position: { top: number; left: number }) => void` (`CombatantCard.tsx:23`). `ActiveCombatView` passes it (`ActiveCombatView.tsx:173-176`) as `(id, pos) => { setSelectedDetailCombatantId(id); setDetailPosition(pos); }`. The combatant-name button (`CombatantCard.tsx:483-486`) already calls it with a `getBoundingClientRect()`-derived position.
  - `CombatantDetailPanel` (`CombatantDetailPanel.tsx`) is a single scroll container (`max-h-[85vh] overflow-y-auto`). `<LegendaryActionsPanel>` renders at `CombatantDetailPanel.tsx:95` as a bare `<div>` with no id/ref/anchor. The panel has no notion of "open focused on a section".
- Desired behavior:
  - The legendary-action badge on the card becomes a `<button>` that opens the same `CombatantDetailPanel` the name button opens, **and** requests that the panel scroll the Legendary Actions section into view and move keyboard focus to it.
  - The combatant-name button's behavior is unchanged (opens the panel at the top, no forced scroll/focus).
  - No legendary/lair action UI is duplicated onto the card.
  - The dead `LegendaryActionsPanel` / `LairActionsSlot` imports are removed from `CombatantCard.tsx`.
- Constraints:
  - Project convention: prefer Serena/MCP tooling for edits; components are `'use client'` React with Tailwind; tests use RTL + `npm run test:unit` (there is no `npm test` script).
  - `CombatantCard` is already over the size limit (#680); this change must not grow it meaningfully — swap `<span>` → `<button>` plus one optional-argument widening of the existing `onShowDetails` callback; no panels added to the card.
  - The `onShowDetails` signature is widened additively only: an optional third argument `options?: { focusSection?: 'legendary' }`. Existing callers (the name button, all current tests) keep working untouched.
  - Keep `data-testid="legendary-action-badge"` stable; the element type changes from `span` to `button`.
  - `CombatantDetailPanel` must not depend on a specific `LegendaryActionsPanel` internal DOM structure — the scroll anchor is added at the point of composition (a wrapper `<div ref>` / `id` in `CombatantDetailPanel`), not inside `LegendaryActionsPanel`.
  - jsdom does not implement `Element.prototype.scrollIntoView` — tests must mock it; production code must guard the call.
  - Accessibility: the button needs an accessible name and keyboard activation; the "focus the section" behavior must land focus on a real focusable target (first control in the section, or the section container with `tabIndex={-1}`), not merely scroll.
- Assumptions:
  - `onShowDetails` remains the single entry point for opening the panel; adding an options arg is acceptable to the requester.
  - The badge is the right entry point; lair-action creatures are handled by the dedicated lair slot and remain out of scope for the card affordance (**legendary-only**, per requester).
  - No change to `CombatantState`, combat reducers, persistence, or `onUpdate` payloads.
  - A combatant showing the badge (`legendaryActionCount > 0`) always renders `<LegendaryActionsPanel>` non-null in the detail panel, so a scroll target will exist. (`LegendaryActionsPanel` returns null only when `legendaryActions` is empty; the badge condition is `legendaryActionCount > 0`. Edge case handled below.)
- Edge cases considered:
  - Combatant has legendary actions defined but `legendaryActionCount` is 0 or undefined → badge is not rendered today; behavior unchanged (no button).
  - `legendaryActionCount > 0` but `legendaryActions` array is empty → badge renders, but `LegendaryActionsPanel` returns null so there is no scroll target → panel opens at top, no scroll/focus, no error (guard on a missing ref).
  - `onShowDetails` prop not provided (card used without a detail panel, e.g. setup view, tests) → badge still renders as a button; activating it is a safe no-op (`onShowDetails?.(...)`), matching the name button.
  - Panel already open for the same combatant when the badge is clicked → re-issue the scroll/focus request (React effect keyed on combatant id + a request nonce or the `focusSection` value) so the section is re-focused.
  - Rapid/repeat clicks → idempotent; scroll target is stable.
  - `CombatantDetailPanel` for a combatant that dies/is removed while open → existing panel behavior, not affected.
  - Reduced-motion users → use `scrollIntoView({ block: 'nearest' })` without smooth behavior, or respect `prefers-reduced-motion`; instant scroll is acceptable and simplest.
  - Keyboard / screen-reader users → button reachable via Tab, activates on Enter/Space; after activation focus moves into the panel's legendary section so the next Tab is within the controls.

## Scope

### In Scope

- Convert the legendary-action badge in `CombatantCard.tsx` from a `<span>` to a `<button type="button">` (keeping `data-testid="legendary-action-badge"`), styled to match the current appearance plus a hover/focus affordance, with an `aria-label`.
- On badge click/keyboard activation, call `onShowDetails(combatant.id, position, { focusSection: 'legendary' })` with a `getBoundingClientRect()`-derived position (same position pattern as the name button at `CombatantCard.tsx:483-486`).
- Widen the `onShowDetails` prop type on `CombatantCard` additively: optional third arg `options?: { focusSection?: 'legendary' }`.
- `ActiveCombatView.tsx`: track a `detailFocusSection` state (set from the `onShowDetails` options, cleared on close) and pass it to `<CombatantDetailPanel>`.
- `CombatantDetailPanel.tsx`: accept an optional `focusSection?: 'legendary'` prop; wrap `<LegendaryActionsPanel>` in an anchor element (ref or `id`); on mount / when the request changes, if `focusSection === 'legendary'` and the anchor exists, `scrollIntoView` it (guarded) and move focus into the section (first control, or the container via `tabIndex={-1}`).
- Component tests for the badge (`CombatantCard`), the scroll/focus behavior (`CombatantDetailPanel`), and the wiring (`ActiveCombatView` integration).
- Remove the unused `LegendaryActionsPanel` / `LairActionsSlot` imports from `CombatantCard.tsx`.
- Update `.wolf/anatomy.md` / `.wolf/memory.md` per project protocol.

### Out of Scope

- Rendering `LegendaryActionsPanel` or any legendary/lair action controls directly on the card.
- Any redesign of `CombatantDetailPanel` beyond adding the section anchor + scroll/focus-on-request behavior (no restructuring of its sections, no new sections, no styling overhaul).
- Making the badge interactive for lair-only combatants, or any lair-action affordance on the card (**legendary-only**, per requester). Lair actions keep their dedicated initiative slot.
- Editing `LegendaryActionsPanel.tsx` internals (the anchor is added at the composition point in `CombatantDetailPanel`).
- The #680 `CombatantCard` decomposition.
- Any change to lair-action UX, the lair slot, initiative-count-20 ordering, or `lib/utils/combat.ts`.
- Combat state, reducers, persistence, or `onUpdate` semantics.
- New E2E specs (existing `combat.spec.ts` legendary specs must stay green; component tests only for new behavior).

## What Changes

- `lib/components/CombatantCard.tsx`: badge `<span>` → `<button type="button">` with `aria-label` + hover/focus affordance; `onClick` calls `onShowDetails(id, position, { focusSection: 'legendary' })`; `onShowDetails` prop type widened with an optional third arg; two dead imports removed.
- `lib/components/ActiveCombatView.tsx`: new `detailFocusSection` state, set from the `onShowDetails` options and cleared alongside `selectedDetailCombatantId` on close; passed to `<CombatantDetailPanel focusSection={...}>`.
- `lib/components/CombatantDetailPanel.tsx`: new optional `focusSection` prop; anchor around `<LegendaryActionsPanel>`; effect that scrolls + focuses the legendary section on request (guarded for missing anchor / no `scrollIntoView`).
- New/updated tests under `tests/unit/components/` for all three.
- `openspec/specs/legendary-action-tracking/` delta (badge is interactive; opening from the badge scrolls + focuses the legendary section).
- `.wolf/anatomy.md`, `.wolf/memory.md` housekeeping updates.

## Risks

- Risk: Existing `CombatantCard` tests assert the badge is a `span` or assert on its exact text/markup.
  - Impact: Test failures on an otherwise-correct change.
  - Mitigation: Audit `tests/unit/components/CombatantCard*.test.tsx` for `legendary-action-badge` assertions before editing; update them to expect a button while preserving the `N/M` text assertion.
- Risk: The `onShowDetails` position argument expects viewport coordinates; a badge rect may place the panel awkwardly relative to where the name-button rect would.
  - Impact: Minor — panel opens slightly offset.
  - Mitigation: Use the same `{ top: rect.bottom, left: rect.left }` shape as the name button; accept minor offset, adjust only if visibly wrong in designqc.
- Risk: Changing `span` → `button` inside a flex row alters layout/spacing (default button styling, padding).
  - Impact: Minor visual regression on the card header.
  - Mitigation: Apply `type="button"` plus reset Tailwind classes (`bg-transparent p-0 border-0` as needed) to match current appearance; verify with `openwolf designqc` or a screenshot.
- Risk: Making the badge interactive without a hover/focus cue leaves it non-obvious that it is clickable.
  - Impact: Discoverability improvement is muted.
  - Mitigation: Add a subtle affordance (cursor-pointer, hover/focus ring, `title`) consistent with other clickable elements on the card (e.g. the initiative button at `CombatantCard.tsx:624`).
- Risk: Auto-scroll/focus expands the blast radius to `CombatantDetailPanel` and `ActiveCombatView` — three files instead of one.
  - Impact: More surface to test and review; small risk of regressing the existing name-button open path.
  - Mitigation: Keep the new behavior strictly opt-in (`focusSection` undefined ⇒ byte-identical behavior to today); cover the name-button path with a regression test; keep the anchor at the composition point so `LegendaryActionsPanel` is untouched.
- Risk: `scrollIntoView` / focus management behaves differently across browsers and is unimplemented in jsdom.
  - Impact: Flaky or failing tests; possible no-op in some environments.
  - Mitigation: Guard the call (`anchor?.scrollIntoView?.()`); mock it in tests; assert on focus target and that the guarded call was invoked, not on actual scroll position.
- Risk: Moving focus into the panel on open could disorient users who opened it via the name button.
  - Impact: Unexpected focus jump.
  - Mitigation: Focus move happens only when `focusSection` is set (badge path), never on the name-button path.

## Open Questions

Both questions from the explore session are now resolved by the requester:

- Resolved: When opened from the badge, the panel **auto-scrolls and moves focus** to the Legendary Actions section. (Reversed from the earlier "open only" default.) This is now in scope and reflected throughout this proposal, `design.md`, `specs/`, `tasks.md`, and `tests.md`.
- Resolved: The badge is interactive for **legendary combatants only**. Lair-only combatants get no card affordance; their dedicated initiative slot is unchanged.

No unresolved ambiguity remains. None of the resolved items block apply.

## Non-Goals

- Not building any new spend/restore/trigger controls.
- Not consolidating the legendary UX out of `CombatantDetailPanel`.
- Not adding a lair-action affordance to the card or making the badge interactive for lair-only combatants.
- Not restructuring `CombatantDetailPanel`'s sections or adding a generic "deep link to any section" mechanism — only `focusSection: 'legendary'` is supported.
- Not addressing `CombatantCard` size / decomposition (#680).
- Not touching lair-action ordering or `lib/utils/combat.ts`.
- Not adding E2E coverage.

## Change Control

If scope changes after proposal approval, update `openspec/changes/legendary-badge-opens-detail/proposal.md`,
`openspec/changes/legendary-badge-opens-detail/design.md`,
`openspec/changes/legendary-badge-opens-detail/specs/**/*.md`, and
`openspec/changes/legendary-badge-opens-detail/tasks.md` before implementation starts.
