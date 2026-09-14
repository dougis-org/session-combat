## GitHub Issues

- #721

## Why

- Problem statement: `CampaignChat` always believes no session is active, even when one is. `app/campaigns/[id]/layout.tsx` no longer passes `activeSessionId`/`onSessionChange` to `<CampaignChat>` (it only receives `campaignId` and `onSizeChange`), so `CampaignChat`'s default (`activeSessionId = null`) is never corrected. The one channel that could correct it — the SSE `session` event handled in `lib/components/CampaignChat/useChatFeed.ts` via `onSessionChange?.(...)` — silently no-ops because `onSessionChange` is `undefined`. Meanwhile `SessionControl`, in the same page header, correctly shows the active session because it does its own independent fetch and its own `useCampaignStream` subscription. The result is exactly issue #721's report: an active session exists, but chat doesn't see it.
- Why now: this is a regression, not a pre-existing gap. Commit `3c53030` ("Implement SessionControl state changes and integration", merged ~2 weeks ago) refactored `SessionControl` to own an `initialSessionId`-based fetch and, in the same diff, removed the `activeSessionId`/`onSessionChange` props `CampaignLayout` used to pass to `CampaignChat`. The same commit deleted three tests that pinned exactly this contract (`TC-3.11`, `TC-3.12` in `tests/unit/components/CampaignLayout.test.tsx`, and `T3-3`) rather than adapting them, so nothing caught the gap. This is the second time this class of bug has hit this feature area (see the `#443` cross-instance transport delivery history), so the fix should close the architectural weakness, not just restore the removed props.
- Business/user impact: dice rolling and session-scoped chat features are gated on `activeSessionId` being non-null client-side (see `RollEntryStrip`/composer gating referenced in `openspec/specs/roll-share-ui/spec.md`). While this bug is live, every player's chat panel incorrectly disables session-scoped functionality and shows "No active session" for the entire duration of a real, live session — a highly visible, core-feature-breaking bug with no workaround short of a hard page reload timed after the session start event happens to arrive (which it currently never does, since `onSessionChange` is wired to nothing).

## Problem Space

- Current behavior:
  - `CampaignLayout` (`app/campaigns/[id]/layout.tsx`) fetches `/api/campaigns/${id}` once on mount to populate `campaignName` and an `initialSessionId` state, but `initialSessionId` is now used only to gate rendering `<SessionControl campaignId={id} initialSessionId={initialSessionId} />` in the header. It is not passed to `<CampaignChat>` at all.
  - `SessionControl` (`lib/components/SessionControl.tsx`) takes `initialSessionId` as a prop, seeds its own `useState`, and separately opens its own `useCampaignStream(campaignId, handler)` subscription to update that state on `session` events. It also mutates the state directly and optimistically after its own start/end/force-end/reconcile HTTP calls.
  - `CampaignChat` (`lib/components/CampaignChat/index.tsx`) takes `activeSessionId`/`onSessionChange` as optional props (defaulting to `null`/`undefined`) and forwards them into `useChatFeed`, which opens its own separate `useCampaignStream` subscription (needed regardless, for `message`/`roll` events) and calls `onSessionChange?.(e.data.activeSessionId)` when a `session` event arrives. With no props supplied, this is a dead code path today.
  - Two independent SSE subscriptions to the same campaign's stream already exist per page load (one for `SessionControl`, one for `CampaignChat`/`useChatFeed`) — this is an accepted pattern in `lib/server/transport.ts` (the registry supports multiple concurrent subscriptions per user), not something this change needs to collapse into one connection.
- Desired behavior: `CampaignChat` reflects the campaign's true `activeSessionId` on initial load and reacts to `session` stream events, independently of `SessionControl`, with no prop drilling through `CampaignLayout` connecting the two components' session awareness. Neither component's internal refactor should be able to silently break the other's session-state correctness again.
- Constraints:
  - No new backend endpoints or transport-layer changes — `GET /api/campaigns/:id` and the existing `session` SSE event already carry everything needed.
  - `SessionControl`'s mutation flows (start/end/force-end/reconcile) must keep working exactly as today; whatever shared mechanism is introduced must support directly setting the current value after a successful mutation, not just reading stream-driven updates.
  - Preserve the existing `openspec/specs/roll-share-ui/spec.md` requirement that `CampaignChat` behaves correctly for both `activeSessionId === null` (roll/session UI disabled) and non-null (enabled) — the mechanism for how it learns that value may change, but the described UI behavior for each value must not regress.
