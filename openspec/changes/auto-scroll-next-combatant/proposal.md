## GitHub Issues

- dougis-org/session-combat#754

## Why

- Problem statement: When the DM clicks "Current Turn (done)" during combat, the view stays scrolled wherever it was. In a long initiative order the newly-active combatant's card can be off-screen, forcing the DM to manually hunt for it every single turn.
- Why now: Reported directly by the primary user (issue #754) as a recurring friction point during live sessions.
- Business/user impact: Faster, lower-friction turn handoff for the DM running combat — the person most time-pressured at the table.

## Problem Space

- Current behavior: `ActiveCombatView` renders the initiative order as a list of `CombatantCard`s. Clicking "Current Turn (done)" (`CombatantCardHeader.tsx`) calls `onNextTurn` → `nextTurn()` from `useCombat`, which advances `combatState.currentTurnIndex`. No scroll behavior is attached to this action.
- Desired behavior: After `nextTurn()` resolves, the view smoothly scrolls so the newly-active combatant's full card is visible, without the DM needing to scroll manually. This is a per-user preference, defaulted on.
- Constraints:
  - Must reuse the existing offline-first preference pipeline (`lib/preferences/schema.ts` → `usePreferences.tsx` → `app/api/me/preferences/route.ts` → `userPreferencesRepo.ts`) rather than inventing a parallel mechanism.
  - Must reuse the existing `data-combatant-id` DOM attribute already present on each card (no new data attributes needed for targeting).
  - Must not assume "next" means "the next DOM sibling" — turn advancement already skips downed (hp <= 0) combatants and wraps rounds, so the next active combatant can be anywhere in the list, including earlier than the current one.
- Assumptions:
  - "Full card" visibility means the entire card element should end up within the viewport after the scroll (not just its top edge), matching the requester's explicit preference.
  - The existing `/profile` preferences screen is the correct and sufficient place to surface this toggle; no new settings surface is needed.
- Edge cases considered:
  - Round wrap (last combatant finishes their turn, turn order returns to the first entry, possibly not index 0 if that combatant is downed).
  - Lair action slots and downed/dead combatants interleaved in the list, which the traversal already skips over.
  - Combatant removed or a new one added between renders, changing indices without a "done" click (must not trigger a scroll).
  - Preference not yet loaded / preferences API unreachable (must default to current "on" behavior via the existing offline-first fallback, not silently disable scrolling nor throw).

## Scope

### In Scope

- Scroll-on-turn-advance behavior triggered exclusively by the "Current Turn (done)" click handler in `ActiveCombatView.tsx`.
- New `combat.autoScrollToNextCombatant: boolean` preference (default `true`), added to the existing typed preference schema and its full read/write pipeline (client provider, API route, Mongo repo).
- A new toggle control on the `/profile` preferences screen, following the existing `dice.*`/`chat.*` toggle pattern.

### Out of Scope

- Any change to turn-advancement logic itself (`nextTurn`, downed-combatant skip, round wrap) — this change only observes the result, it does not alter selection.
- Scrolling behavior for `restartRound`, combatant add/remove, or any other cause of `activeCombatantId` changing.
- A general-purpose settings/preferences page redesign.
- Mobile-specific scroll tuning beyond using an existing responsive `scrollIntoView` alignment (`block`) option.

## What Changes

- `lib/components/ActiveCombatView.tsx`: wrap the `onNextTurn` handler passed to `CombatantCard`/`LairActionsSlot` so that, after calling `nextTurn()`, it resolves the resulting active combatant's id and scrolls its card into view (smooth, full card visible) when the preference is enabled.
- `lib/preferences/schema.ts`: add a `combat` preference domain with `autoScrollToNextCombatant: boolean` (default `true`), including its validator.
- `lib/preferences/usePreferences.tsx`: thread the new domain through the existing offline-first local-mirror/reconciliation logic (no new mechanism).
- `app/api/me/preferences/route.ts` and `lib/storage/userPreferencesRepo.ts`: accept/persist/return the new key via the existing sparse-delta patch flow.
- `app/profile/page.tsx`: add a toggle for the new preference, following the existing dice/chat toggle presentation.
- `openspec/specs/profile-settings/spec.md` and a new/updated turn-order or combat-view capability spec: document the new scenario.

## Risks

- Risk: Resolving the "new active combatant" synchronously after calling `nextTurn()` is unreliable because state updates aren't visible until the next render.
  - Impact: Scroll could target the stale (pre-advance) combatant, or silently no-op.
  - Mitigation: Reuse the same "simulate post-update list locally" approach already proven in `handleSetInitiative` (`ActiveCombatView.tsx`), or defer the scroll to a `useEffect`/microtask keyed off a ref armed only by the "done" click, so it never fires for other causes of `activeCombatantId` changes.
- Risk: `useCombat.ts` and `ActiveCombatView.tsx` are already flagged by the project's static-review gate as oversized/over-complex files (pre-existing MEDIUM findings, unrelated to this change).
  - Impact: Adding logic here increases an already-flagged file's size, and could push a comprehensibility gate finding from advisory to blocking.
  - Mitigation: Keep the new logic as a small, clearly-isolated helper (e.g., a dedicated scroll-target-resolution function) rather than inlining it into the existing large handlers, so it stays easy to review and potentially easy to extract later.
- Risk: `scrollIntoView` behavior (especially `block` alignment) varies across browsers/viewport sizes, and a "smooth, full card visible" scroll on a very tall card (e.g. many legendary actions) may not fit within a small viewport regardless of alignment.
  - Impact: Imperfect visibility on some screens, not a functional break.
  - Mitigation: Accept "best effort full visibility" as the bar; pick `block: 'nearest'` or `'start'` based on what testing shows keeps the top of the card (name/HP/turn button) visible even when the whole card can't fit.

## Open Questions

None — all ambiguity surfaced during `/opsx:explore` was resolved by the requester before this proposal was written:
1. Scroll direction/semantics confirmed non-directional (turn order skip/wrap means "next" isn't always "down the page").
2. Scroll trigger confirmed to live in the "done" click handler only.
3. Preference storage confirmed as local-storage-mirrored + user-profile-persisted, using the existing `/profile` preferences screen.
4. Scroll style confirmed as smooth, with the full card brought into view.

Blocker for apply: no.

## Non-Goals

- Auto-scrolling on any trigger other than the explicit "Current Turn (done)" click.
- Changing which combatant is selected as "next" (turn-order-advancement logic is unchanged).
- A configurable scroll speed/style beyond the single "smooth, full card" behavior described here.
- Introducing a new settings/preferences surface outside the existing `/profile` page.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
