## Context

- Relevant architecture: `lib/server/transport.ts` is the single transport abstraction behind `GET /api/campaigns/[id]/stream`. It exposes `subscribe(campaignId, userId, onEvent)` and `emitFiltered(campaignId, event, canReceive)`. Two delivery mechanisms exist today:
  - A **shared, per-instance change-stream cursor** on the `campaigns` collection only (`openStream`/`demux`), used when `detectReplicaSet()` is true (Atlas). This is inherently cross-instance-safe: every instance independently observes every write to `campaigns`, regardless of which instance made it.
  - A **per-subscriber polling loop** (`pollFn`, one `setInterval` per `subscribe()` call) against the `campaigns` collection only, used when `detectReplicaSet()` is false (local/standalone Mongo).
  - A **direct, synchronous `emitFiltered()` call** made by the `messages`, `rolls`, and `sessions/active` route handlers immediately after a successful write. This walks only the calling process's in-memory `registry` Map — it is *not* cross-instance-safe. This is the root cause of reopened #443: a `session`/`roll`/`message` event never reaches a subscriber whose SSE connection is held by a different Fly machine than the one that handled the write.
- Dependencies: `lib/types.ts` (`CampaignStreamEvent` union), `lib/utils/campaignMessages.ts` (`canSeeMessage`), `lib/utils/campaignRolls.ts` (`canSeeRoll`), `storage.listMembersForCampaign`, MongoDB driver `ChangeStream`/`db.watch()`.
- Interfaces/contracts touched:
  - `lib/server/transport.ts`: `openStream`/`demux` broadened from collection-level to db-level watch across `campaigns`, `campaignMessages`, `campaignRolls`; `pollFn` broadened to poll all three collections; new per-`campaignId` "last known `activeSessionId`" state for deriving `session` events.
  - `app/api/campaigns/[id]/messages/route.ts`, `.../rolls/route.ts`, `.../sessions/active/route.ts`: direct `emitFiltered()` calls are kept as-is (same-instance fast path), unchanged in shape.
  - `lib/components/CampaignChat.tsx`: no contract change — `seenIds`-based dedup already exists for messages/rolls; `onSessionChange` is already idempotent for repeated identical values.

## Goals / Non-Goals

### Goals

- `message`, `roll`, and `session` events reach every subscriber of a campaign regardless of which server instance handled the originating write, in both Atlas (change-stream) and standalone (polling) transport modes.
- No change in delivery latency for the common single-instance/local-dev case (same-instance fast path preserved).
- No duplicate items rendered in the UI when an event is observed via both the fast path and the Mongo-observed path.
- Visibility enforcement (`canSeeMessage`, `canSeeRoll`) remains server-owned in every delivery path — no unfiltered broadcast of DM-only content.
- Test coverage proves cross-instance delivery for both transport modes (currently zero coverage of this failure mode).

### Non-Goals