- Assumptions:
  - `GET /api/campaigns/:id` remains a cheap-enough call to run independently from two components on the same page (it already runs twice today in effect — once in `CampaignLayout`, and `SessionControl.reconcileFromCampaign` also calls it on 409).
  - It's acceptable for `CampaignLayout`'s own fetch to keep existing purely for `campaignName`, dropping its now-redundant `activeSessionId`/`initialSessionId` tracking once both children self-supply their own.
- Edge cases considered:
  - Component mounts before the initial fetch resolves: both `SessionControl` and `CampaignChat` need a defined "loading" vs. "known null" vs. "known non-null" state, matching `SessionControl`'s existing `initialSessionId: string | null | undefined` pattern (undefined = not yet known).
  - A `session` SSE event arrives before the initial fetch resolves (race): the shared mechanism must not let a stale fetch response overwrite a more recent stream-driven value.
  - `SessionControl`'s optimistic set-after-mutation (e.g. immediately after a 201 from start-session) must be visible to `CampaignChat` too, without `CampaignChat` needing to wait for the `session` SSE event that a same-instance `emitFiltered` fast path would otherwise deliver almost immediately anyway — otherwise the DM who just clicked "Start Session" would see their own chat panel lag behind their own header control.
  - Campaign switch (navigating between campaigns via `key={id}` remount): session state must reset per campaign, not leak the previous campaign's `activeSessionId`.

## Scope

### In Scope

- A shared, reusable mechanism (hook) for tracking a campaign's `activeSessionId`: initial fetch, `session` SSE event handling, and an exposed way to set the value directly (for optimistic updates after mutations).
- Refactoring `SessionControl` to use this shared mechanism instead of its own hand-rolled fetch/subscribe/state.
- Refactoring `CampaignChat` (and/or `useChatFeed`) to use this shared mechanism instead of relying on props threaded from `CampaignLayout`.
- Updating `CampaignLayout` to stop threading `activeSessionId`/`onSessionChange`/`initialSessionId` between its children.
- Updating the `roll-share-ui` spec's `CampaignChat accepts activeSessionId prop` requirement to reflect the new contract (prop removed, or repurposed as an optional override — decided in design.md).
- Restoring, in spirit and adapted to the new contract, the regression coverage deleted in commit `3c53030` (`TC-3.11`, `TC-3.12`, `T3-3`) plus new coverage for the shared mechanism itself.
- Updating all directly affected unit tests (`CampaignLayout.test.tsx`, `SessionControl.test.tsx`, `SessionControlReactive.test.tsx`, `CampaignChat` test suite) to the new prop/hook contract.

### Out of Scope

- Any change to the SSE transport layer (`lib/server/transport.ts`), the `session` event shape, or the number/pattern of concurrent SSE subscriptions per page — this change is about client-side state ownership, not delivery.
- Any change to the session start/end/force-end API routes or their business rules.
- Any change to `RollEntryStrip` or other consumers of `activeSessionId` beyond what's needed for them to keep working through whatever `CampaignChat` continues to expose.
- Consolidating `SessionControl`'s and `CampaignChat`'s separate SSE connections into one shared connection — explicitly not needed to fix this bug and adds risk/scope disproportionate to the fix.

## What Changes

