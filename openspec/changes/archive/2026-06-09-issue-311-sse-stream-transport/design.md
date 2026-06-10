## Context

- **Relevant architecture:** Next.js App Router on Fly.io (single Node process per machine). MongoDB via `lib/db.ts` singleton (`connectToDatabase()` returns `{ client, db }`). Auth via JWT cookie + DB tokenVersion check in `lib/middleware.ts`. Campaign access via `assertCampaignAccess` in `lib/utils/campaign.ts`.
- **Dependencies:** Phase 1 (#1e) — `assertCampaignAccess` ✅ live. `lib/db.ts` — `MongoClient` accessible. `lib/middleware.ts` — `requireAuth`, `checkAuth` (to be exported).
- **Interfaces/contracts touched:** `lib/middleware.ts` (export `checkAuth`, add `withStreamAndParams`), `lib/types.ts` (add `CampaignStreamEvent`), new `lib/server/transport.ts`, new `app/api/campaigns/[id]/stream/route.ts`.

## Goals / Non-Goals

### Goals

- Live SSE endpoint gated by campaign membership
- Single shared MongoDB change stream per process (Atlas), demuxed to per-campaign subscribers
- Polling fallback (standalone Mongo / local dev) using existing `getDatabase()` singleton — no new connection management
- Streaming-compatible auth wrapper that shares logic with existing `withAuthAndParams`
- Typed `CampaignStreamEvent` union (extensible by downstream phases)
- Heartbeat every ~25s; clean teardown on abort

### Non-Goals

- Content event types beyond `heartbeat` (deferred to #314, #316)
- Cross-machine fan-out
- WebSocket support
- Visibility filtering at transport layer

## Decisions

### Decision 1: One shared change stream per process, demuxed by campaignId

- **Chosen:** A module-level singleton in `lib/server/transport.ts` holds a single `MongoClient.watch()` cursor watching all relevant collections (initially `campaigns`, `combatStates`). An in-memory `Map<string, Set<EventHandler>>` keyed by `campaignId` routes each change document to the right subscriber set.
- **Alternatives considered:** (a) One cursor per campaign — rejected; exhausts Atlas change-stream limits under load. (b) One cursor per connection — rejected; same problem, worse. (c) Redis pub/sub — rejected; adds infra dependency, out of scope.
- **Rationale:** Atlas hard limits on concurrent change streams; a single cursor with in-process demux is the standard pattern. Aligns with the phase doc's explicit requirement.
- **Trade-offs:** Process-scoped state is fine on Fly (one process per machine). Cross-machine events are not fanned out — acceptable for Phase 4.

### Decision 2: Promise-based locking for lazy open / last-drop close

- **Chosen:** Mirror the `connectionPromise` pattern in `lib/db.ts`. A module-level `openPromise: Promise<ChangeStream> | null` ensures concurrent `subscribe()` calls during the lazy-open window all await the same promise rather than racing to open multiple cursors. A reference counter tracks active subscribers; the stream closes when count reaches 0.
- **Alternatives considered:** Mutex library — rejected; adds dependency. Synchronous flag — rejected; doesn't handle the async gap.
- **Rationale:** `lib/db.ts` already uses this exact pattern successfully. Consistency and zero new dependencies.
- **Trade-offs:** Slightly more complex teardown — must handle the case where the last subscriber drops while `openPromise` is still resolving.

### Decision 3: Replica-set detection cached at first subscribe

- **Chosen:** On first call to `subscribe()`, run `db.admin().command({ replSetGetStatus: 1 })`. If it throws with `"not running with --replSet"` (or equivalent), set a module-level `isReplicaSet: boolean` flag to `false` and use polling. Cache the result; never re-check.
- **Alternatives considered:** Env var flag (`MONGO_USE_POLLING=true`) — simpler but requires manual config. Check on every subscribe — wasteful.
- **Rationale:** Auto-detection is better DX for local dev. The result is stable for the process lifetime.
- **Trade-offs:** If someone switches from standalone to Atlas without restarting the process, the cached detection is stale — acceptable edge case.

### Decision 4: Polling path uses getDatabase() singleton, per-connection since-timestamp

- **Chosen:** Each SSE connection in polling mode runs its own `setInterval` (2s). Each interval calls `getDatabase()` (returns cached connection) and queries the watched collections with `createdAt: { $gte: since }`. The `since` timestamp advances after each poll. No shared polling state — each connection is independent.
- **Alternatives considered:** Shared polling registry (like the change stream) — unnecessary complexity for a local-dev-only path.
- **Rationale:** The polling fallback is dev-only. Per-connection simplicity is fine. Reuses the existing `lib/db.ts` singleton with zero new connection management — exactly as the user specified.
- **Trade-offs:** N connections = N poll intervals on local dev. Acceptable; documented.

### Decision 5: withStreamAndParams shares checkAuth via export

- **Chosen:** Export `checkAuth` from `lib/middleware.ts`. Add `withStreamAndParams<P>` whose handler returns `Response` (not `NextResponse`). Both wrappers call `requireAuth` + `checkAuth` — identical auth logic, different return type constraint.
- **Alternatives considered:** Copy-paste the auth logic into a new wrapper — rejected; creates drift risk. Refactor `withAuthAndParams` to accept a generic response type — over-engineering.
- **Rationale:** Minimizes duplication. `checkAuth` is already a clean async function; exporting it costs nothing.
- **Trade-offs:** Exposing `checkAuth` as a public export makes it usable by future stream variants — that's a feature, not a risk.

### Decision 6: CampaignStreamEvent is a discriminated union, heartbeat-only for Phase 4

- **Chosen:** Define `CampaignStreamEvent` in `lib/types.ts` as a discriminated union on `type`. Phase 4 includes only `{ type: 'heartbeat'; campaignId: string; data: { ts: number } }`. Downstream phases extend it by adding new union members.
- **Alternatives considered:** Generic `{ type: string; data: unknown }` — loses type safety at call sites. Separate event files per phase — unnecessary fragmentation.
- **Rationale:** Discriminated unions are the TypeScript-idiomatic pattern. The `type` field maps directly to the SSE `event:` frame field.
- **Trade-offs:** Adding union members is a source change (not purely additive) — acceptable; it's the right trade for type safety.

## Proposal to Design Mapping

- **Proposal element:** Single shared change stream per process
  - **Design decision:** D1 (singleton cursor + in-memory demux), D2 (Promise-based locking)
  - **Validation approach:** Unit test that two concurrent `subscribe()` calls result in exactly one open cursor

- **Proposal element:** Polling fallback for standalone Mongo
  - **Design decision:** D3 (replica-set detection), D4 (per-connection setInterval)
  - **Validation approach:** Unit test transport with mock DB returning non-replica-set error; assert polling path taken

- **Proposal element:** Auth wrapper DRY refactor
  - **Design decision:** D5 (export `checkAuth`, add `withStreamAndParams`)
  - **Validation approach:** Existing middleware tests still pass; new integration test uses `withStreamAndParams`

- **Proposal element:** Typed event union
  - **Design decision:** D6 (`CampaignStreamEvent` discriminated union)
  - **Validation approach:** TypeScript compilation; stream route and transport use the union type

- **Proposal element:** Clean teardown on disconnect
  - **Design decision:** D1 (reference counter closes stream on last drop), D2 (Promise locking handles in-flight open)
  - **Validation approach:** Integration test — connect, disconnect, assert shared stream closes

## Functional Requirements Mapping

- **Requirement:** Authorized member receives SSE events for their campaign only
  - **Design element:** `assertCampaignAccess` called before stream opens; subscriber keyed by `campaignId`
  - **Acceptance criteria reference:** specs/sse-stream.md
  - **Testability notes:** Integration test with two campaigns; assert cross-campaign events don't leak

- **Requirement:** Heartbeat emitted ~every 25s
  - **Design element:** `setInterval(25000)` in stream route writing SSE comment frames
  - **Acceptance criteria reference:** specs/sse-stream.md
  - **Testability notes:** Unit test with fake timers; assert heartbeat event emitted at interval

- **Requirement:** Connection closes cleanly on client disconnect
  - **Design element:** `request.signal` `abort` listener calls teardown fn returned by `subscribe()`
  - **Acceptance criteria reference:** specs/transport.md
  - **Testability notes:** Integration test — abort the request; assert subscriber removed, stream closed if last

- **Requirement:** Change stream and polling paths both emit `CampaignStreamEvent`
  - **Design element:** Both paths call `onEvent(event: CampaignStreamEvent)` — same callback signature
  - **Acceptance criteria reference:** specs/transport.md
  - **Testability notes:** Unit tests for both paths; TypeScript enforces the type

## Non-Functional Requirements Mapping

- **Requirement category:** Reliability
  - **Requirement:** Change stream cursor invalidation triggers reconnect
  - **Design element:** Cursor iteration wrapped in try/catch; one reconnect attempt before falling back to polling
  - **Acceptance criteria reference:** specs/transport.md
  - **Testability notes:** Unit test with mock cursor that throws `ChangeStreamInvalidatedError`

- **Requirement category:** Performance
  - **Requirement:** One change stream cursor per process regardless of connection count
  - **Design element:** D1 singleton registry; D2 Promise locking
  - **Acceptance criteria reference:** specs/transport.md
  - **Testability notes:** Assert `client.watch` call count is 1 after N subscriptions

- **Requirement category:** Security
  - **Requirement:** Unauthorized requests rejected before stream opens
  - **Design element:** `withStreamAndParams` calls `requireAuth` + `checkAuth` synchronously before returning `ReadableStream`
  - **Acceptance criteria reference:** specs/sse-stream.md
  - **Testability notes:** Integration test with missing/invalid/expired token; assert 401 before any SSE bytes

- **Requirement category:** Operability
  - **Requirement:** Shared stream closes when last connection drops
  - **Design element:** Reference counter in registry; `closeStream()` called when count reaches 0
  - **Acceptance criteria reference:** specs/transport.md
  - **Testability notes:** Integration test; assert `cursor.close()` called after last unsubscribe

## Risks / Trade-offs

- **Risk/trade-off:** Cursor invalidation on Atlas rolling restart
  - **Impact:** Silent event loss until reconnect completes
  - **Mitigation:** One reconnect attempt in transport; heartbeat timeout on client side (4b) will trigger EventSource reconnect

- **Risk/trade-off:** Polling adds DB query load in local dev with many connections
  - **Impact:** Noisy local Mongo logs; negligible perf impact
  - **Mitigation:** Local dev only; documented behavior. Polling interval is 2s per connection.

- **Risk/trade-off:** `CampaignStreamEvent` union requires source change to extend
  - **Impact:** Each new phase must update `lib/types.ts`
  - **Mitigation:** Acceptable trade for type safety; the pattern is established and each phase owns its event type

## Rollback / Mitigation

- **Rollback trigger:** SSE endpoint causes process instability, memory leak, or Atlas connection limit breach in production
- **Rollback steps:** Delete `app/api/campaigns/[id]/stream/route.ts` — stream endpoint simply disappears; all other routes unaffected. Revert `lib/middleware.ts` and `lib/types.ts` additions.
- **Data migration considerations:** None — this change is purely additive (new endpoint, new module, type additions). No schema changes, no data written.
- **Verification after rollback:** Confirm Atlas change stream count returns to 0; confirm existing campaign API routes still pass integration tests.

## Operational Blocking Policy

- **If CI checks fail:** Do not merge. Fix the failing check. Transport logic must have unit test coverage; stream route must have integration test coverage.
- **If security checks fail:** Do not merge. Auth logic is security-critical — any `withStreamAndParams` auth bypass is a blocker.
- **If required reviews are blocked/stale:** Ping reviewer after 24h. Escalate to async approval (written sign-off in PR comment) after 48h.
- **Escalation path and timeout:** If blocked > 72h with no response, raise in team standup and reassign reviewer.

## Open Questions

No open questions. All decisions resolved during exploration session prior to proposal.
