## Context

`lib/components/CampaignChat.tsx` currently renders dice rolling via `DicePoolTrigger` (a button showing literal `d20` text) and `DicePoolPortal` (a `createPortal`-to-`document.body` overlay, `position: fixed`, anchored at `{ bottom: window.innerHeight - triggerRect.top + 8, left: triggerRect.left }`, i.e. directly above the trigger button). This landed via the `multi-dice-pool-popout` change (archived 2026-08-19), which deliberately moved the pool UI out of the chat drawer's own DOM subtree to avoid height-clipping — but the resulting anchor position still visually stacks the pop-out over the dock rather than beside it, which is the specific complaint in GitHub issue #512's second screenshot. `RollFeedItem` renders a 🎲 emoji as its glyph. There is no icon library or vendored icon asset in this project; all existing icons (pin, expand-arrows) are hand-rolled inline `<svg>` elements defined directly in `CampaignChat.tsx`.

`app/campaigns/[id]/layout.tsx` already has a working precedent for "panel as flex sibling instead of overlay": when `isChatLarge` is true, it renders `<main>` and the chat drawer as siblings inside a `flex h-screen` row instead of the drawer's default `fixed bottom-0 right-0` overlay positioning.

## Goals / Non-Goals

**Goals:**
- Replace text/emoji dice glyphs with real dice iconography, vendored locally (no new npm dependency, no runtime fetch).
- Make the dice pool UI a true layout sibling to the left of the chat drawer, not a floating overlay stacked above/over it.
- Auto-scroll the feed to a roll the current user just posted.
- Keep the change UI-only: no backend, API, or `lib/utils/dice.ts` changes.
- Leave a clear, documented seam for a future `@3d-dice/dice-box` 3D-animated-roll upgrade without committing to it now.

**Non-Goals:**
- Real 3D/physics dice animation (`@3d-dice/dice-box`) — explicitly deferred, tracked as a follow-up idea, not built here.
- Reordering the chat feed or building a "latest roll" modal — issue #512's second ask is scoped to auto-scroll only, per explicit user direction during exploration.
- Changing the roll data model, `CampaignRoll` type, or the `/api/campaigns/[id]/rolls` contract.
- A generalized icon system for the rest of the app (message visibility icons, member avatars, etc.) — this change vendors dice icons only.

## Decisions

### D1: Vendor game-icons.net SVGs as inline React components, not an npm package

game-icons.net (Delapouite/game-icons.net, CC BY 3.0) has a full d4/d6/d8/d10/d12/d20 set as individual SVGs (e.g. `dice-twenty-faces-twenty` for d20) but no maintained npm distribution. Rather than pulling in a generic dice-icon npm package (adds a dependency for ~6 static paths) or a bitmap image (not stylable/colorable/animatable via CSS), vendor the six SVGs' `<path>` data directly as small React components, matching the existing hand-rolled-`<svg>` pattern already used for the pin/expand icons in this file.

**Alternatives considered:**
- npm dice-icon package: rejected — none found that are maintained, cover the full d4–d20 set, and are license-compatible; adds a dependency for trivial static content.
- Bitmap `<img>` assets: rejected — can't recolor via `currentColor`/CSS to match the existing icon buttons' hover states, and blocks future CSS-transform-based spin animation.
- Emoji-only (keep 🎲, add nothing): rejected — doesn't address issue #512's explicit ask for "an icon or image of an actual d20", and gives no per-die-size visual distinction for the pool buttons.

### D2: New `lib/components/icons/dice.tsx` module for the `dice-iconography` capability

A dedicated module exports one component per die size (`DiceD4Icon`, `DiceD6Icon`, ... `DiceD20Icon`) plus a `DIE_ICONS: Record<number, ComponentType>` lookup keyed by sides, so `DicePoolTrigger`'s per-die buttons and `RollFeedItem` can look up the right icon by `sides` without a switch statement. Each component accepts standard `width`/`height`/`className` props like the existing inline SVGs. A `NOTICE` (or a header comment block in `dice.tsx` — final call left to implementation, both satisfy CC BY 3.0 attribution) credits game-icons.net/Delapouite.

**Alternatives considered:** Inlining each icon directly at its call site (as the pin/expand icons currently are): rejected for the dice set specifically, since the same six icons are needed in two places (`DicePoolTrigger` buttons and `RollFeedItem`) and will be needed again by any future roll-animation work — a shared lookup avoids duplicating six SVGs.

### D3: Dice panel becomes a flex sibling of the chat drawer, mounted/unmounted with pop-out open state — not a portal

Remove `DicePoolPortal` and its `document.body` overlay-root (`DICE_OVERLAY_ROOT_ID`) entirely. `DicePoolTrigger`'s pool content renders in-flow as a sibling `<div>` immediately to the left of the drawer's root element, inside a wrapping flex row that `CampaignChat` returns when expanded. This mirrors `app/campaigns/[id]/layout.tsx`'s existing `isChatLarge` flex-row pattern (main + chat as siblings) rather than inventing a new positioning strategy. The panel only mounts while `isOpen` is true (same as today) so it costs nothing when closed.

