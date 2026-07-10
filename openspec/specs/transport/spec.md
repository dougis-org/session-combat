## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Transport abstraction — subscribe/unsubscribe

The system SHALL expose a `subscribe(campaignId, onEvent)` function in `lib/server/transport.ts` that returns a no-arg teardown function. Calling the teardown function removes the subscriber.

#### Scenario: First subscription opens the shared change stream (Atlas)

- **Given** the process is connected to an Atlas (replica-set) MongoDB
- **And** no change stream is currently open
- **When** `subscribe(campaignId, handler)` is called for the first time
- **Then** exactly one `MongoClient.watch()` cursor is opened
- **And** the handler is registered in the subscriber registry under `campaignId`

#### Scenario: Subsequent subscriptions reuse the existing stream

- **Given** a shared change stream is already open
- **When** `subscribe(campaignId2, handler2)` is called (same or different campaign)
- **Then** no new `MongoClient.watch()` cursor is opened
- **And** the total cursor count remains 1

#### Scenario: Concurrent subscriptions during lazy open do not race

- **Given** no change stream is open
- **When** two `subscribe()` calls arrive before the first `watch()` resolves
- **Then** exactly one cursor is opened (Promise-based lock ensures this)
- **And** both handlers are registered successfully

#### Scenario: Teardown removes subscriber

- **Given** a handler is subscribed to a campaign
- **When** the teardown function returned by `subscribe()` is called
- **Then** the handler is removed from the registry for that campaign

#### Scenario: Last subscriber drop closes the shared stream

- **Given** only one subscriber remains across all campaigns
- **When** that subscriber's teardown function is called
- **Then** the shared change stream cursor is closed
- **And** the module-level open promise is reset to null (ready for next lazy open)

#### Scenario: Last subscriber drops while open is in flight

- **Given** a `subscribe()` call is mid-way through opening the cursor
- **When** a teardown from a concurrent subscriber fires before the cursor resolves
- **Then** the cursor is closed immediately after it resolves
- **And** no events are emitted after teardown

---

### Requirement: ADDED Transport abstraction — change stream path (Atlas)

The system SHALL, when running against a replica-set MongoDB, open a single shared **database-level** change stream per process (not collection-level, and not one cursor per collection) covering the `campaigns`, `campaignMessages`, and `campaignRolls` collections, restricted server-side via a `$match` pipeline on `ns.coll`, and route incoming change documents to the correct per-campaign subscriber set based on both `campaignId` and source collection.

#### Scenario: Single shared cursor covers all three collections

- **Given** the process is connected to a replica-set MongoDB
- **And** no change stream is currently open
- **When** `subscribe()` is called for the first time
- **Then** exactly one `MongoClient.db().watch()` cursor is opened (not one per collection)
- **And** writes to `campaigns`, `campaignMessages`, or `campaignRolls` for a subscribed campaign are all observed via that single cursor

#### Scenario: Event routed to correct campaign subscribers regardless of source collection

- **Given** subscribers exist for campaign A and campaign B
- **When** the shared cursor emits a change document from `campaignRolls` with `fullDocument.campaignId === 'A'`
- **Then** all handlers registered under campaign A are called with a `{ type: 'roll', ... }` event
- **And** handlers registered under campaign B are NOT called

#### Scenario: Change stream cursor invalidation triggers one reconnect

- **Given** the shared change stream is open
- **When** the cursor emits a `ChangeStreamInvalidatedError`
- **Then** the transport attempts to reopen the cursor once
- **And** if the reopen succeeds, event delivery resumes
- **And** if the reopen fails, the transport closes the cursor and resets to polling mode

---

### Requirement: ADDED Transport abstraction — polling path (standalone Mongo)