- New shared hook (name/location decided in `design.md`, natural home `lib/hooks/` alongside `useCampaignStream.ts`/`useIsDM.ts`) encapsulating: initial `activeSessionId` fetch, `session`-event subscription via `useCampaignStream`, race-safe reconciliation between the two, and a setter for optimistic local updates.
- `lib/components/SessionControl.tsx`: drop the `initialSessionId` prop, local `useState`, and the manual `useCampaignStream` subscription (lines ~13-31) in favor of the shared hook; keep `handleStart`/`handleEnd`/`handleForceEnd`/`reconcileFromCampaign` working via the hook's setter.
- `lib/components/CampaignChat/index.tsx` and `lib/components/CampaignChat/useChatFeed.ts`: adopt the shared hook internally instead of accepting `activeSessionId`/`onSessionChange` solely from the caller; decide in `design.md` whether the external prop is removed entirely or kept as an optional override for testability.
- `app/campaigns/[id]/layout.tsx`: stop fetching/tracking `activeSessionId`/`initialSessionId` for the purpose of threading it to children; `SessionControl` and `CampaignChat` are rendered with no session-related props (`campaignId` only, plus each component's own unrelated props like `onSizeChange`).
- `openspec/specs/roll-share-ui/spec.md`: update the `MODIFIED CampaignChat accepts activeSessionId prop` requirement to match the new contract.
- Test updates across `tests/unit/components/CampaignLayout.test.tsx`, `tests/unit/components/SessionControl.test.tsx`, `tests/unit/components/SessionControlReactive.test.tsx`, and the `CampaignChat` test suite, including restored/adapted regression coverage for "an already-active session is visible to chat on load" and "a session started/ended after load updates chat."

## Risks

- Risk: The shared hook's optimistic-set-after-mutation path (for `SessionControl`) and its stream-driven update path could race, e.g. a slightly stale `session` SSE event arriving after a newer optimistic set, reverting the value.
  - Impact: Momentary or persistent incorrect `activeSessionId` shown to the acting DM right after they start/end a session.
  - Mitigation: Design the hook's internal state transitions explicitly (e.g. last-write-wins by a monotonic source, or simply treating any explicit `setActiveSessionId` call as authoritative until the next differing SSE event) and cover with a unit test simulating out-of-order arrival.
- Risk: Two independent hook instances (one in `SessionControl`, one in `CampaignChat`) each issue their own `GET /api/campaigns/:id` fetch and open their own SSE subscription — no new inefficiency versus today, but also no improvement, and it's easy to mistakenly "fix" this by adding a shared context/singleton that reintroduces cross-component coupling.
  - Impact: None functionally; flagged so implementation doesn't over-correct into the same class of coupling this change is fixing.
  - Mitigation: Explicitly document in `design.md` that per-consumer independence is intentional, not a gap to close later.
- Risk: Changing `CampaignChat`'s public prop contract (removing/changing `activeSessionId`/`onSessionChange`) is a breaking change to an existing OpenSpec requirement (`roll-share-ui` spec) and to any other current or future caller of `CampaignChat` beyond `CampaignLayout`.
  - Impact: Spec/implementation drift if the spec update is missed; a future caller could regress by assuming the old prop still works.
  - Mitigation: Update the spec in this same change (in scope above); confirm via repo-wide search that `CampaignLayout` is `CampaignChat`'s only current caller before removing the prop outright.

## Open Questions

- Question: Should `CampaignChat` keep `activeSessionId` as an optional prop (for tests/future flexibility) that overrides the hook's own value when supplied, or should the prop be removed entirely and the hook become the sole source?
  - Needed from: design decision, to be resolved in `design.md`.
  - Blocker for apply: no.
- Question: For the race between an optimistic `setActiveSessionId` call and an in-flight/delayed `session` SSE event, is "last explicit call wins, including from SSE" sufficient, or does the hook need a monotonic sequence/timestamp to correctly order optimistic vs. stream updates?
  - Needed from: design decision, to be resolved in `design.md`, informed by re-reading `SessionControl`'s existing `reconcileFromCampaign` comments (which already reason carefully about "session may have ended between the 409 and this GET resolving").
  - Blocker for apply: no.

## Non-Goals

- Consolidating the two components' separate SSE subscriptions into a single shared connection.
- Changing transport-layer delivery semantics, the `CampaignStreamEvent` type, or server-side session lifecycle routes.
- Any visual/UX redesign of `SessionControl` or the "No active session" chat state beyond what's needed to make the underlying data correct.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
