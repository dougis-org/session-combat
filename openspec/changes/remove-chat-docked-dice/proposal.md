## GitHub Issues

- #585

## Why

- **Problem statement:** The campaign chat dock renders its own dice-rolling UI — a
  persistent d20 trigger button in a bottom bar plus a slide-out staging-pool panel
  (`DicePoolPanel`) with the percentile control. Since `GlobalDiceFab` shipped, an
  equivalent dice pool + percentile roller is available from a fixed fab on every page
  ("the main screen"), and it already sends rolls to session chat via the shared
  `useRollSubmission` capability. The in-chat copy is now redundant and it permanently
  consumes a strip of vertical space at the bottom of the chat drawer.
- **Why now:** The `dice-labels-and-percentile-die` change (issue #573, merged as PR #582,
  archived 2026-08-30) just finished touching every dice surface. Removing the chat-docked
  duplicate now, while the dice code is fresh and fully specced, avoids maintaining two
  staging-pool implementations through future dice work (e.g. roll animation).
- **Business/user impact:** Players get more of the chat drawer for reading the feed, and
  there is one — not two — places to build and commit a roll, removing a confusing choice.

## Problem Space

- **Current behavior:**
  - `lib/components/CampaignChat/index.tsx` renders `<DicePoolPanel>` as a left flex
    sibling of the drawer and `<DiceTriggerButton>` inside a bottom bar
    (`<div class="border-t border-gray-700 p-2 …">`). That bottom bar also shows a
    "No active session" hint when `activeSessionId` is null.
  - `lib/components/CampaignChat/useCampaignDice.ts` wires `useDicePoolState` +
    `useRollSubmission` to the dock, exposing `handleDiceRoll` / `handlePercentileRoll`
    and a `isTriggerDisabled` rule tied to this component's own SSE status.
  - `GlobalDiceFab` (`app/layout.tsx`) independently renders the same pool + percentile
    controls and submits directly through `useRollSubmission`.
  - Chat consumes every roll — its own and everyone else's — solely via the SSE `'roll'`
    stream event (per `decouple-dice-roll-capability`, 2026-08-29). There is no
    optimistic/local append path left in chat.
- **Desired behavior:**
  - The chat drawer no longer renders any dice trigger, dice panel, or dice-pool state.
    `ChatFeed` (already `flex-1 overflow-y-auto`) expands into the reclaimed space.
  - The bottom bar is rendered **only** when `activeSessionId` is null, containing just
    the "No active session" message. With an active session there is no bottom bar at all
    (feed + composer fill the drawer).
  - `CampaignChat` still receives `activeSessionId`, still gates roll-history fetching on
    it, and still announces/clears dice-session presence so `GlobalDiceFab` can send to
    session chat.
  - Roll history, the interleaved message/roll feed, `RollFeedItem` (including percentile
    rendering), and SSE-stream roll ingestion with rollerId-based auto-scroll are all
    unchanged.
- **Constraints:**
  - `useDicePoolState`, `useRollSubmission`, `buildRoll`, `buildPercentileRoll`,
    `DieGlyph`, `DiePoolButton`, `PercentileButton`, and `rollPercentile` must remain —
    `GlobalDiceFab` depends on all of them.
  - The `import { CampaignChat } from '@/lib/components/CampaignChat'` path must not change.
  - No change to `/api/campaigns/[id]/rolls`, the SSE stream, or `diceSessionBridge`.
  - Verity size gate must still pass for every file under `lib/components/CampaignChat/`.
- **Assumptions:**
  - `GlobalDiceFab` is acceptable as-is (confirmed by the requester) — no feature parity
    work (e.g. contextual open, in-drawer affordance) is needed.
  - The percentile decode rule and shared dice utilities do not need revisiting; this is a
    pure removal + layout change.
- **Edge cases considered:**
  - `activeSessionId` toggling null → non-null while the drawer is open: the bottom bar
    appears/disappears; feed re-flows; no dice state to reset anymore.
  - SSR: removing `DicePoolPanel`/`DiceTriggerButton` also removes their SSR-safety
    surface from the dock; `GlobalDiceFab` keeps its own SSR coverage.
  - `dock.isLarge` (full-height) vs compact drawer: the flex-row wrapper previously held
    the dice panel as its first child; with it gone the wrapper has a single child
    (the drawer). Wrapper can stay or be flattened — a design decision.
  - Drag-resize: `DragHandle` and dock sizing are untouched; only the dice sibling leaves.

## Scope

### In Scope

- Remove `<DicePoolPanel>`, `<DiceTriggerButton>`, `useCampaignDice`, and all dice-pool
  refs/state/handlers from `lib/components/CampaignChat/index.tsx`.
- Make the drawer's bottom bar conditional on `activeSessionId === null`, containing only
  the "No active session" message.
- Delete now-dead source: `lib/components/dice/DicePoolPanel.tsx`,
  `lib/components/dice/DiceTriggerButton.tsx`,
  `lib/components/CampaignChat/useCampaignDice.ts`.
- Delete now-dead tests: `tests/unit/components/CampaignChat/CampaignChat.dicePool.ui.test.tsx`,
  `…/CampaignChat.dicePool.commit.test.tsx`, `…/CampaignChat.dicePool.scroll.test.tsx`,
  `…/CampaignChat.dicePool.ssr.test.tsx`.
