## Context

- Relevant architecture:
  - `lib/server/transport.ts` — singleton in-process pub/sub. Change-stream mode watches `campaigns` collection; polling fallback queries same. Both paths call `handler(event)` per subscriber.
  - `lib/types.ts` — `CampaignStreamEvent` union type consumed by transport, stream route, and (future) client hook.
  - `app/api/campaigns/[id]/stream/route.ts` — SSE endpoint; calls `subscribe(campaignId, handler)` and streams events via `ReadableStream`.
  - `lib/db.ts` — `initializeDatabase()` registers all collection indexes at startup.
  - `campaignMembers` collection — source of truth for role (`dm`/`player`) and status (`active`/`invited`/`declined`/`removed`).
- Dependencies: Phase 4 transport (#311/#312) complete. Campaign members (1e) complete.
- Interfaces/contracts touched:
  - `subscribe()` signature in transport (breaking: adds `userId` param)
  - `CampaignStreamEvent` union (additive: new `message` variant)
  - `initializeDatabase()` in `lib/db.ts` (additive: new index block)

## Goals / Non-Goals

### Goals

- Persist messages in a dedicated `campaignMessages` collection with a compound index.
- Enforce visibility server-side in both SSE push and GET history paths using a shared predicate.
- Upgrade transport to carry subscriber identity so `emitFiltered` can fan-out selectively.
- Expose `POST` and `GET` endpoints under `/api/campaigns/[id]/messages`.

### Non-Goals

- Chat dock UI (issue #315).
- Role-gating on send (any active member may use any visibility scope).
- Retroactive re-filtering when member roles change.

## Decisions

### Decision 1: Server-side SSE filtering via userId-aware registry

- Chosen: Upgrade `registry` from `Map<string, Set<EventHandler>>` to `Map<string, Map<string, EventHandler>>` (campaignId → userId → handler). Export `emitFiltered(campaignId, event, canReceive: (userId: string) => boolean)`. Update `subscribe(campaignId, userId, handler)`.
- Alternatives considered: Client-side filtering (broadcast message to all subscribers, client discards non-visible ones).
- Rationale: Invisible messages must never reach the client wire for direct/dm-only scopes. Client-side filtering would leak message existence and content to unauthorized recipients.
- Trade-offs: Adds ~50 lines to the transport singleton. `subscribe()` becomes a breaking change — the one call site (`stream/route.ts`) must be updated. The polling path (`pollFn`) is unaffected because it only queries `campaigns`, never `campaignMessages`.

### Decision 2: Explicit emit from POST route (not change-stream on campaignMessages)

- Chosen: The POST handler calls `emitFiltered()` directly after persisting. The change-stream watcher on `campaigns` is not extended to watch `campaignMessages`.
- Alternatives considered: Extend transport to watch `campaignMessages` collection via MongoDB change stream.
- Rationale: The existing watcher is tied to the `campaigns` collection and the `demux` function assumes a single document shape. Adding a second watched collection would require multi-collection `$match` or a second cursor, complicating the singleton. Explicit emit is simpler and aligns with how the route already controls access and auth.
- Trade-offs: If the POST route crashes after persist but before emit, the message is stored but not pushed live (recipients see it on next GET/reconnect). This is acceptable — it matches the polling fallback behavior.

### Decision 3: Shared `canSeeMessage` predicate

- Chosen: Extract a pure function `canSeeMessage(msg: CampaignMessage, userId: string, memberRole: MemberRole | null): boolean` in a utility module (e.g., `lib/utils/campaignMessages.ts`). Used by both `emitFiltered` call and GET query builder.
- Alternatives considered: Inline the predicate in each code path separately.
- Rationale: Eliminates the risk of divergence between SSE and history visibility. A single source of truth for the visibility rules.
- Trade-offs: Slight indirection; the predicate must be passed the member context (role) which requires a members lookup on each call — acceptable since the POST route already fetches the sender's membership.

### Decision 4: Cursor-based pagination by createdAt

- Chosen: `GET` accepts optional `?before=<ISO timestamp>&limit=<n>` (default limit 50, max 100). Returns messages with `createdAt < before`, sorted descending.
- Alternatives considered: Offset pagination (`?page=N`).
- Rationale: The `{campaignId: 1, createdAt: 1}` index makes range queries O(log n). Offset pagination drifts as new messages arrive. Cursor pagination is stable and correct for append-only feeds.
- Trade-offs: Client must track the oldest `createdAt` value seen to load more. This is the standard pattern for chat history.

### Decision 5: dm-only reaches all active DMs

- Chosen: `dm-only` messages are visible to all members with `role: "dm"` and `status: "active"`, plus the sender (regardless of role).
- Alternatives considered: Only the campaign owner (single DM); only the DM who was explicitly targeted.
- Rationale: Campaign may have co-DMs. A player sending a dm-only message (e.g., a private aside to the table's DM) should reach whichever DMs are active. Simpler than requiring an explicit `toUserId` for dm-only.
- Trade-offs: Co-DM scenarios expose the message to all DMs; documented in proposal open questions.

## Proposal to Design Mapping

- Proposal element: Server-side SSE filtering required
  - Design decision: Decision 1 (userId-aware registry) + Decision 2 (explicit emit)
  - Validation approach: Integration test — player subscriber must not receive a direct message addressed to a different player.

- Proposal element: Visibility identical in SSE and GET
  - Design decision: Decision 3 (shared `canSeeMessage` predicate)
  - Validation approach: Unit tests on `canSeeMessage`; integration tests assert GET history matches what SSE delivered.

- Proposal element: `dm-only` reaches all active DMs
  - Design decision: Decision 5
  - Validation approach: Integration test with two DM subscribers; both must receive dm-only message.

- Proposal element: Cursor pagination on `{campaignId, createdAt}` index
  - Design decision: Decision 4
  - Validation approach: Integration test with 60 messages; second page (before cursor) returns correct 10.

## Functional Requirements Mapping

- Requirement: Messages persist across server restarts
  - Design element: `campaignMessages` collection in MongoDB
  - Acceptance criteria reference: specs/campaign-messages/spec.md — "messages persist"
  - Testability notes: Integration test: POST then restart-equivalent (new DB connection) then GET.

- Requirement: GET returns only messages the caller may see
  - Design element: Decision 3 (`canSeeMessage` predicate applied in GET query)
  - Acceptance criteria reference: specs/campaign-messages/spec.md — "players can't read messages not addressed to them"
  - Testability notes: Integration test: player A posts direct to player B; player C's GET returns empty.

- Requirement: POST emits a stream event only to eligible subscribers
  - Design element: Decision 1 + Decision 2 (`emitFiltered`)
  - Acceptance criteria reference: specs/campaign-messages/spec.md — "writes emit stream events"
  - Testability notes: Integration test: subscribe two players; DM sends direct to player A; only player A receives SSE event.

- Requirement: Pagination works correctly
  - Design element: Decision 4
  - Acceptance criteria reference: specs/campaign-messages/spec.md — "pagination works"
  - Testability notes: Integration test: insert 60 messages, GET with limit=50 returns 50, second call with before cursor returns 10.

## Non-Functional Requirements Mapping

- Requirement category: security
  - Requirement: dm-only and direct messages must not leak to unauthorized subscribers on the wire
  - Design element: Decision 1 (server-side filter in `emitFiltered`) + Decision 3 (shared predicate)
  - Acceptance criteria reference: specs/campaign-messages/spec.md
  - Testability notes: Network-level check in integration test — assert no SSE event reaches unauthorized subscriber connection.

- Requirement category: reliability
  - Requirement: A crash between persist and emit must not corrupt state
  - Design element: Decision 2 (emit-after-persist; idempotent)
  - Acceptance criteria reference: n/a (operational)
  - Testability notes: Message is always retrievable via GET even if SSE push never fired.

- Requirement category: performance
  - Requirement: History GET should be fast even with thousands of messages
  - Design element: `{campaignId: 1, createdAt: 1}` compound index (Decision 4)
  - Acceptance criteria reference: n/a (operational target: <100ms for 1000 messages)
  - Testability notes: Index verified in `lib/db.ts`; explain plan in local dev if needed.

## Risks / Trade-offs

- Risk/trade-off: `subscribe()` signature is a breaking internal change
  - Impact: Compile error at the one existing call site in `stream/route.ts` until updated.
  - Mitigation: Both changes (transport + route) land in the same PR/task; TypeScript catches the break immediately.

- Risk/trade-off: `emitFiltered` requires active member roster at emit time
  - Impact: POST handler must fetch `campaignMembers` to compute the `canReceive` predicate, adding a DB round-trip per message send.
  - Mitigation: Members collection is small per campaign; the lookup is a single indexed query (`{campaignId, status: "active"}`). Acceptable latency.

- Risk/trade-off: Polling path does not emit messages
  - Impact: In non-replica-set environments (local dev without `--replSet`), new messages are NOT pushed live. Clients must reconnect or the next poll cycle fires, but poll watches `campaigns` not `campaignMessages`.
  - Mitigation: Document clearly. Phase 5b chat dock will reconnect on visibility change anyway. For prod (Fly.io replica set), this path is inactive.

## Rollback / Mitigation

- Rollback trigger: Stream regression (existing heartbeat/change events stop delivering) or visibility leak detected in CI.
- Rollback steps:
  1. Revert `lib/server/transport.ts` to previous registry shape.
  2. Revert `app/api/campaigns/[id]/stream/route.ts` subscribe call.
  3. Remove `app/api/campaigns/[id]/messages/route.ts`.
  4. Remove `CampaignMessage` type and `message` event from `lib/types.ts`.
  5. Remove `campaignMessages` index from `lib/db.ts` (index on empty collection is harmless; can be left).
- Data migration considerations: `campaignMessages` collection is new and additive; rollback leaves it in place with no impact.
- Verification after rollback: Run existing stream integration tests; confirm SSE heartbeat and change events still flow.

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing test or revert the offending commit. No exceptions for "flaky" dismissals on stream tests.
- If security checks fail: Treat as P0. Do not ship. Escalate immediately.
- If required reviews are blocked/stale: Ping reviewer after 24h; escalate to Doug after 48h.
- Escalation path and timeout: Doug (dougis-org) is the sole approver; no timeout bypass.

## Open Questions

- Q: Should dm-only scope from a player be visible to all active DMs or only one (e.g., campaign owner)?
  - Current assumption: all active DMs. Confirm before 5b UI copy is written.
