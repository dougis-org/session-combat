## Context

`lib/components/CampaignChat.tsx` (1054 lines) currently owns three unrelated concerns:
drawer/dock chrome, chat feed + composer, and dice-pool selection + roll submission. The
dice-pool piece is the one that doesn't belong there structurally: `lib/components/GlobalDiceFab.tsx`
already rolls dice independent of chat, but has to duplicate `CampaignChat`'s pool-selection
state machine and route submission through `lib/dice/diceSessionBridge.ts`'s
`requestRoll`/`onRollRequested`, a presence-gated singleton bridge that only delivers if a
`CampaignChat` instance happens to be mounted. Chat's feed, by contrast, is already a pure
consumer of rolls — it renders them from the SSE `'roll'` stream event regardless of who
submitted them (`onStreamEvent` in the current file, ~line 569).

Stakeholders: single-maintainer project (dougis); no external API consumers of these
internals — `CampaignChat` and `GlobalDiceFab` are the only two production callers of the
bridge's request/response path, confirmed by repo-wide search.

Constraint carried over from the codebase's existing dice-subsystem conventions: dice
generation stays client-side with server-side validation on submit (`n/a` — not changing
the server route), and roll visibility stays validated against the fixed `group`/`dm-only`
allowlist at the input boundary.

## Goals / Non-Goals

**Goals:**
- Roll-pool selection state exists once, shared by every trigger UI.
- Roll submission (POST `/api/campaigns/[id]/rolls`) is callable directly by any component
  — not gated behind whether `CampaignChat` happens to be mounted.