- Update `openspec/specs/roll-share-ui/spec.md` (and `campaign-chat-dock` where it names
  `useCampaignDice.ts`) to reflect that the chat-docked dice UI is removed; the FAB is the
  sole staging-pool surface.
- Add/adjust `CampaignChat` tests for the new bottom-bar behavior.

### Out of Scope

- Any change to `GlobalDiceFab`, `useDicePoolState`, `useRollSubmission`, `rollPercentile`,
  or the shared `DieGlyph`/`DiePoolButton`/`PercentileButton` components.
- Any change to `/api/campaigns/[id]/rolls`, the SSE stream, `diceSessionBridge`, roll
  history fetching, `RollFeedItem`, or feed auto-scroll behavior.
- Dice roll animation (tracked separately).
- Re-homing or restyling `GlobalDiceFab` (e.g. moving it, adding a chat-drawer entry point).

## What Changes

- `lib/components/CampaignChat/index.tsx`:
  - Drop imports of `DicePoolPanel`, `DiceTriggerButton`, `useCampaignDice`.
  - Drop `diceTriggerRef`, `dicePanelRef`, and the `useCampaignDice(...)` call plus its
    destructured `dicePool` / `isRolling` / `rollError` / `isTriggerDisabled` /
    `handleDiceRoll` / `handlePercentileRoll`.
  - Remove `<DicePoolPanel …>` from the flex-row wrapper.
  - Replace the always-rendered bottom bar with one rendered only when
    `activeSessionId === null`, holding just `<p class="text-xs text-gray-500">No active
    session</p>` (keep the `border-t`/padding wrapper so it reads as a footer).
  - Keep the `announcePresence` / `clearPresence` effect and the `activeSessionId` prop.
- Delete `lib/components/dice/DicePoolPanel.tsx`, `lib/components/dice/DiceTriggerButton.tsx`,
  `lib/components/CampaignChat/useCampaignDice.ts` and their four dead dicePool test files.
- Spec deltas: `roll-share-ui` — REMOVE the chat-dock trigger/pool/percentile-in-chat/
  flex-sibling-panel/roll-entry-strip requirements; MODIFY the `activeSessionId` prop
  requirement to drop the "dice pop-out trigger" clause; ADD a requirement for the
  session-gated footer message. `campaign-chat-dock` — MODIFY the "Source location"
  requirement to drop `useCampaignDice.ts` from the submodule list.
- Impacted capabilities: `roll-share-ui` (major), `campaign-chat-dock` (minor),
  `dice-iconography` / `dice-pool-shared-state` / `global-dice-fab` (referenced only — no
  behavior change; the FAB is now the sole consumer).

## Risks

- Risk: A test or component elsewhere imports `DicePoolPanel` / `DiceTriggerButton` /
  `useCampaignDice`.
  - Impact: Build/type failure after deletion.
  - Mitigation: `grep -rn` for each symbol before deleting; confirmed today only
    `CampaignChat/index.tsx` and the four dicePool test files reference them.
- Risk: `CampaignChat.roll.test.tsx` or `CampaignChat.scene.test.tsx` implicitly relies on
  the dice trigger existing (e.g. a query that would now match nothing).
  - Impact: False test failure.
  - Mitigation: Run the full `CampaignChat/` suite after the edit; `roll.test.tsx` targets
    feed/history/stream only and its comment already points dice-panel coverage at the
    dicePool files.
- Risk: Removing the dice panel's SSR test reduces SSR coverage of the dock.
  - Impact: An SSR regression in the dock could go uncaught.
  - Mitigation: `CampaignChat` dock-shell SSR is still covered by
    `campaign-chat-dock` scenarios and `CampaignChat.drawer`/`.dicePool.ssr` is the only
    one being removed; `GlobalDiceFab.ssr.test.tsx` keeps dice-panel SSR coverage.
- Risk: Layout regression when the bottom bar disappears with an active session (feed
  height jump, composer spacing).
  - Impact: Minor visual glitch.
  - Mitigation: Snapshot/visual check via the `run` skill during apply; feed is already
    `flex-1` so it absorbs the delta.
- Risk: The flex-row wrapper now wraps a single child.
  - Impact: Dead wrapper markup; possible `items-end`/`items-stretch` no-op.
  - Mitigation: Design decision to keep the wrapper (minimal diff) vs flatten it; default
    is keep, noted in design.md.

## Open Questions

- Question: Keep the single-child flex-row wrapper in `index.tsx` or flatten it now that
  the dice panel is its only sibling?
  - Needed from: requester (aesthetic/diff-size preference)
  - Blocker for apply: no — default is to keep it (smallest diff); revisit only if the
    wrapper causes a layout issue.

_No other unresolved ambiguity: the explore session resolved the footer behavior
(session-gated "No active session" message), dead-code removal scope, and the "FAB as-is"
decision._

## Non-Goals

- Improving or relocating `GlobalDiceFab`.
- Adding any new dice affordance inside the chat drawer.
- Touching the rolls API, SSE contract, or `diceSessionBridge`.
- Changing roll-feed rendering, roll history, or auto-scroll.
- Dice roll animation.

## Change Control

If scope changes after proposal approval, update `openspec/changes/remove-chat-docked-dice/proposal.md`,
`openspec/changes/remove-chat-docked-dice/design.md`,
`openspec/changes/remove-chat-docked-dice/specs/**/*.md`, and
`openspec/changes/remove-chat-docked-dice/tasks.md` before implementation starts.
