## GitHub Issues

- #512

## Why

GitHub issue #512 flags three rough edges in the campaign chat's dice experience: the roll trigger and feed items still use a literal `d20` text label / 🎲 emoji instead of real dice iconography, a newly-posted roll can land off-screen at the bottom of the feed with no indication it arrived, and the dice pop-out (added by the recently-archived `multi-dice-pool-popout` change) renders as a floating overlay anchored *above* the trigger — still visually stacked over the chat dock rather than beside it, which was the exact "opens over the top of it" complaint the pop-out was meant to avoid.

## What Changes

- Vendor a small set of dice-face SVG icons (d4/d6/d8/d10/d12/d20) from game-icons.net (CC BY 3.0) as inline React icon components, following the codebase's existing hand-rolled inline-`<svg>` icon pattern (see the pin/expand icons in `CampaignChat.tsx`). Add the required attribution notice.
- Replace the `DicePoolTrigger` button's literal `d20` text with the vendored d20 icon.
- Replace `RollFeedItem`'s 🎲 emoji with the vendored d20 icon (or matching per-die icon where useful).
- Replace the `DicePoolTrigger`'s per-die add/remove text labels (`d{sides} ×{count}`) with the matching vendored die-face icon plus the count badge, using the full d4–d20 set already fetched.
- Restructure the dice pool UI from a `position: fixed` portal anchored above the trigger into a panel that mounts as a flex sibling to the **left** of the `CampaignChat` drawer — same sibling-layout pattern `app/campaigns/[id]/layout.tsx` already uses for `isChatLarge` (flex row of `<main>` + chat, rather than an absolutely-positioned overlay). The dice panel is a sibling of the chat drawer, not nested inside it, and only occupies space (and is only mounted) while open.
- When a roll the current user just posted is appended to the feed, auto-scroll the feed container so the new roll is visible without the user needing to scroll manually. This does not reorder the feed and does not reorder or auto-scroll for rolls arriving from other players over SSE.
- Document `@3d-dice/dice-box` (3D physics dice) as explicitly deferred future work for real animated rolls — out of scope for this change, noted so it isn't silently dropped.
- **BREAKING** (internal only, no external API change): `DicePoolPortal`'s `createPortal`-to-`document.body` approach and its `DICE_OVERLAY_ROOT_ID` overlay-root DOM node are removed in favor of in-flow flex-sibling rendering; any test or code relying on the dice pool DOM node being a descendant of a `#dice-pool-overlay-root` node under `document.body` (see `roll-share-ui` spec's "Floating dice pop-out renders outside the chat dock's DOM subtree" requirement) must be updated.

## Capabilities

### New Capabilities
- `dice-iconography`: Vendored SVG dice-face icon set (d4–d20) sourced from game-icons.net, exposed as reusable inline React icon components with required CC BY 3.0 attribution, used by the chat dock's roll UI (and available to future roll-animation work).

### Modified Capabilities
- `roll-share-ui`: The dice pop-out trigger changes from a text label to an icon; the roll feed item's dice glyph changes from an emoji to a vendored icon; the pop-out's rendering strategy changes from a `document.body` portal anchored above the trigger to an in-flow flex-sibling panel to the left of the chat dock; a newly-posted-by-self roll now triggers an auto-scroll of the feed.

## Impact

- `lib/components/CampaignChat.tsx` — `DicePoolTrigger`, `DicePoolPortal` (removed/replaced), `RollFeedItem`, `ChatFeed`, `handleRollPosted`, and the main component's returned layout (drawer becomes part of a flex row with the new dice panel).
- `app/campaigns/[id]/layout.tsx` — no change expected to its own layout logic, but confirms/extends the precedent it already sets for `isChatLarge` flex-sibling rendering.
- New: a small icon-component module (exact path decided in design) holding the vendored dice SVGs, plus an attribution note (e.g. `NOTICE` addition or inline SVG `<title>`/comment credit — decided in design).
- Tests: `tests/unit/components/CampaignChat/` suites covering the dice pop-out trigger, portal-anchoring, and roll-feed-item rendering (per `roll-share-ui` spec scenarios) need updates for the new DOM structure; new scenarios needed for auto-scroll behavior.
- No API, schema, or backend (`lib/utils/dice.ts`, `/api/campaigns/[id]/rolls`) changes — this is UI-only.
