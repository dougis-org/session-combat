## GitHub Issues

- #695

## Why

- Problem statement: `lib/components/CombatantCard.tsx` shows a passive `⚡ N/M` legendary-action badge but provides no way to act on it. It also carries dead imports of `LegendaryActionsPanel` and `LairActionsSlot` that are never rendered. The spend/restore controls already exist — `LegendaryActionsPanel` is mounted inside `lib/components/CombatantDetailPanel.tsx`, and `LairActionsSlot` is rendered as its own initiative-order entry in `lib/components/ActiveCombatView.tsx` for `type === 'lair'` combatants — but a DM looking at the card has no visible affordance pointing to them.
- Why now: Issue #695 was split from #680 (decompose `CombatantCard`). The exploration for #695 established that the legendary/lair UX is already implemented and coherent; the real gap is discoverability, not missing functionality. `CombatantCard` already accepts an `onShowDetails?: (combatantId, position) => void` prop that `ActiveCombatView` wires to open `CombatantDetailPanel` (used today by the combatant-name button at `CombatantCard.tsx:483-486`), so this change is a few lines: apply that same pattern to the badge. It is independent of the #680 decomposition and removes the misleading dead imports.
- Business/user impact: DMs running legendary creatures can reach spend/restore controls in one click from the card instead of hunting for the detail panel. Removing dead imports reduces confusion for future contributors and shrinks the surface #680 must reason about.

## Problem Space

- Current behavior:
  - `CombatantCard.tsx:551-558` renders a non-interactive `<span data-testid="legendary-action-badge">` when `combatant.legendaryActionCount > 0`.
  - `CombatantCard.tsx:8-9` imports `LegendaryActionsPanel` and `LairActionsSlot`; neither is referenced in the render tree.
  - `CombatantDetailPanel.tsx:95` renders `<LegendaryActionsPanel>` (full spend / restore / pool editor), wired via `onUpdate(combatant.id, updates)`.
  - `ActiveCombatView.tsx` owns the detail panel: it renders `<CombatantDetailPanel>` (`ActiveCombatView.tsx:393-400`) gated on `selectedDetailCombatantId` + `detailPosition` state, and renders `<CombatantCard>` (`ActiveCombatView.tsx:164`) per non-lair combatant in initiative order.
  - `CombatantCard` already declares `onShowDetails?: (combatantId: string, position: { top: number; left: number }) => void` (`CombatantCard.tsx:23`). `ActiveCombatView` passes it (`ActiveCombatView.tsx:173-176`) as `(id, pos) => { setSelectedDetailCombatantId(id); setDetailPosition(pos); }`. The combatant-name button (`CombatantCard.tsx:483-486`) already calls it with a `getBoundingClientRect()`-derived position.
- Desired behavior:
  - The legendary-action badge on the card becomes a `<button>` that calls the existing `onShowDetails(combatant.id, position)` — opening the same `CombatantDetailPanel` the name button opens.
  - No legendary/lair action UI is duplicated onto the card. No new props.
  - The dead `LegendaryActionsPanel` / `LairActionsSlot` imports are removed from `CombatantCard.tsx`.
