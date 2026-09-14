## Context

- Relevant architecture:
  - `app/campaigns/[id]/layout.tsx` renders `SessionControl` (header) and `CampaignChat` (docked panel) as siblings for a given campaign.
  - `lib/hooks/useCampaignStream.ts` opens one `EventSource` per call to `/api/campaigns/:id/stream`; each hook instance is an independent subscription (the transport registry, `lib/server/transport.ts`, is designed to support multiple concurrent subscriptions per user/campaign — e.g. multiple tabs — so two independent subscriptions from one page is an accepted, not novel, pattern).
  - `lib/hooks/useIsDM.ts` is the existing convention for a small campaign-scoped data hook: `useState`/`useEffect`, a `cancelled` flag for stale-response guarding, `console.error` on unexpected failures, returns a plain object (`{ value, loading }`).
  - Existing unit tests mock hooks directly via `jest.mock('@/lib/hooks/useIsDM', ...)` (see `tests/unit/components/SessionControl.test.tsx:6-8`) rather than driving behavior purely through component props — this is the established testing convention this change should follow for the new hook.
- Dependencies: `GET /api/campaigns/:id` (already returns `activeSessionId`), the `session`-typed `CampaignStreamEvent` (`lib/types.ts`), `useCampaignStream`.
- Interfaces/contracts touched: `SessionControl` props, `CampaignChat` props, `useChatFeed` args, `openspec/specs/roll-share-ui/spec.md`'s `CampaignChat accepts activeSessionId prop` requirement.

## Goals / Non-Goals

### Goals

- One hook, `useActiveSessionId(campaignId)`, is the single implementation of "fetch + stream-subscribe + optimistic-set" logic for a campaign's active session id.
- `SessionControl` and `CampaignChat` each call this hook independently — no session-related props flow through `CampaignLayout`.
- The hook is race-safe: a slow initial fetch can never overwrite a value already established by a stream event or an explicit optimistic set.
- Existing `SessionControl` mutation behavior (start/end/force-end/reconcile-after-409) is preserved exactly, backed by the hook's setter.
- `CampaignChat`'s documented behavior for `activeSessionId === null` vs. non-null (roll/session UI enabled/disabled, per `roll-share-ui` spec) is preserved.

### Non-Goals

- Merging the two components' SSE subscriptions into one connection.
- Any change to `lib/server/transport.ts`, the `CampaignStreamEvent` type, or session lifecycle API routes.
- A React Context/provider-based singleton for session state — deliberately rejected (see Decision 2).

## Decisions

### Decision 1: New hook `useActiveSessionId(campaignId)` in `lib/hooks/`

- Chosen: Add `lib/hooks/useActiveSessionId.ts` exporting
  ```ts
  function useActiveSessionId(campaignId: string): {
    activeSessionId: string | null | undefined // undefined = not yet loaded
    setActiveSessionId: (id: string | null) => void
  }
  ```
  Internally: on mount and whenever `campaignId` changes, reset to `undefined`; fetch `/api/campaigns/${campaignId}` for the baseline value; simultaneously call `useCampaignStream(campaignId, handler)` where `handler` reacts to `session`-typed events. A `receivedAuthoritative` ref (reset alongside state on `campaignId` change) is set to `true` by either the stream handler or the returned `setActiveSessionId`; the fetch's resolution only calls `setState` if `receivedAuthoritative` is still `false` at that point — otherwise it's discarded as stale. `setActiveSessionId` and the stream handler both set `receivedAuthoritative = true` and call `setState` unconditionally (each is authoritative for the transition it represents).
- Alternatives considered:
  - Keep per-component hand-rolled logic (status quo) — rejected, this is the duplication the proposal is fixing and is what let the regression happen invisibly.
  - A shared React Context/provider mounted once in `CampaignLayout`, read by both children — rejected, see Decision 2.
  - Fold session-id tracking into `useCampaignStream` itself (make it stream-aware of `session` events specifically) — rejected: `useCampaignStream` is a generic transport primitive used for `message`/`roll`/`change`/`session`/`heartbeat` alike; giving it campaign-domain awareness of one specific event's semantics (and an HTTP fetch) breaks its current single responsibility and would force every caller (including ones that don't care about session state) to pay for it.