- No new shared-state infrastructure (Redis, etc.).
- No change to the `activeSessionId`-gates-rolls business rule.
- No change to `assertCampaignAccess`/authorization, only to delivery reliability.
- No guarantee of message ordering/delivery beyond what already exists (`createdAt`-ordered append, at-least-once within an open connection's lifetime).

## Decisions

### Decision 1: Broaden the existing shared cursor/poll to cover all three collections, not just `campaigns`

- Chosen: In the Atlas branch, replace the collection-level `client.db().collection('campaigns').watch(...)` with a **database-level** `client.db().watch(...)` (one shared cursor per instance, as today), scoped via pipeline to the three relevant collections (`campaigns`, `campaignMessages`, `campaignRolls`). In the polling branch, extend `pollFn` to additionally query `campaignMessages` and `campaignRolls` by `campaignId` + `createdAt > since`, alongside the existing `campaigns` query.
- Alternatives considered: (a) One `watch()`/poll-interval per collection — rejected, triples Atlas change-stream/connection count per instance and violates the documented "keep the count of streams to Mongo as low as possible" principle (`docs/multi-user-campaigns/04-realtime-transport.md`). (b) Redis pub/sub for cross-instance fanout — rejected per proposal Non-Goals; MongoDB-only approach not yet exhausted and adds a new operational dependency.
- Trade-offs: `demux` must now branch on which collection a change event came from (`event.ns.coll`) to build the correct `CampaignStreamEvent` shape (`change` vs `message` vs `roll`), rather than assuming `campaigns`. Db-level watch requires the MongoDB driver/server to support it (available on any replica set, same requirement as collection-level watch, so `detectReplicaSet()` remains valid).

### Decision 2: Keep the direct `emitFiltered` same-instance fast path; the Mongo-observed path is the cross-instance-correct fallback; dedupe client-side

- Chosen: Route handlers keep calling `emitFiltered()` synchronously after a write (near-zero latency for same-instance subscribers). The broadened change-stream/poll pipeline *also* observes the same write and re-emits the same logical event to every instance's registry, including the originating instance — where it arrives as a harmless duplicate.
- Alternatives considered: Remove direct `emitFiltered`, rely solely on Mongo-observed delivery for everything — rejected: it would add change-stream lag (typically sub-second, but non-zero) or up-to-poll-interval lag (2s today) to the common single-instance case, for no correctness benefit there.
- Trade-offs: Every subscriber can now receive the same `message`/`roll` up to twice (immediate same-instance + delayed Mongo-observed), and `session` state changes up to twice. `CampaignChat.tsx`'s existing `seenIds` ref (keyed by message/roll `id`) already absorbs message/roll duplicates without a code change. `session` events are naturally idempotent (`setActiveSessionId(x)` called twice with the same `x` is a no-op re-render) so no dedup logic is needed there.

### Decision 3: Derive `session` events from `activeSessionId` field-level changes on the `campaigns` document

- Chosen: Track a small in-memory map of last-observed `activeSessionId` per `campaignId` inside `transport.ts` (seeded lazily from the first observed document for that campaign). When a newly-observed `campaigns` document's `activeSessionId` differs from the last-known value, emit `{ type: 'session', campaignId, data: { activeSessionId } }` in addition to the generic `change` event, via the same demux/poll pipeline. In the change-stream branch, use `updateDescription.updatedFields` (already available via `fullDocument: 'updateLookup'`) to cheaply detect that `activeSessionId` was part of the write before comparing; in the polling branch, compare the polled document's `activeSessionId` against the remembered value unconditionally (poll volume is already bounded by campaign + 2s interval).
- Alternatives considered: A separate `sessionEvents` collection written by `sessions/active` and watched independently — rejected, adds a new collection and a second write per session-lifecycle action for no benefit, since `activeSessionId` already lives on, and is already observed on, the `campaigns` document.
- Trade-offs: Introduces small persistent (process-lifetime) state in `transport.ts` beyond the existing `sinceRef`/registry state. Must be cleaned up when a campaign has no more registered subscribers (mirroring existing registry cleanup) to avoid unbounded growth across many distinct campaigns over a long-running process.

### Decision 4: Replicate message/roll visibility filtering in the Mongo-observed path

- Chosen: The db-level `demux` function and the extended `pollFn`, when handling a `campaignMessages`/`campaignRolls` document, apply the same `canSeeMessage`/`canSeeRoll` predicates used by the direct-emit path today, evaluated per-subscriber: the change-stream branch iterates `registry.get(campaignId)` (each subscription already carries its `userId`) and calls the predicate per subscriber before invoking `sub.handler`; the polling branch (one interval per subscription) is given its subscription's `userId` and filters before invoking its single `handler`. Both branches fetch active members via `storage.listMembersForCampaign(campaignId)` (already used by the route handlers) to build the predicate's member list, memoized per poll/change-batch to avoid redundant DB round-trips when multiple subscribers or multiple events are being processed together.
- Alternatives considered: Broadcast unfiltered via the Mongo-observed path and rely on the client to hide DM-only content — rejected outright; the roll-share-ui spec's Security requirement is explicit that visibility enforcement is server-owned, and this would leak DM-only roll/message payloads over the wire to unauthorized clients even if the UI hides them.
- Trade-offs: `lib/server/transport.ts`, previously pure infra, now imports domain visibility logic (`canSeeMessage`, `canSeeRoll`) and calls `storage.listMembersForCampaign`. This is a layering compromise — acceptable at current project size and consistent with `emitFiltered`'s existing `canReceive` callback already encoding this same coupling at the call site; flagged under Risks.

## Proposal to Design Mapping

- Proposal element: "Making `session`/`roll`/`message` event delivery cross-instance-safe"
  - Design decision: Decision 1 (broadened watch/poll), Decision 2 (dual-path + dedupe), Decision 3 (session derivation), Decision 4 (visibility replication)
  - Validation approach: New unit tests in `tests/unit/server/transport.test.ts` simulating two independent `registry`/module instances (see Testability notes below); existing `CampaignChat.test.tsx`/`CampaignLayout.test.tsx` dedup tests extended to cover double-delivery.

- Proposal element: "Preserving the direct-emitFiltered fast path with dedup guaranteed at the client"
  - Design decision: Decision 2
  - Validation approach: Unit test that same-instance delivery still fires synchronously (no added latency) alongside a separate test proving a second, delayed delivery of the same id is a no-op in the feed.

- Proposal element: "Updating docs/multi-user-campaigns/04-realtime-transport.md"
  - Design decision: Decision 1, Decision 3 (diagram/description updated to show db-level watch and derived session events)
  - Validation approach: Doc review only (no automated check).

## Functional Requirements Mapping

- Requirement: A `session` event reaches a subscriber on a different instance than the one that started/ended the session
  - Design element: Decision 1 (db-level watch/poll observes `campaigns` writes from any instance), Decision 3 (session derivation)
  - Acceptance criteria reference: `specs/transport/spec.md` (to be authored) — scenario "Session event delivered cross-instance"
  - Testability notes: Simulate two `transport.ts` module instances (via `jest.isolateModules` or two separately constructed registries) sharing a mocked Mongo change-stream/poll source; write `activeSessionId` "from" instance A, assert instance B's registered handler receives a `session` event.

- Requirement: A `roll`/`message` event reaches a subscriber on a different instance than the one that handled the POST
  - Design element: Decision 1, Decision 2, Decision 4
  - Acceptance criteria reference: `specs/transport/spec.md` — scenarios "Roll event delivered cross-instance", "Message event delivered cross-instance"
  - Testability notes: Same two-instance simulation; assert the cross-instance subscriber receives the event and that a DM-only roll/message is withheld from a non-DM cross-instance subscriber (visibility still enforced).

- Requirement: No duplicate feed entries when both delivery paths fire for the same write
  - Design element: Decision 2, existing `seenIds` dedup in `CampaignChat.tsx`
  - Acceptance criteria reference: `specs/transport/spec.md` — scenario "Duplicate delivery deduped by id"
  - Testability notes: Unit test delivering the same roll/message id twice through `onStreamEvent`; assert feed length increases by exactly one.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Db-level watch/broadened poll must not materially increase per-instance CPU/memory or add unbounded per-campaign state
  - Design element: Decision 1 (single shared cursor, same "one per instance" pattern), Decision 3 (bounded last-seen-`activeSessionId` map, cleaned up with registry teardown)
  - Acceptance criteria reference: `specs/transport/spec.md` — scenario "Shared cursor count stays at one per instance after broadening scope"
  - Testability notes: Existing tests already assert "first subscribe opens exactly one cursor" / "second subscribe reuses cursor" — extend assertions to cover the broadened watch target; add a test that per-campaign session state is removed when the last subscriber for that campaign tears down.

- Requirement category: reliability
  - Requirement: Visibility (DM-only vs group) is enforced identically regardless of which delivery path an event took
  - Design element: Decision 4
  - Acceptance criteria reference: `specs/transport/spec.md` — scenario "DM-only content withheld via Mongo-observed path"
  - Testability notes: Unit test asserting a non-DM subscriber's handler is never called with a DM-only roll/message delivered via the change-stream/poll path.

- Requirement category: reliability
  - Requirement: Behavior is correct in both `detectReplicaSet()` outcomes (Atlas and standalone/local dev)
  - Design element: Decision 1 (both branches broadened in parallel)
  - Acceptance criteria reference: `specs/transport/spec.md` — scenarios duplicated for both "replica-set path" and "polling path"
  - Testability notes: Mirror every new cross-instance scenario under both `detectReplicaSet` mock outcomes, matching the existing test file's pattern of parallel replica-set/polling test blocks.

## Risks / Trade-offs

- Risk/trade-off: `lib/server/transport.ts` gains a dependency on domain visibility logic (`canSeeMessage`, `canSeeRoll`, `storage.listMembersForCampaign`), breaking its previous "pure infra" boundary.
  - Impact: Slightly higher coupling; a future visibility-rule change now has two call sites to update (the route's direct `emitFiltered` call and `transport.ts`'s demux/poll filtering) instead of one.
  - Mitigation: Keep both call sites calling the *same* exported predicate functions (no duplicated logic) so a rule change is still a single-function edit; add a shared unit test fixture exercised by both call sites to prevent drift.
- Risk/trade-off: Broadening from collection-level to db-level `watch()` changes the shape of observed change-stream documents (need to branch on `ns.coll`), and multiplies the *volume* of events each instance's demux must inspect (previously only `campaigns` writes, now also every message and roll).
  - Impact: More per-event branching/filtering work per instance; possible latency/CPU regression under high message/roll volume.
  - Mitigation: Filtering stays in-process and cheap (id/collection checks before the more expensive visibility predicate); if load testing later shows this is material, a MongoDB-side pipeline stage on `watch()` (matching `ns.coll` and/or `campaignId`) can narrow the stream server-side without changing the client-facing contract.
- Risk/trade-off: Dual-path delivery (fast path + Mongo-observed) means a subscriber can now receive the same event twice, relying on client-side dedup being correct.
  - Impact: A dedup bug would surface as visibly duplicated messages/rolls in the feed rather than a silent drop (opposite failure mode from today).
  - Mitigation: `seenIds` dedup already exists and is unit-tested; add explicit new tests for the double-delivery case introduced by this change (not just history/stream overlap, which is what's tested today).
- Risk/trade-off: We have not directly confirmed prod actually runs >1 Fly machine (carried over from proposal's Open Questions).
  - Impact: If prod is currently single-machine, this change is prophylactic rather than an active prod fix today.
  - Mitigation: Proceed regardless per stated goal ("so when we do scale up it works properly"); the fix is correctness-neutral-or-positive for the single-instance case (Decision 2 preserves today's latency) so there's no downside to shipping it before multi-machine operation is confirmed.

## Rollback / Mitigation

- Rollback trigger: The broadened db-level watch/poll causes a measurable latency or resource regression in production (e.g. SSE heartbeat delays, elevated CPU on the Fly instance, Atlas change-stream/connection limit pressure), or the dual-path delivery introduces visible duplicate messages/rolls that dedup does not catch.
- Rollback steps: Revert `lib/server/transport.ts`, the three route files, and `CampaignChat.tsx` changes to the pre-change versions (collection-level `campaigns`-only watch/poll, `session` event only from the existing same-instance fast path). The `campaignMessages`/`campaignRolls` collections and their existing routes/history endpoints are unaffected and need no data migration.
- Data migration considerations: None — this change is purely additive to the transport layer; no schema or persisted-document changes.
- Verification after rollback: Confirm chat messages and rolls still send/receive correctly within a single instance (today's baseline behavior); confirm no JS errors in `CampaignChat`; re-confirm issue #443 reproduces only in the (documented, pre-existing) multi-instance case.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check — in particular, do not skip or weaken the new cross-instance simulation tests to make CI green.
- If security checks fail: Do not merge. Given Decision 4 touches visibility enforcement, treat any security-tool finding on `transport.ts`, the route files, or `campaignMessages.ts`/`campaignRolls.ts` as blocking until investigated.
- If required reviews are blocked/stale: Ping reviewer after 24 hours; escalate to repo owner after 48 hours.
- Escalation path and timeout: Repo owner (dougis) is the escalation path; no external stakeholders for this change.

## Open Questions

- Carried from proposal.md (non-blocking): Can we directly confirm prod's current Fly machine count via `fly status`/`fly machine list` before or alongside implementation? Useful for prioritization/validation, not required to proceed.
- Should the per-campaign "last known `activeSessionId`" state (Decision 3) live inside `lib/server/transport.ts` alongside `registry`, or be pulled out into its own small module? Leaning toward keeping it colocated with `registry` for now (same lifecycle, same file, minimal surface) — revisit only if `transport.ts` grows unwieldy.
- Is a MongoDB-side `$match` pipeline stage on the db-level `watch()` (narrowing to relevant `ns.coll` values at the server) worth adding now versus deferring until load testing shows it's needed? Leaning toward deferring (per Risks/Mitigation above) to keep this change's diff focused on correctness, not premature optimization.
