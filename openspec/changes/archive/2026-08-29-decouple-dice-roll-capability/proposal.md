## GitHub Issues

- #517

## Why

- Problem statement: `lib/components/CampaignChat.tsx` (~1050 lines) exceeds the project's
  readability/size guidance and is flagged by the Verity quality gate. It bundles several
  independent concerns — dice-pool UI, chat feed rendering, the composer, and drawer/dock
  chrome — into one file. Splitting it along its existing seams (as originally filed) would
  relocate the dice-pool code into a subfolder but leave it structurally owned by chat,
  which is the wrong boundary: `lib/components/GlobalDiceFab.tsx` already proves dice
  rolling must work independent of chat being mounted, open, or even present on the page.
- Why now: exploration of the size-limit fix surfaced that the dice-pool concern isn't
  just a UI clump that happens to live in the chat file — it's a capability that's
  currently duplicated (pool-selection state exists twice, once in `CampaignChat`'s
  `useDicePool` and once in `GlobalDiceFab`) and gated (roll *submission* only works when
  a `CampaignChat` instance happens to be mounted, reached through a presence-based
  singleton bridge whose own code comment admits: "not invoked at all if no CampaignChat
  instance is mounted"). Filing the size-limit fix without addressing this would encode
  the coupling more permanently under a tidier folder structure.
- Business/user impact: today, if a player or DM has collapsed or closed the chat drawer,
  `GlobalDiceFab`'s "Send to session chat" action silently cannot deliver the roll to the
  session — the request is dropped with no subscriber to receive it. Decoupling roll
  submission from chat's mounted lifecycle fixes this latent bug as a side effect of the
  refactor, and gives future session-level UI (anything that needs to roll or observe
  rolls) a capability to call directly instead of routing through chat.

## Problem Space

- Current behavior:
  - `CampaignChat.tsx` owns three things that don't need to be co-located: (1) dice-pool
    selection UI + roll submission (`useDicePool`, `DiceTriggerButton`, `DicePoolPanel`,
    `submitRoll` → POST `/api/campaigns/[id]/rolls`), (2) chat feed rendering (`ChatFeed`,
    `ChatMessageItem`, `RollFeedItem`), (3) composer + mentions (`ChatComposer`,
    `MentionDropdown`), plus the drawer/dock state machine (`dockReducer`, drag-resize,
    pin/expand/collapse, persisted size) that's genuinely chat-drawer-specific.
  - `GlobalDiceFab.tsx` independently reimplements the pool-selection state machine (pool,
    modifier, add/remove, `poolTotal`, RNG call, formula-building) because it has no way to
    share `CampaignChat`'s internal `useDicePool`.
  - `lib/dice/diceSessionBridge.ts` exposes `announcePresence`/`onPresenceChange` (session
    presence — legitimately cross-cutting) and `requestRoll`/`onRollRequested` (a
    request/response indirection that exists solely so `GlobalDiceFab` can ask whatever
    `CampaignChat` instance happens to be mounted to submit a roll on its behalf).
  - Chat's feed display of rolls is already fully decoupled from submission: it renders
    rolls purely from the SSE `'roll'` stream event (`onStreamEvent`), regardless of who
    submitted them. The one submission-shaped thing left in chat is the optimistic
    `handleRollPosted` append-and-force-scroll path, which exists only because chat
    currently owns the POST call itself.
- Desired behavior:
  - Roll-pool selection state and roll submission become a shared, chat-independent
    capability (`lib/dice/`) that any UI (docked-in-chat panel, `GlobalDiceFab`, future
    surfaces) calls directly.
  - Consumers that care about rolls (chat's feed today) *consume* roll events via the
    existing SSE stream; they do not gate or route submission through themselves.
  - Chat's feed still auto-scrolls to a roll the instant it's ingested from the stream, so
    visible context stays current — this behavior is preserved as-is, it just moves to
    live entirely on the consumption side rather than partly on the submission side.
  - The presence-gated request/response bridge (`requestRoll`/`onRollRequested`) is
    removed once nothing depends on it for submission routing.
  - `CampaignChat.tsx` itself is split into cohesion-based submodules under
    `lib/components/CampaignChat/`, none of which contain roll-submission logic.
- Constraints:
  - Pure refactor from the end-user's perspective for chat itself — no visible behavior
    change to messaging, drawer/dock UX, or the existing roll-rendering/auto-scroll
    behavior in chat.
  - The one intentional behavior change is a bug fix: `GlobalDiceFab` roll submission
    (today routed through chat and silently dropped when chat isn't mounted) must work
    whether or not `CampaignChat` is mounted.
  - Dice generation stays client-side with server-side validation on submission, per
    existing project convention — this change does not touch that trust boundary, only
    where the client-side submission call lives.
  - Roll visibility remains validated against the existing fixed allowlist (`group`,
    `dm-only` for pool submission; chat's own message visibility is a separate, unrelated
    concern and is out of scope here).
- Assumptions:
  - `requestRoll`/`onRollRequested` have no consumers beyond `GlobalDiceFab` (caller) and
    `CampaignChat` (listener) — confirmed by repo-wide search during exploration; no other
    production code or test imports them for a different purpose.
  - The existing `/api/campaigns/[id]/rolls` POST endpoint and its request/response shape
    are unchanged; only the client-side caller of that endpoint moves.
  - `announcePresence`/`clearPresence`/`onPresenceChange` remain as-is — presence is a
    legitimate cross-cutting signal (does a session exist to roll into) independent of who
    submits.
- Edge cases considered:
  - No active session / no presence: `GlobalDiceFab` must continue to disable/hide the
    "send to session" affordance when there's no session to submit to, using presence
    exactly as it does today — only the submission call itself changes, not the
    presence-gating UX.
  - Chat unmounted while a roll is submitted elsewhere: must now succeed (this is the bug
    being fixed), and if chat is later mounted/expanded, the roll must still appear in its
    feed via the normal SSE history/stream path — no special-casing required since chat
    never learns about submission directly today either.
  - Duplicate/racing roll delivery: chat's existing `seenIds` dedup guard in
    `onStreamEvent` is the sole source of duplicate protection going forward; the
    optimistic-append path being removed was a second, now-unnecessary guard against the
    same race.
  - Own-roll auto-scroll: must still force-scroll when the ingested roll's `rollerId`
    matches the current user, using the same check already present in `onStreamEvent`
    (`roll.rollerId === user?.userId`) — this is what "preserve auto-scroll on ingest"
    resolves to once submission-side scrolling is removed.

## Scope

### In Scope

- Extract shared dice-pool selection state into `lib/dice/useDicePoolState.ts` (or
  equivalent), used by both the chat-docked panel and `GlobalDiceFab`.
- Extract roll submission into `lib/dice/useRollSubmission.ts` (or equivalent) — owns the
  POST to `/api/campaigns/[id]/rolls` and 409/500 handling — callable directly by any
  component.
- Extract pure dice-pool UI (`DicePoolPanel`, `DiceTriggerButton`) into
  `lib/components/dice/`, driven by the shared hooks, reused by both placements.
- Update `GlobalDiceFab.tsx` to use the shared hooks directly instead of its duplicated
  pool logic and the `requestRoll` bridge call.
- Remove `requestRoll`/`onRollRequested` (and associated types `RollRequestPayload`,
  `RollOutcome`-as-request-shape, `RollRequestResult`, `RollRequestListener`) from
  `lib/dice/diceSessionBridge.ts` once `GlobalDiceFab` no longer needs them; keep
  `announcePresence`/`clearPresence`/`onPresenceChange`.
- Split `lib/components/CampaignChat.tsx` into `lib/components/CampaignChat/`:
  `index.tsx` (coordinator), `ChatFeed.tsx`, `Composer.tsx`, `useDockState.ts`,
  `useChatFeed.ts` (SSE wiring, history/pagination, feed state, scroll-to-bottom
  including on-roll-ingest scroll).
- Update/rewrite the affected test files: delete
  `tests/unit/components/CampaignChat/CampaignChat.diceSessionBridge.test.tsx` (tests only
  the removed request/response path), update `tests/unit/lib/dice/diceSessionBridge.test.ts`
  to drop `requestRoll`/`onRollRequested` coverage, update
  `tests/unit/components/GlobalDiceFab.test.tsx` to cover direct submission instead of the
  bridge round-trip, and adjust any `CampaignChat/*.test.tsx` files whose setup relied on
  internals that moved.
- Update `lib/components/CampaignChat.tsx`'s remaining import path
  (`@/lib/components/CampaignChat`) to keep resolving to the new `index.tsx` so existing
  test imports (`import { CampaignChat } from '@/lib/components/CampaignChat'`) continue
  to work unchanged.

### Out of Scope

- Any change to the `/api/campaigns/[id]/rolls` server route, its request/response shape,
  or server-side roll validation.
- Any change to chat message visibility, mentions, or composer behavior beyond moving
  existing code to a new file.
- Any change to `announcePresence`/`clearPresence`/`onPresenceChange` behavior or
  signature.
- Any change to the dice RNG/rejection-sampling utilities in `lib/utils/dice`.
- Any new feature (e.g. a new surface that rolls dice, or new roll visibility options).
- Visual/UX changes to `GlobalDiceFab`'s panel or `CampaignChat`'s docked dice panel beyond
  what's structurally required by sharing the extracted hooks/components.

## What Changes

- `lib/components/CampaignChat.tsx` (1054 lines) → `lib/components/CampaignChat/` split
  into `index.tsx`, `ChatFeed.tsx`, `Composer.tsx`, `useDockState.ts`, `useChatFeed.ts`.
- New `lib/dice/useDicePoolState.ts` and `lib/dice/useRollSubmission.ts`, shared by chat and
  `GlobalDiceFab`.
- New `lib/components/dice/DicePoolPanel.tsx` and `lib/components/dice/DiceTriggerButton.tsx`
  (pure UI, moved from `CampaignChat.tsx` and generalized for reuse).
- `lib/components/GlobalDiceFab.tsx` updated to consume the shared hooks and submit rolls
  directly instead of duplicating pool logic and routing through the bridge.
- `lib/dice/diceSessionBridge.ts` narrowed to presence-only; roll-request routing removed.
- Corresponding test files added/updated/deleted as listed above.

## Risks

- Risk: Deleting `requestRoll`/`onRollRequested` breaks something not caught by the
  repo-wide search performed during exploration.
  - Impact: A production caller silently loses the ability to request a roll submission.
  - Mitigation: Re-run the search immediately before deletion as part of implementation
    (not just during proposal); TypeScript compilation will fail on any remaining import
    of the removed exports, giving a hard build-time signal rather than a silent runtime
    gap.
- Risk: Splitting `CampaignChat.tsx`'s effects (SSE wiring, history pagination, drag-resize)
  across `useDockState`/`useChatFeed` introduces a stale-closure or effect-ordering bug that
  unit tests don't catch (e.g. a ref shared across hooks initialized in the wrong order).
  - Impact: Regression in chat drawer resize persistence, history pagination, or SSE dedup
    that only shows up in manual/E2E testing.
  - Mitigation: Preserve existing effect boundaries and dependency arrays as closely as
    possible during extraction rather than restructuring effect logic; existing unit test
    suite (13 files) exercises drawer, SSE, history, unread, members, visibility, scene,
    and dice-pool behavior and must pass unchanged after the split.
- Risk: `GlobalDiceFab` switching from RNG-only-then-optional-send to direct submission
  changes its optimistic UI (currently: roll instantly shown locally, "send" is a separate
  explicit action) in a way the current design doesn't warrant changing.
  - Impact: Unintended UX change to `GlobalDiceFab`'s roll-then-send flow.
  - Mitigation: Design must preserve the "roll locally, then explicitly send" two-step
    interaction — decoupling submission's *implementation* from chat does not require
    collapsing it into a single auto-submit step; this is confirmed in Non-Goals below.
- Risk: Removing the optimistic `handleRollPosted` append means the roller's own roll now
  appears in chat only after the SSE round-trip, adding perceptible latency versus today's
  instant local append.
  - Impact: Minor UX regression in perceived responsiveness for the roller.
  - Mitigation: Flagged as an open question below for explicit confirmation before
    implementation proceeds.

## Open Questions

- Question: Removing chat's optimistic `handleRollPosted` append (in favor of relying
  purely on the SSE stream, consistent with "consume, don't gate") means the roller no
  longer sees their own roll in the feed until the SSE round-trip completes, instead of
  instantly. Is that acceptable, or should the docked dice-panel-in-chat placement keep
  some form of local optimistic feedback (as `GlobalDiceFab` already does with its own
  local `result` display, separate from the shared session feed)?
  - Needed from: dougis
  - Blocker for apply: no — default assumption if unanswered is that pure SSE-driven
    consumption is acceptable (matches the explicit "consume, don't gate" direction), and
    design.md will proceed on that basis unless corrected.

## Non-Goals

- Not collapsing `GlobalDiceFab`'s two-step "roll locally, then send to session" flow into
  a single action — decoupling *where submission logic lives* is not the same as changing
  *when* submission happens.
- Not unifying `GlobalDiceFab`'s and the chat-docked panel's visual presentation — they may
  continue to look different; only the underlying state/submission logic is shared.
- Not introducing a new roll-visibility scope or changing the existing `group`/`dm-only`
  allowlist.
- Not addressing any other file currently over the Verity size guidance — scope is limited
  to `CampaignChat.tsx` and the dice-roll capability it currently traps.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
