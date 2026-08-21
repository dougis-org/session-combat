## Why

GitHub issue #514 is direct user feedback on the `dice-roll-enhancements` change (issue #512 / PR #513), which shipped today (2026-08-20). Four problems were reported against the shipped feature; this proposal addresses all four:

1. The dice icons (added to replace text/emoji glyphs) are too small to read comfortably.
2. Neither the dice trigger button nor the per-die pool buttons expose a tooltip, so a new player has no way to discover what a bare icon means.
3. The dice panel force-matches the chat drawer's full (drag-resizable) height, per `roll-share-ui`'s existing requirement "the panel SHALL match the drawer's current height" — but the panel's own content is only ~4 rows tall, so most of that height is empty space. This is a deliberate design decision from `dice-roll-enhancements` (D3) that did not hold up once used.
4. The chat feed does not auto-scroll to a newly posted dice roll for *any* user — including the roller themselves. `roll-share-ui`'s existing "Feed auto-scrolls to a roll the current user just posted" requirement was intended to at least cover the self-roll case, but a verified race condition defeats it in practice: when the SSE `roll` broadcast reaches the poster's own connection before (or racing) the POST-response callback, the SSE path adds the roll to the feed without setting the scroll flag, and the POST-response path's duplicate-id guard then returns early without ever setting it either. So self-scroll silently fails whenever that race is lost — which is what the issue reporter observed.

Why now: the underlying feature merged today, so this is a fast-follow fix on a live gap rather than a new initiative.

## What Changes

- Increase dice icon sizes by 50% in both call sites: the trigger button's d20 icon (16px → 24px) and each per-die pool button's icon (14px → 21px).
- Add native `title` attributes (no new tooltip component/dependency): "Dice Rolls for main screen pop out" on the trigger button, and "d4"/"d6"/"d8"/"d10"/"d12"/"d20" on each matching per-die pool button.
- Remove the dice panel's forced height-match to the chat drawer (`heightPx={resolvedHeight}`); the panel sizes to its own content instead (`height: auto`), eliminating the dead space below its controls. **BREAKING** (spec-level): reverses the "panel SHALL match the drawer's current height" requirement from `roll-share-ui`.
- Auto-scroll the feed to the bottom for every new dice roll, for every user, regardless of whether the roll enters the feed via the SSE stream event or the local POST-response callback — closing the self-roll race and extending scroll behavior to rolls from other players. **BREAKING** (spec-level): reverses the "A roll from another player does not trigger auto-scroll" requirement from `roll-share-ui`. Auto-scroll remains scoped to dice rolls only; plain chat messages are explicitly out of scope (unchanged).

## Capabilities

### New Capabilities

*(none)*

### Modified Capabilities

- `roll-share-ui`:
  - "MODIFIED Dice pop-out trigger anchored to the chat dock" — trigger's d20 icon size increases and gains a `title` tooltip.
  - "MODIFIED Dice staging pool" — each per-die icon's size increases and gains a `title` tooltip matching its die size.
  - "MODIFIED Dice panel renders as an in-flow flex sibling to the left of the chat dock" — drops the height-matching requirement; panel height becomes content-driven instead of drawer-driven.
  - "MODIFIED Feed auto-scrolls to a roll the current user just posted" — broadens to auto-scroll on any dice roll from any user, and fixes the self-roll race so the current user's own roll reliably scrolls too.

## Impact

- **Code**: `lib/components/CampaignChat.tsx` (`DiceTriggerButton`, `DicePoolPanel`, the roll-auto-scroll effect, the SSE `'roll'` stream handler, `handleRollPosted`), `lib/components/icons/dice.tsx` (icon size props at call sites only — no changes to the icon components themselves).
- **Tests**: `tests/unit/components/CampaignChat/CampaignChat.dicePool.test.tsx`, `tests/unit/lib/components/icons/dice.test.tsx` (if size assertions exist), and any test asserting the old "no auto-scroll for other players' rolls" or "panel matches drawer height" behavior must be updated to the new expected behavior.
- **Specs**: `openspec/specs/roll-share-ui/spec.md` gets delta requirements per "Modified Capabilities" above. `openspec/specs/dice-iconography/spec.md` is unaffected (icon size/tooltip are call-site concerns, not properties of the icon components themselves).
- **No backend, API, or `lib/utils/dice.ts` changes.** No changes to `CampaignRoll`/`CampaignMessage` data models or the `/api/campaigns/[id]/rolls` contract.
- **No new dependencies.** Tooltips use the native `title` attribute; no tooltip library is introduced.