- Rationale: A plain hook, called independently by each consumer, mirrors the existing `useIsDM` convention exactly, requires no new provider wiring in `CampaignLayout`, and — critically — cannot be "silently orphaned" by a refactor to a sibling component the way prop-drilling was, because there is no sibling dependency at all.
- Trade-offs: Two independent `GET /api/campaigns/:id` fetches and two independent SSE subscriptions per page load (one per hook instance) — no worse than today, and explicitly accepted as a non-goal to optimize (Goals/Non-Goals above).

### Decision 2: Reject a shared Context/provider approach

- Chosen: Independent hook instances, no Context.
- Alternatives considered: A `CampaignSessionProvider` mounted once in `CampaignLayout`, consumed via `useContext` by both `SessionControl` and `CampaignChat`.
- Rationale: A Context provider re-centralizes ownership in `CampaignLayout` — precisely the shape that broke last time (a `CampaignLayout`-level refactor, or a refactor of whichever component sits between the provider and a consumer, can again silently drop a `<Provider>` wrapper or a `useContext` call with no type error, since context has no required-prop enforcement). Two independent hook calls have no such shared failure point: removing the hook call from one component cannot affect the other's correctness, only its own.
- Trade-offs: Forgoes the (here, non-goal) efficiency win of one shared fetch/subscription; accepted per Decision 1's trade-off.

### Decision 3: `CampaignChat`'s prop contract — remove `activeSessionId`/`onSessionChange`, call the hook internally

- Chosen: Remove the `activeSessionId` and `onSessionChange` props from `CampaignChatProps` entirely. `CampaignChat` calls `useActiveSessionId(campaignId)` directly and passes the resulting `activeSessionId` (and, where a mutation-triggering child needs it, `setActiveSessionId`) down to `useChatFeed` and any other internal consumer. `useChatFeed`'s `onStreamEvent` drops its `session`-type branch and its `onSessionChange` parameter entirely, since session-event handling now lives solely inside `useActiveSessionId`.
- Alternatives considered: Keep `activeSessionId` as an optional override prop (falls back to the hook's value when `undefined`) for direct-prop testability without mocking the hook.
- Rationale: `CampaignLayout` is confirmed (via repo-wide search) to be `CampaignChat`'s only current caller, so there is no external consumer depending on the prop today. The codebase's established test convention is mocking hooks directly (`jest.mock('@/lib/hooks/useIsDM', ...)`), not driving behavior through override props, so an override prop would be untested dead flexibility rather than a real testability win. Removing the props outright also removes any possibility of a future `CampaignLayout` refactor reintroducing this exact bug by once again failing to pass them through.
- Trade-offs: `CampaignChat`'s existing unit tests that currently pass `activeSessionId` as a prop must instead mock `useActiveSessionId` — a one-time test-authoring cost, paid now, in this change (see Scope).

### Decision 4: `SessionControl`'s prop contract — drop `initialSessionId`, call the hook internally

- Chosen: `SessionControlProps` becomes `{ campaignId: string }` only. Internally, `const { activeSessionId, setActiveSessionId } = useActiveSessionId(campaignId)` replaces the current `useState(initialSessionId)` plus its own manual `useCampaignStream` subscription (`lib/components/SessionControl.tsx:13-31`). `handleStart`, `handleEnd`, `handleForceEnd`, and `reconcileFromCampaign` are otherwise unchanged, calling `setActiveSessionId(...)` exactly where they call `setActiveSessionId`/`setActiveSessionId`(old local setter) today.
- Alternatives considered: Keep `initialSessionId` as a prop and only replace the internal stream subscription — rejected, this still requires `CampaignLayout` to fetch and thread a value, preserving the exact coupling this change removes.
- Rationale: Symmetric with Decision 3; `SessionControl` becomes fully self-sufficient given only `campaignId`, matching `CampaignChat`.
- Trade-offs: `CampaignLayout`'s own `initialSessionId` state/fetch effect (currently used only to gate rendering `SessionControl` until the value is known) is deleted; `SessionControl` must handle its own "not yet loaded" state (render `null` while `activeSessionId === undefined`, same as `isDM`'s existing `loading` gate) instead of relying on the parent to delay rendering it.