- Consumers of rolls (chat's feed) consume the SSE stream; they never gate or route
  another component's submission.
- Chat's on-ingest auto-scroll-to-roll behavior is preserved exactly, now living entirely
  on the consumption side.
- `CampaignChat.tsx` drops under the project's readability/size guidance via cohesion-based
  splits, with the public import path (`@/lib/components/CampaignChat`) unchanged.
- `GlobalDiceFab`'s roll-to-session-chat action stops silently failing when chat isn't
  mounted (bug fix riding along with the decoupling).

**Non-Goals:**
- Changing the server route, its request/response shape, or server-side validation.
- Changing `GlobalDiceFab`'s two-step "roll locally, then explicitly send" interaction
  model.
- Unifying the visual presentation of the chat-docked panel and `GlobalDiceFab`'s floating
  panel.
- Adding new roll-visibility scopes or other new dice features.
- Restructuring chat's message/composer/mention logic beyond relocating it unchanged.

## Decisions

### 1. New `lib/dice/` module owns pool-selection state and submission, independent of any component

`lib/dice/useDicePoolState.ts` — extracted verbatim from `CampaignChat`'s current
`useDicePool` minus the submission call: pool state, modifier text (with existing
clamping to `MAX_MODIFIER`), add/remove (clamped to `MAX_PER_DIE`), `poolTotal`,
`isOpen`/open-close/outside-click/Escape handling parameterized on `triggerRef`/`panelRef`
so it stays reusable for two different trigger placements. Returns pool state + a
`buildRoll()` function that produces `{ formula, rolls, total }` from the current pool
(pure, no network call) — this is the piece both `CampaignChat`'s docked panel and
`GlobalDiceFab` need identically today, just currently forked into two copies.

`lib/dice/useRollSubmission.ts` — extracted from `CampaignChat`'s current `submitRoll`:
takes `campaignId`, returns a `submitRoll(formula, rolls, total, visibility)` function that
POSTs to `/api/campaigns/[id]/rolls`, maps `201 → 'success'`, `409 → 'conflict'`,
else `'error'`, network throw → `'error'`. No knowledge of chat, feed, or scrolling — a
session-scoped capability, not a chat-scoped one.

Alternative considered: keep a single combined `useDicePool` (selection + submission) and
just relocate it as a shared hook. Rejected — this was tried conceptually and still forces
every consumer to accept a submission dependency even when it only wants to observe
disabled/pool state (and it's what produced the current duplication, since submission
needing a `campaignId`/`activeSessionId` pairing doesn't compose cleanly with
`GlobalDiceFab`'s presence-driven, not-directly-session-scoped call site). Splitting
selection from submission lets each consumer opt into only what it needs.

### 2. `lib/components/dice/` holds pure presentational components, driven by the shared hooks

`DicePoolPanel.tsx` and `DiceTriggerButton.tsx` move out of `CampaignChat.tsx` largely
as-is (they're already prop-driven, taking a `dp` object shaped like the hook's return
value). `GlobalDiceFab.tsx`'s inline panel markup is visually distinct today (modal-style
overlay vs. chat's docked panel) — per Non-Goals, that visual difference is preserved;
only the underlying pool-state/submission plumbing is shared. `GlobalDiceFab` may continue
to render its own panel JSX using the shared hook's return value rather than being forced
onto the extracted `DicePoolPanel` component, if reusing `DicePoolPanel` directly does not
fit its modal presentation without changing its look. This is an implementation-time call;
the requirement is shared *state/logic*, not shared *markup*.

### 3. `diceSessionBridge.ts` narrows to presence only; `requestRoll`/`onRollRequested` removed

Once `GlobalDiceFab` calls `useRollSubmission` directly, nothing needs to ask "whichever
`CampaignChat` instance is mounted" to submit on its behalf. `announcePresence`/
`clearPresence`/`onPresenceChange` stay unchanged — presence (is there an active session to
roll into) is a legitimate cross-cutting signal independent of submission routing.
`requestRoll`, `onRollRequested`, `RollRequestPayload`, `RollRequestResult`,
`RollRequestListener`, and the `RollOutcome`-as-request-shape usage are deleted from the
bridge. `CampaignChat`'s effect that currently calls `onRollRequested` (the one wired to
`submitRoll` for externally-requested rolls) is deleted entirely — there is no longer an
"externally requested roll" concept once external callers submit directly.

Alternative considered: keep `onRollRequested` as a notification-only channel (fire-and-
forget, no `onResult` ack) in case a future second chat-like surface wants to react to
roll requests. Rejected for now per proposal's Non-Goals/scope discipline — nothing in the
codebase needs it today, and the module comment already documents the assumption ("at most
one CampaignChat instance is mounted app-wide") that made the request/response shape
necessary in the first place; that assumption goes away entirely once submission isn't
routed through a mounted-component gate. Re-add only if a concrete future consumer needs it.

### 4. `CampaignChat.tsx` splits into cohesion-based submodules, none containing roll-submission logic

```
lib/components/CampaignChat/
  index.tsx        — coordinator: wires useDockState + useChatFeed + the shared dice hooks,
                      renders drawer shell, delegates to ChatFeed/Composer/dice components
  ChatFeed.tsx      — ChatFeed, ChatMessageItem, RollFeedItem, getVisibilityMarker,
                      resolveUsername (feed-rendering pure components)
  Composer.tsx      — ChatComposer, MentionDropdown
  useDockState.ts   — dockReducer, resolveHeight, DragHandle's drag-resize handlers,
                      pin/expand/collapse, persisted-size init/validation (PIN_KEY,
                      CHAT_SIZE_KEY, NAVBAR_HEIGHT, isValidPersistedSize, safeGet/Set/Remove)
  useChatFeed.ts    — SSE wiring (onStreamEvent for message/roll/session), history fetch +
                      infinite-scroll pagination, feed/seenIds state, scrollToBottom
                      (including the on-roll-ingest scroll-to-current-user check)
  DragHandle.tsx    — trivial presentational piece, kept separate as originally filed
```

`index.tsx` re-exports `CampaignChat` so `@/lib/components/CampaignChat` continues to
resolve for all 9 existing test files that import it that way — no test import path
changes.

`useChatFeed` owns the feed array, `seenIds` dedup set, and `scrollToBottom`. It exposes a
`handleRollIngested`-shaped internal reaction inside its own SSE handler (unchanged
`scrollToBottom(roll.rollerId === user?.userId)` logic) — this satisfies "auto-scroll on
ingest" without any dependency on submission. The optimistic `handleRollPosted`
append-and-force-scroll path is deleted; `index.tsx` no longer needs `submitRoll`'s result
to touch the feed at all — a submitted roll only ever enters the feed via the SSE stream,
same as any other client's roll.

Alternative considered: extract a single `useCampaignChatState` mega-hook instead of two
(`useDockState` + `useChatFeed`). Rejected — dock/drawer state and feed/SSE state don't
share data dependencies (dock never reads feed state or vice versa) beyond both being read
by `index.tsx` for rendering, so splitting them is a clean cut with no prop-threading
tax, and keeps each hook under a size that's easy to review independently.

### 5. `useDicePool`'s `activeSessionId`/`streamStatus`-driven trigger-disable logic moves into `index.tsx`, not into the shared hook

The current `isTriggerDisabled = activeSessionId !== null ? streamStatus !== 'open' : true`
check is chat-specific (it depends on chat's SSE connection status). `GlobalDiceFab` has
its own, different disable condition (whether `presence` exists at all, no `streamStatus`
concept). So this check is computed by each consumer from its own inputs and passed to
`DiceTriggerButton` as a prop, rather than being baked into the shared
`useDicePoolState`/`useRollSubmission` hooks.

## Risks / Trade-offs

- [Risk] Effect-ordering or stale-closure bug when splitting `CampaignChat`'s single
  component-scoped closure (refs, state, effects all in one function) across
  `useDockState`/`useChatFeed`/`index.tsx`. → Mitigation: preserve each existing
  `useEffect`'s dependency array and body verbatim during extraction; only change *where*
  the function is defined, not its logic. Full existing unit test suite (13 files under
  `tests/unit/components/CampaignChat/`) must pass unchanged, which exercises drawer, SSE,
  history, unread, members, visibility, scene, and dice-pool behavior.
- [Risk] `useChatFeed` and `useDockState` both need `feedRef`/refs that currently live in
  the single component; if a ref is created inside a hook, `index.tsx` must still be able
  to attach it to the DOM node it renders. → Mitigation: refs used by both DOM rendering
  (in `index.tsx`'s JSX) and hook logic (e.g. `feedRef`, `drawerRef`) are created in
  `index.tsx` and passed into the hooks as arguments, not created inside the hooks — same
  pattern already used for `triggerRef`/`panelRef` passed into `useDicePool` today.
- [Risk] Deleting `requestRoll`/`onRollRequested` breaks an untracked consumer. →
  Mitigation: TypeScript build fails immediately on any remaining import of the removed
  exports; also re-run the repo-wide search as a task-list step immediately before
  deletion.
- [Risk] `GlobalDiceFab` calling `useRollSubmission` directly instead of going through the
  bridge changes its error-handling surface (today: `onResult` callback from
  `requestRoll`; after: the hook returns a `Promise<RollSubmitResult>` directly, matching
  `CampaignChat`'s existing `submitRoll` shape). → Mitigation: `GlobalDiceFab`'s
  `handleSendToChat` already `await`s an eventual outcome via `onResult`; swapping to
  `await submitRoll(...)` and mapping the returned `RollSubmitResult` to the existing
  `sendState` transitions (`'success' → 'sent'`, else `'failed'`) is a direct, mechanical
  replacement with no new failure modes introduced.
- [Trade-off] Losing chat's optimistic roll append means the roller sees their own roll
  appear via the SSE round-trip instead of instantly. Per proposal's Open Questions, this
  is accepted as the default unless the requester corrects it before `tasks.md` is
  finalized — flagged again here so it's visible in the design, not just the proposal.

## Migration Plan

Single-PR refactor, no deploy-time migration or data changes involved (no schema, no
runtime config, no feature flag). Rollback is a plain revert since there's no persisted
state shape change — `LocalStorage` keys (`PIN_KEY`, `CHAT_SIZE_KEY`) keep their existing
names and shapes.

Suggested implementation order (elaborated in `tasks.md`):
1. Add `lib/dice/useDicePoolState.ts` and `lib/dice/useRollSubmission.ts`, unit-tested in
   isolation, without yet touching `CampaignChat.tsx` or `GlobalDiceFab.tsx`.
2. Add `lib/components/dice/DicePoolPanel.tsx` and `DiceTriggerButton.tsx`.
3. Switch `CampaignChat.tsx` to consume the new shared hooks/components in place of its
   inline `useDicePool`/`DicePoolPanel`/`DiceTriggerButton` — verify existing dice-pool
   tests still pass before proceeding, since this is the highest-risk single step.
4. Switch `GlobalDiceFab.tsx` to the shared hooks; replace its `requestRoll` call with a
   direct `submitRoll` call.
5. Delete `requestRoll`/`onRollRequested` and related types from
   `diceSessionBridge.ts`; delete `CampaignChat.diceSessionBridge.test.tsx`; update
   `diceSessionBridge.test.ts` and `GlobalDiceFab.test.tsx`.
6. Split the remainder of `CampaignChat.tsx` (now smaller, with dice code already
   extracted) into `ChatFeed.tsx`, `Composer.tsx`, `useDockState.ts`, `useChatFeed.ts`,
   `DragHandle.tsx`, `index.tsx`.
7. Full test suite + build pass; manual smoke check of chat drawer resize/pin, dice roll
   from both chat and `GlobalDiceFab` with chat closed.

## Open Questions

- Carried from proposal.md: should the chat-docked dice panel retain any local optimistic
  feedback, or is pure SSE-driven consumption acceptable? Default (no blocker): pure SSE
  consumption, per Decision 4.
