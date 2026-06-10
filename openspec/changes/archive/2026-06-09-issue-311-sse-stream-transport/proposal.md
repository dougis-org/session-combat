## GitHub Issues

- #311
- #296 (Phase 4 epic)

## Why

- **Problem statement:** The app has no real-time communication channel between the server and connected campaign members. All data is currently fetched on demand; there is no mechanism for one user's action to propagate to others without a page refresh.
- **Why now:** Phase 4 is the foundational plumbing that all subsequent multi-user phases depend on. Phase 5 (messaging), Phase 6 (shared rolls), and Phase 7 (scene content) all require a live event stream to be in place before they can deliver user value. Nothing downstream can ship until this exists.
- **Business/user impact:** Without a real-time transport, multiplayer campaigns feel static — players cannot see each other's actions live. This is the critical path for the entire multi-user initiative.

## Problem Space

- **Current behavior:** No SSE or WebSocket endpoint exists. Clients have no push channel; all state is pull-only.
- **Desired behavior:** Authorized campaign members can open a persistent `GET /api/campaigns/[id]/stream` connection and receive typed server-sent events scoped to their campaign. The server uses MongoDB Change Streams when running on Atlas and falls back to timestamp-based polling for local/standalone Mongo. A single shared change stream (per process) fans out to all connected clients.
- **Constraints:**
  - Atlas has strict limits on concurrent change streams and connections — one stream per process is a hard architectural requirement.
  - Fly.io runs Next.js as a single Node process per machine; module-level singletons are valid for process-scoped state.
  - The existing `withAuth`/`withAuthAndParams` middleware returns `NextResponse`, which is incompatible with streaming `Response` — the stream route needs a streaming-compatible auth wrapper.
  - Polling fallback is for local dev only; it does not need to match Atlas change stream latency.
- **Assumptions:**
  - `assertCampaignAccess` (from Phase 1 / issue #1e) is complete and available in `lib/utils/campaign.ts`. ✅ Confirmed.
  - `connectToDatabase()` in `lib/db.ts` returns `{ client, db }` — the `MongoClient` is accessible for `client.watch()`. ✅ Confirmed.
  - The only content event type needed for Phase 4 is `heartbeat`. Subsequent phases (#314, #316, etc.) extend `CampaignStreamEvent` as they land.
- **Edge cases considered:**
  - Two connections arriving simultaneously during lazy stream open (race condition on the shared cursor).
  - Last connection drops while stream open is still in flight.
  - Client disconnects mid-stream (abort signal, Fly request timeout).
  - Mongo is temporarily unavailable — polling fallback should not crash the process.
  - Change stream cursor invalidated (Atlas rolling restart) — needs reconnect logic.

## Scope

### In Scope

- `GET /api/campaigns/[id]/stream` — SSE endpoint returning `text/event-stream`
- Auth via `assertCampaignAccess`; unauthorized requests get 401/403 before stream opens
- `lib/server/transport.ts` — `subscribe(campaignId, onEvent)` abstraction with:
  - Atlas path: one shared `MongoClient.watch()` per process, demuxed by `campaignId`
  - Polling path: per-connection `setInterval` querying by `createdAt >= since` (local dev)
  - Replica-set detection (cached, checked once on first subscribe)
  - Lazy open / close-on-last-drop lifecycle with Promise-based locking (no race)
  - Subscriber registry: `Map<campaignId, Set<handler>>`
- `CampaignStreamEvent` discriminated union type in `lib/types.ts` (heartbeat only for now)
- Heartbeat frame every ~25s; clean teardown on request abort
- `withStreamAndParams<P>` in `lib/middleware.ts` — streaming-compatible auth wrapper sharing same auth logic as `withAuthAndParams`
- Export `checkAuth` from `lib/middleware.ts` so both wrappers share it

### Out of Scope

- `roll.shared`, `chat.message`, or any other content event types (belong to #316, #314)
- `POST /api/campaigns/[id]/rolls` — belongs to #316
- Client `useCampaignStream` hook — belongs to #312
- `CampaignChat` dock shell — belongs to #313
- Multi-instance coordination (each Fly machine has its own process-scoped stream; cross-machine fan-out is not addressed here)

## What Changes

- **`lib/types.ts`** — add `CampaignStreamEvent` discriminated union (`heartbeat` only)
- **`lib/middleware.ts`** — export `checkAuth`; add `withStreamAndParams<P>` variant
- **`lib/server/transport.ts`** (new) — transport abstraction with change-stream and polling paths, subscriber registry, replica-set detection
- **`app/api/campaigns/[id]/stream/route.ts`** (new) — SSE GET handler
- **Tests** — unit tests for transport logic; integration test for the stream endpoint

## Risks

- **Risk:** Change stream cursor invalidated mid-session (Atlas rolling restart or oplog overflow)
  - **Impact:** All connected clients stop receiving events silently
  - **Mitigation:** Wrap cursor iteration in try/catch; attempt one reconnect before dropping to polling

- **Risk:** Promise-based lazy-open locking is subtle; a bug could open multiple cursors
  - **Impact:** Atlas connection/stream limit exhausted
  - **Mitigation:** Unit test the concurrent-subscribe case explicitly; assert cursor count is 1

- **Risk:** `withStreamAndParams` duplicates auth logic if `checkAuth` is not properly shared
  - **Impact:** Auth bugs fixed in one wrapper but not the other
  - **Mitigation:** Export `checkAuth` and have both wrappers call the same function — no copy-paste

- **Risk:** Polling fallback fires for every connection independently, causing N×polling-interval DB queries on a busy local dev session
  - **Impact:** Noisy local DB; negligible in prod (Atlas uses change streams)
  - **Mitigation:** Acceptable for local dev; document the behavior

## Open Questions

No unresolved ambiguity remains. All design decisions were resolved during exploration:

- Transport selection: option B confirmed (polling path skips member events; change stream path sees all)
- Event taxonomy: `heartbeat` only for Phase 4; content events added per downstream phase
- Trust model for future roll sharing: client-submitted (confirmed acceptable for tabletop among friends)
- Auth wrapper approach: `withStreamAndParams` sharing exported `checkAuth` (confirmed)
- `CampaignRoll` type and `POST /api/campaigns/[id]/rolls`: out of scope, belongs to #316

## Non-Goals

- WebSocket support — SSE is sufficient for server-push; bidirectional is handled via REST POST endpoints
- Cross-machine fan-out / pub-sub broker — out of scope for Phase 4
- Server-side dice rolling / anti-cheat — deferred, belongs to #316
- Visibility filtering at the transport layer — transport delivers all campaign events; visibility enforcement belongs to the content endpoints (#314, #316)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