### Decision 5: `CampaignLayout` simplification

- Chosen: Remove the `initialSessionId` state and its fetch effect from `CampaignLayout` entirely (the `campaignName` fetch stays, now fetching only what it needs). Render `<SessionControl campaignId={id} />` unconditionally in the header (it internally renders `null` until both `useIsDM` and `useActiveSessionId` have resolved) and `<CampaignChat campaignId={id} onSizeChange={setIsChatLarge} />` unchanged from today's call site except no session props were ever there to remove from this specific call — this decision is really "confirm nothing further needs adding here," i.e. the fix lives entirely in the two child components adopting the shared hook.
- Alternatives considered: none — this falls out directly from Decisions 3 and 4.
- Rationale: n/a (consequence of prior decisions).
- Trade-offs: none identified.

## Proposal to Design Mapping

- Proposal element: "New shared hook ... encapsulating initial fetch, session-event subscription, race-safe reconciliation, and a setter."
  - Design decision: Decision 1.
  - Validation approach: unit tests for `useActiveSessionId` (new `tests/unit/hooks/useActiveSessionId.test.tsx`) covering initial fetch, stream-driven update, optimistic-set, and the stale-fetch-after-stream-event race.
- Proposal element: "`SessionControl`: drop `initialSessionId` prop ... in favor of the shared hook."
  - Design decision: Decision 4.
  - Validation approach: updated `tests/unit/components/SessionControl.test.tsx` / `SessionControlReactive.test.tsx`, mocking `useActiveSessionId` instead of driving `initialSessionId` via props.
- Proposal element: "`CampaignChat`/`useChatFeed`: adopt the shared hook internally instead of accepting props from the caller."
  - Design decision: Decision 3.
  - Validation approach: updated `CampaignChat` test suite, mocking `useActiveSessionId`; restored/adapted `TC-3.11`/`TC-3.12`-equivalent assertions at the `CampaignChat` level (an already-known active session is reflected without any parent involvement; a session-end stream event clears it).
- Proposal element: "`CampaignLayout`: stop threading `activeSessionId`/`onSessionChange`/`initialSessionId` between its children."
  - Design decision: Decision 5.
  - Validation approach: updated `tests/unit/components/CampaignLayout.test.tsx` — replace the deleted `TC-3.11`/`TC-3.12`/`T3-3` cross-component-propagation tests with tests asserting `CampaignLayout` passes no session props to either child (the coupling is gone, not just re-fixed).
- Proposal element: "Update `roll-share-ui` spec's `CampaignChat accepts activeSessionId prop` requirement."
  - Design decision: Decision 3.
  - Validation approach: spec review in this change's `specs/roll-share-ui/spec.md` delta (next artifact).

## Functional Requirements Mapping

- Requirement: An already-active session (set before the component mounted) is reflected in `CampaignChat` without requiring a subsequent `session` stream event.
  - Design element: Decision 1's initial-fetch path in `useActiveSessionId`.
  - Acceptance criteria reference: `specs/roll-share-ui/spec.md` (this change) — "Scenario: activeSessionId reflects an already-active session on load."
  - Testability notes: mount `CampaignChat` with `useActiveSessionId`'s underlying fetch mocked to resolve a non-null `activeSessionId`; assert roll/session UI is enabled without emitting any stream event.
- Requirement: A `session` stream event updates `CampaignChat`'s and `SessionControl`'s state independently and consistently.
  - Design element: Decision 1's stream-handler path.
  - Acceptance criteria reference: same spec file — "Scenario: session event updates both SessionControl and CampaignChat independently."
  - Testability notes: two independent render trees (or two hook-consumer test harnesses) each observing the same simulated `session` event via their own mocked `useCampaignStream` call.