The system SHALL, when running against a standalone (non-replica-set) MongoDB, poll `campaigns`, `campaignMessages`, and `campaignRolls` (by `campaignId` + `createdAt`/`updatedAt` greater than the subscription's `since` timestamp) on each subscription's own polling interval.

#### Scenario: Replica-set detection selects polling path

- **Given** `db.admin().command({ replSetGetStatus: 1 })` throws a non-replica-set error
- **When** `subscribe()` is called
- **Then** the polling path is activated for that connection
- **And** no `MongoClient.watch()` call is made

#### Scenario: Detection result is cached

- **Given** replica-set detection has already run and returned `false`
- **When** a second `subscribe()` call arrives
- **Then** `db.admin().command({ replSetGetStatus: 1 })` is NOT called again

#### Scenario: Polling emits new events since last check

- **Given** a subscriber is registered with polling mode active
- **And** `sinceTimestamp` is T0
- **When** the poll interval fires and a new document exists with `createdAt > T0`
- **Then** the subscriber handler is called with the corresponding `CampaignStreamEvent`
- **And** `sinceTimestamp` advances to the current time

#### Scenario: Polling observes new messages and rolls, not just campaign changes

- **Given** a subscriber is registered with polling mode active, `sinceTimestamp` is T0
- **When** the poll interval fires and a new document exists in `campaignMessages` with `createdAt > T0` for the subscribed campaign
- **Then** the subscriber handler is called with a `{ type: 'message', ... }` event
- **And** `sinceTimestamp` advances to the current time, covering all three polled collections

#### Scenario: Polling skips events for other campaigns

- **Given** a subscriber is registered for campaign A (polling mode)
- **When** a document with `campaignId === 'B'` appears in the polled collection
- **Then** the subscriber handler is NOT called

#### Scenario: Polling teardown stops the interval

- **Given** a subscriber is using polling mode
- **When** the teardown function is called
- **Then** the `setInterval` is cleared and no further polls occur

#### Scenario: A slow poll cycle is not overlapped by the next interval tick

- **Given** a poll cycle is still in flight when the next `setInterval` tick fires
- **When** the interval fires again before the previous `pollFn` call has resolved
- **Then** the new tick is skipped (no overlapping DB queries or duplicate `since`-window processing)
- **And** the next tick after the in-flight cycle resolves is allowed to proceed normally

---

### Requirement: ADDED Cross-instance delivery for message, roll, and session events

The system SHALL deliver `message`, `roll`, and `session` `CampaignStreamEvent`s to every subscriber of a campaign regardless of which server process handled the write that produced the event, in both the change-stream (Atlas) and polling (standalone Mongo) transport paths.

#### Scenario: Session event delivered cross-instance (change-stream path)

- **Given** two independent transport instances (simulating two Fly machines) each with their own `registry`, both observing the same replica-set MongoDB via db-level `watch()`
- **And** a subscriber with `userId: "player-1"` is registered on instance B for campaign "camp-1"
- **When** the `sessions/active` POST handler running on instance A sets `activeSessionId` on the `campaigns` document for "camp-1" (instance A never calls instance B's `emitFiltered` directly)
- **Then** instance B's change-stream demux observes the write independently and instance B's registered handler for "player-1" is called with `{ type: 'session', campaignId: 'camp-1', data: { activeSessionId: <new id> } }`

#### Scenario: Roll event delivered cross-instance (change-stream path)

- **Given** the same two-instance setup as above, with a subscriber registered on instance B
- **When** the `rolls` POST handler running on instance A inserts a new document into `campaignRolls` for "camp-1"
- **Then** instance B's demux observes the insert independently and instance B's subscriber receives a `{ type: 'roll', ... }` event carrying the same roll data instance A persisted

#### Scenario: Message event delivered cross-instance (change-stream path)

- **Given** the same two-instance setup as above, with a subscriber registered on instance B
- **When** the `messages` POST handler running on instance A inserts a new document into `campaignMessages` for "camp-1"
- **Then** instance B's demux observes the insert independently and instance B's subscriber receives a `{ type: 'message', ... }` event carrying the same message data instance A persisted

#### Scenario: Session, roll, and message events delivered cross-instance (polling path)

- **Given** two independent transport instances, each in polling mode (non-replica-set), each polling `campaigns`, `campaignMessages`, and `campaignRolls` on its own `sinceRef`-scoped interval
- **When** a session start/end, a roll insert, or a message insert occurs "on instance A" (i.e. is written to the shared underlying store)
- **Then** instance B's next poll cycle observes the change and delivers the corresponding `session`/`roll`/`message` event to instance B's subscribers

---

### Requirement: ADDED Same-instance fast path preserved alongside cross-instance delivery

The system SHALL continue to deliver `message`, `roll`, and `session` events to same-instance subscribers via the existing synchronous `emitFiltered()` call, in addition to (not instead of) the cross-instance-safe change-stream/poll-derived delivery. This fast path applies to subscribers regardless of transport mode — polling-mode subscriptions are registered alongside Atlas subscriptions so `emitFiltered()` reaches both.

#### Scenario: Same-instance subscriber receives the fast-path delivery immediately

- **Given** a subscriber is registered on the same instance that handles a roll POST
- **When** the POST handler calls `emitFiltered()` synchronously after persisting the roll
- **Then** the subscriber's handler is invoked before the handler returns the HTTP response (no dependency on the change-stream/poll cycle completing)

#### Scenario: Fast path reaches polling-mode subscribers too

- **Given** a subscriber is registered while the transport is in polling mode (standalone Mongo)
- **When** a route handler calls `emitFiltered()` synchronously after a write
- **Then** the subscriber's handler is invoked immediately, the same as an Atlas-mode subscriber

#### Scenario: Duplicate delivery from both paths is deduped by id

- **Given** a subscriber is registered on the same instance that handles a roll POST
- **When** `emitFiltered()` delivers the roll immediately, and the change-stream/poll-derived path later also observes and re-delivers the same roll (same `id`) to the same subscriber
- **Then** the client-side feed (`CampaignChat.tsx`'s `seenIds`-based dedup) contains exactly one entry for that roll `id`

---

### Requirement: ADDED Session event derivation from activeSessionId field changes

The system SHALL derive `session` events from observed changes to the `activeSessionId` field on a `campaigns` document, rather than requiring a separately-emitted event type in the change-stream/poll pipeline.

#### Scenario: Unrelated campaign field change does not emit a spurious session event

- **Given** the transport has last observed `activeSessionId: "session-1"` for campaign "camp-1"
- **When** a `campaigns` document write changes only an unrelated field (e.g. `name`) and `activeSessionId` remains `"session-1"`
- **Then** no `session` event is emitted for that write (a `change` event may still be emitted as today)

#### Scenario: activeSessionId change emits a session event

- **Given** the transport has last observed `activeSessionId: null` for campaign "camp-1"
- **When** a `campaigns` document write sets `activeSessionId` to `"session-2"`
- **Then** a `{ type: 'session', campaignId: 'camp-1', data: { activeSessionId: 'session-2' } }` event is emitted to all subscribers of "camp-1"
- **And** the transport's last-known value for "camp-1" updates to `"session-2"`

#### Scenario: Per-campaign session state is cleaned up when the last subscriber tears down

- **Given** campaign "camp-1" has exactly one registered subscriber, and the transport holds last-known `activeSessionId` state for "camp-1"
- **When** that subscriber's teardown function is called
- **Then** the transport's last-known `activeSessionId` state for "camp-1" is removed (no unbounded growth across long-running processes)

#### Scenario: Polling-mode session state is tracked per subscription, not shared

- **Given** two independent polling subscriptions exist for the same campaign
- **When** both observe the same `activeSessionId` transition on their respective poll cycles
- **Then** both subscriptions' handlers receive the `session` event — one subscription's poll cycle observing the transition first does not suppress delivery to the other

---

### Requirement: ADDED Visibility enforcement in the change-stream/poll-derived delivery path

The system SHALL apply the same `canSeeMessage`/`canSeeRoll` visibility predicates to message/roll events delivered via the change-stream/poll-derived path as are already applied to the direct `emitFiltered` fast path — no unfiltered broadcast of DM-only content over either path.

#### Scenario: DM-only roll withheld from a non-DM subscriber via the change-stream path

- **Given** a roll with `visibility: { scope: 'dm-only' }` is inserted into `campaignRolls` on instance A
- **And** a non-DM subscriber ("player-1") is registered on instance B
- **When** instance B's demux observes the insert
- **Then** `canSeeRoll` is evaluated for "player-1" before delivery, and "player-1"'s handler is NOT called with that roll

#### Scenario: DM-only roll delivered to the DM subscriber via the change-stream path

- **Given** the same DM-only roll insert as above
- **And** a subscriber with the DM role for the campaign is registered on instance B
- **When** instance B's demux observes the insert
- **Then** the DM subscriber's handler IS called with the roll event

#### Scenario: Visibility enforcement applies identically in the polling path

- **Given** the same DM-only roll scenario, but instance B is in polling mode (non-replica-set)
- **When** instance B's poll cycle observes the new roll document for the DM-only-subscribed campaign
- **Then** `canSeeRoll` is evaluated per-subscription before delivery, with the same withhold/deliver outcome as the change-stream path

---

### Requirement: ADDED CampaignStreamEvent type

The system SHALL define `CampaignStreamEvent` as a discriminated union in `lib/types.ts` with a `type` field.

#### Scenario: Heartbeat event shape

- **Given** the transport emits a heartbeat
- **When** the event is typed
- **Then** it matches `{ type: 'heartbeat'; campaignId: string; data: { ts: number } }`

#### Scenario: TypeScript rejects unknown event types

- **Given** `CampaignStreamEvent` is a closed discriminated union
- **When** code attempts to emit `{ type: 'unknown'; ... }`
- **Then** TypeScript compilation fails

## MODIFIED Requirements

### Requirement: MODIFIED lib/middleware.ts — export checkAuth

The system SHALL export `checkAuth` from `lib/middleware.ts` so it can be reused by `withStreamAndParams` without duplicating logic.

#### Scenario: checkAuth callable by external modules

- **Given** `checkAuth` is exported
- **When** `withStreamAndParams` calls it
- **Then** the same tokenVersion DB check is performed as in `withAuthAndParams`

## REMOVED Requirements

None.

## Traceability

- Proposal: single shared change stream per process → Requirement: ADDED Transport — change stream path; Scenario: First subscription opens stream; Scenario: Subsequent subscriptions reuse stream
- Proposal: Promise-based locking → Scenario: Concurrent subscriptions do not race; Scenario: Last subscriber drops while open in flight
- Proposal: Polling fallback uses getDatabase() singleton → Requirement: ADDED Transport — polling path
- Proposal: Replica-set detection cached → Scenario: Detection result is cached
- Proposal: CampaignStreamEvent discriminated union → Requirement: ADDED CampaignStreamEvent type
- Design D1 → Scenarios: stream open, demux, last-drop close
- Design D2 → Scenarios: concurrent subscribe race, in-flight teardown
- Design D3 → Scenarios: detection selects polling path, detection cached
- Design D4 → Scenarios: polling emits new events, polling teardown
- Design D6 → Scenarios: heartbeat shape, TypeScript rejects unknown types
- Requirement: ADDED Transport subscribe/unsubscribe → Task: implement lib/server/transport.ts
- Requirement: ADDED CampaignStreamEvent → Task: add types to lib/types.ts
- fix-cross-instance-transport-delivery (#443): broadened db-level watch/poll → Requirement: ADDED Transport — change stream path; Requirement: ADDED Transport — polling path
- fix-cross-instance-transport-delivery (#443): dual-path + client dedup → Requirement: ADDED Same-instance fast path preserved alongside cross-instance delivery
- fix-cross-instance-transport-delivery (#443): session derivation from activeSessionId → Requirement: ADDED Session event derivation from activeSessionId field changes
- fix-cross-instance-transport-delivery (#443): visibility replication → Requirement: ADDED Visibility enforcement in the change-stream/poll-derived delivery path
- fix-cross-instance-transport-delivery (#443) full design/spec/task history → `openspec/changes/archive/2026-07-10-fix-cross-instance-transport-delivery/`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Cursor count bounded to one per process

- **Given** N SSE connections are open (N ≥ 2) across M campaigns (M ≥ 1) on Atlas
- **When** the transport is running
- **Then** exactly one `MongoClient.watch()` cursor exists in the process (bound holds after the db-level watch broadened scope to `campaigns`, `campaignMessages`, and `campaignRolls`)

### Requirement: Security

See functional scenarios in `openspec/specs/sse-stream/spec.md`: "Unauthorized request rejected before stream opens", "Forbidden request rejected for non-member". See also this document's "DM-only roll withheld from a non-DM subscriber via the change-stream path", "Visibility enforcement applies identically in the polling path".

### Requirement: Reliability

#### Scenario: Change stream reconnect after invalidation

- **Given** the shared change stream cursor is invalidated (e.g., Atlas restart)
- **When** the transport catches the error
- **Then** one reconnect attempt is made within 1s
- **And** existing subscribers continue to receive events after reconnect

#### Scenario: Transport does not crash the process on poll DB error

- **Given** polling mode is active
- **When** a `getDatabase()` call throws during a poll
- **Then** the error is logged and the interval continues (no process crash, no subscriber removal)

#### Scenario: Behavior verified in both transport modes

- **Given** the full set of cross-instance delivery, dedup, session-derivation, and visibility scenarios above
- **When** each is exercised under both `detectReplicaSet() === true` (change-stream) and `detectReplicaSet() === false` (polling) mocks
- **Then** the outcome (delivered / withheld / deduped) is identical between the two modes for equivalent inputs