Width/height: the dice panel takes its own fixed width (e.g. `w-64`, matching the old portal's popout width) and matches the drawer's current height (`resolvedHeight`), so the two form one visually contiguous block rather than mismatched panel heights.

**Alternatives considered:**
- Keep the portal but retarget its anchor `left` to `triggerRect.left - popoutWidth` (i.e., math a "to the left" position while still floating): rejected — still a `position: fixed` overlay that can visually clip/overlap other page content and doesn't grow the layout the way issue #512 explicitly floated as acceptable ("if this means the entire panel must grow we can discuss"); a real flex sibling is more robust than position math against a moving trigger `getBoundingClientRect()`.
- Make the dice panel replace the drawer's dice-trigger row (i.e., dice controls always visible left of drawer, no trigger/toggle): rejected — no such requirement in the issue; keeping an explicit open/close trigger preserves the existing tested trigger/keyboard/outside-click behavior from `roll-share-ui`.

This is the **BREAKING** internal change flagged in the proposal: `roll-share-ui`'s "Floating dice pop-out renders outside the chat dock's DOM subtree" requirement (portal to `document.body`, independent of drawer overflow) is superseded — the new requirement is "dice panel renders as an in-flow flex sibling to the left of the drawer," which achieves the same original goal (not clipped by the drawer's height/overflow) by a different, less fragile mechanism.

### D4: Auto-scroll triggers only for the poster's own roll, via a ref flag consumed in a `useEffect` keyed on `feed`

`handleRollPosted` (called after a successful `POST /rolls` response for the roll the current user just made) sets a `pendingScrollRef.current = true` alongside its existing `setFeed` call. A `useEffect` watching `feed` checks and clears that flag; when set, it calls `feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })` after the DOM updates. Rolls arriving from other players via the SSE `roll` event (in `onStreamEvent`) do **not** set the flag and do not trigger auto-scroll, matching the explicit scope decided during exploration (auto-scroll on your own roll, not a feed-wide behavior change).

**Alternatives considered:**
- Always auto-scroll on any new feed item (message, own roll, or others' roll): rejected — would fight a user who has scrolled up to read history, and issue #512 only asked about the roller's own experience ("when the roll button is clicked, the result... should pop to the top of the stack for display").
- Scroll on mount of `RollFeedItem` via its own `useEffect`/`scrollIntoView`: rejected — would fire for every roll (including others' and history-loaded rolls), same problem as above, and couples a leaf item to scroll-container internals unnecessarily.

## Risks / Trade-offs

- **[Risk]** Vendoring SVG path data hardcodes a specific icon revision; game-icons.net updates its art occasionally. → **Mitigation:** paths are copied once at implementation time into a version-controlled file; a future refresh is a normal PR, not a runtime dependency-bump surprise.
- **[Risk]** Removing the portal changes existing `roll-share-ui` test expectations (portal-to-`document.body`, non-descendant-of-drawer assertions). → **Mitigation:** `roll-share-ui` spec is updated in this change (MODIFIED/REMOVED requirements) and `tasks.md` includes updating the corresponding tests in `tests/unit/components/CampaignChat/` before/alongside the implementation change, per the required TDD sequence.
- **[Risk]** Making the dice panel a flex sibling widens the total on-screen footprint when open, which could feel cramped on narrow viewports. → **Mitigation:** out of scope to solve responsive breakpoints in this change (not raised in the issue or exploration); flagged as an Open Question below for explicit confirmation before implementation.
- **[Trade-off]** Deferring `@3d-dice/dice-box` means this change's icons are still flat/static (no roll animation yet), so "pop to the top" and icon-swap alone don't yet deliver a fully game-y feel. Accepted as the scoped, explicitly-agreed-to slice of #512; documented so it isn't mistaken for the final word on dice UX.

## Migration Plan

UI-only, client-rendered change behind no feature flag (matches this codebase's existing pattern of shipping UI changes directly). No data migration. Rollback is a plain revert of the PR — no persisted state format changes (the existing `campaign-chat-pin` / `campaign-chat-size` LocalStore keys are untouched).

## Open Questions

- Narrow-viewport behavior for the new sibling dice panel (e.g. below some breakpoint, does it overlay instead of pushing layout, or is that explicitly out of scope for now)? Leaning toward "out of scope, revisit if reported" per the issue's own "if this means the entire panel must grow we can discuss" framing, but flagging before tasks are finalized.
- Exact attribution mechanism (`NOTICE` file at repo root vs. header comment in `dice.tsx`) — both satisfy CC BY 3.0; defaulting to a header comment in `dice.tsx` since the project has no existing `NOTICE`/`THIRD_PARTY` file convention, unless the user prefers establishing one.