- Requirement: `SessionControl`'s own start/end/force-end/reconcile actions are immediately reflected in its own UI (unchanged from today) and are not reverted by a subsequently-arriving, now-redundant `session` stream event for the same transition.
  - Design element: Decision 1's `receivedAuthoritative` handling — the optimistic `setActiveSessionId` call and the later confirming stream event both set the same value, so no revert occurs (idempotent), and a stale fetch cannot override either.
  - Acceptance criteria reference: same spec file — "Scenario: optimistic session-start update is not reverted by a stale fetch or duplicate event."
  - Testability notes: unit test ordering fetch resolution after both `setActiveSessionId` and a stream event, asserting final state matches the optimistic value.

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: No regression class where one component's internal refactor can silently break another component's session-state correctness.
  - Design element: Decisions 1–5 collectively (no cross-component prop/context dependency for session state).
  - Acceptance criteria reference: `specs/roll-share-ui/spec.md` — "Scenario: CampaignLayout passes no session-related props to SessionControl or CampaignChat."
  - Testability notes: `CampaignLayout.test.tsx` asserts the absence of `activeSessionId`/`onSessionChange`/`initialSessionId` in props captured from mocked children.
- Requirement category: performance
  - Requirement: No new fixed-delay polling or additional SSE connections beyond the two subscriptions already present today (one per `SessionControl`, one per `CampaignChat`).
  - Design element: Decision 1 (hook reuses `useCampaignStream` per-call, same pattern as today).
  - Acceptance criteria reference: n/a (regression check, not a new scenario) — verified by design review, not a spec scenario.
  - Testability notes: code review confirms `useActiveSessionId` does not introduce polling or a third subscription.

## Risks / Trade-offs

- Risk/trade-off: `receivedAuthoritative`-gated fetch-discard logic is the one genuinely new piece of nontrivial state-machine logic in this change.
  - Impact: A bug here could reintroduce a subtler version of the same class of issue (stale data winning).
  - Mitigation: Dedicated unit tests for the specific race (fetch resolves after a stream event; fetch resolves after an optimistic set) before this change is considered complete; code review focused specifically on this function.
- Risk/trade-off: Removing `CampaignChat`'s public props is a breaking API change for that component.
  - Impact: Any future caller of `CampaignChat` other than `CampaignLayout` would need to know it's now hook-driven rather than prop-driven.
  - Mitigation: Confirmed single-caller today (Decision 3 rationale); documented here and in the spec update so a future second caller is a conscious decision, not a silent break.

## Rollback / Mitigation

- Rollback trigger: Post-merge discovery that `useActiveSessionId` introduces a new race/regression worse than the bug it fixes (e.g. flickering session state, or `SessionControl`'s mutation flows misbehaving).
- Rollback steps: Revert the merge commit for this change; `SessionControl` and `CampaignChat` return to their pre-change prop contracts, and `CampaignLayout` returns to threading `initialSessionId`/`activeSessionId`/`onSessionChange` (git revert is sufficient — no persisted data or migrations are involved, this is client-side-only state management).
- Data migration considerations: none — no persisted data, schema, or API contract changes.
- Verification after rollback: manually confirm an active session is visible in `SessionControl`'s header (pre-existing behavior) and re-confirm issue #721 is reopened/still tracked, since rollback restores its root cause.

## Operational Blocking Policy

- If CI checks fail: fix the failing check before proceeding; do not merge with a known-failing check for this change (client-side logic only, no infra dependency that would justify a waiver).
- If security checks fail: this change touches no auth, data access, or external input handling — no security-relevant surface is expected; treat any unexpected security finding as blocking and investigate before proceeding.
- If required reviews are blocked/stale: follow the repo's standard PR review process (see `CLAUDE.md`); do not bypass branch protection or use admin merge to work around a stale review.
- Escalation path and timeout: if blocked for more than one business day on review or CI infrastructure (not on unresolved design questions, which have none outstanding — see Open Questions below), flag to the repo owner directly rather than continuing to wait silently.

## Open Questions

- None outstanding. Both open questions raised in `proposal.md` are resolved by Decision 1 (fetch-discard-if-authoritative-received) and Decision 3 (props removed, hook called internally, tests mock the hook per existing repo convention).