- Constraints:
  - Project convention: prefer Serena/MCP tooling for edits; components are `'use client'` React with Tailwind; tests use RTL + `npm run test:unit` (there is no `npm test` script).
  - `CombatantCard` is already over the size limit (#680); this change must not grow it meaningfully — swapping a `<span>` for a `<button>` plus one new optional prop is acceptable, adding panels is not.
  - Reuse the existing `onShowDetails` prop — no new prop is threaded. `onShowDetails` is already optional and already wired in `ActiveCombatView`.
  - Keep `data-testid="legendary-action-badge"` stable so existing tests and any E2E hooks keep working; the element type changes from `span` to `button`.
  - Accessibility: the button needs an accessible name (e.g. `aria-label="Open {name} details — legendary actions"` or visible text equivalent) and must be keyboard-activatable.
- Assumptions:
  - `onShowDetails` semantics (open `CombatantDetailPanel` at a given position) are stable and appropriate to trigger from the badge.
  - The badge is the right entry point; lair-action creatures are handled by the dedicated lair slot and are out of scope for the card affordance.
  - No change to `CombatantState`, combat reducers, persistence, or `onUpdate` payloads.
- Edge cases considered:
  - Combatant has legendary actions defined but `legendaryActionCount` is 0 or undefined → badge is not rendered today; behavior unchanged (no button).
  - `onShowDetails` prop not provided (card used in a context without a detail panel, e.g. setup view, tests) → badge still renders as a button; clicking it is a safe no-op (`onShowDetails?.(...)`), matching how the existing name button behaves.
  - Rapid/repeat clicks → idempotent; opening an already-open panel for the same combatant is a no-op.
  - `CombatantDetailPanel` for a combatant that later dies or is removed while open → existing panel behavior, not affected by this change.
  - Keyboard / screen-reader users → button must be reachable via Tab and activate on Enter/Space.

## Scope

### In Scope

- Convert the legendary-action badge in `CombatantCard.tsx` from a `<span>` to a `<button type="button">` (keeping `data-testid="legendary-action-badge"`), styled to match the current appearance plus a hover/focus affordance.
- On badge click/keyboard activation, call the existing `onShowDetails(combatant.id, position)` with a `getBoundingClientRect()`-derived position (same pattern as the name button at `CombatantCard.tsx:483-486`).
- Give the button an accessible name via `aria-label`.
- Component tests: badge renders as a button, invokes `onShowDetails` with the combatant id on click and on keyboard (Enter/Space) activation, is a safe no-op when `onShowDetails` is omitted, still shows `N/M` text, and is absent when `legendaryActionCount` is 0/undefined.
- Remove the unused `LegendaryActionsPanel` / `LairActionsSlot` imports from `CombatantCard.tsx`.
- Update `.wolf/anatomy.md` / `.wolf/memory.md` per project protocol.

### Out of Scope

- Adding any new prop to `CombatantCard` or changing `ActiveCombatView` wiring (the `onShowDetails` prop already exists and is already passed).
- Rendering `LegendaryActionsPanel` or any legendary/lair action controls directly on the card.
- Changing `CombatantDetailPanel` layout, or scrolling/focusing it to the legendary section on open.
- The #680 `CombatantCard` decomposition (separate issue; this change is deliberately independent of it).
- Any change to lair-action UX, the lair slot, initiative-count-20 ordering, or `lib/utils/combat.ts`.
- Combat state, reducers, persistence, or `onUpdate` semantics.
- E2E test additions (component tests only).

## What Changes

- `lib/components/CombatantCard.tsx`: badge `<span>` → `<button type="button">` with `aria-label`, hover/focus affordance, and an `onClick` that calls the existing `onShowDetails`; removal of two dead imports.
- New/updated tests under `tests/unit/components/` for `CombatantCard` badge behavior.
- `openspec/specs/` delta for the affected capability (badge interaction becomes a behavioral requirement).
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
- Risk: Scope creep toward "also scroll the panel to the legendary section" or "also add a lair button".
  - Impact: Larger change, touches more files, invites the double-UI concern option C was chosen to avoid.
  - Mitigation: Hold the line at "open the panel"; capture anything more as a follow-up.

## Open Questions

- Question: When the panel opens from the badge, should it auto-scroll/focus to the Legendary Actions section, or is opening the panel sufficient for v1?
  - Needed from: requester (Doug)
  - Blocker for apply: no — default to "open only" unless told otherwise
- Question: Should the badge also be interactive for combatants with `lairActions` (no dedicated behavior today on the card), or strictly legendary-only?
  - Needed from: requester (Doug)
  - Blocker for apply: no — default to legendary-only per issue #695 option C

If none of the above are answered, the change proceeds with the stated defaults ("open only", legendary-only, reuse existing handler or extract a minimal one).

## Non-Goals

- Not building any new spend/restore/trigger controls.
- Not consolidating the legendary UX out of `CombatantDetailPanel`.
- Not addressing `CombatantCard` size / decomposition (#680).
- Not touching lair-action ordering or `lib/utils/combat.ts`.
- Not adding E2E coverage.

## Change Control

If scope changes after proposal approval, update `openspec/changes/legendary-badge-opens-detail/proposal.md`,
`openspec/changes/legendary-badge-opens-detail/design.md`,
`openspec/changes/legendary-badge-opens-detail/specs/**/*.md`, and
`openspec/changes/legendary-badge-opens-detail/tasks.md` before implementation starts.
