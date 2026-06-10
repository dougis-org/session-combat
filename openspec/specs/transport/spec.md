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

The system SHALL, when running against a replica-set MongoDB, route incoming change documents to the correct per-campaign subscriber set.

#### Scenario: Event routed to correct campaign subscribers

- **Given** subscribers exist for campaign A and campaign B
- **When** the change stream emits a document with `fullDocument.campaignId === 'A'`
- **Then** all handlers registered under campaign A are called with the event
- **And** handlers registered under campaign B are NOT called

#### Scenario: Change stream cursor invalidation triggers one reconnect

- **Given** the shared change stream is open
- **When** the cursor emits a `ChangeStreamInvalidatedError`
- **Then** the transport attempts to reopen the cursor once
- **And** if the reopen succeeds, event delivery resumes
- **And** if the reopen fails, the transport closes the cursor and resets to polling mode

---

### Requirement: ADDED Transport abstraction — polling path (standalone Mongo)

The system SHALL, when running against a standalone (non-replica-set) MongoDB, use per-connection timestamp-based polling as the event source.

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

#### Scenario: Polling skips events for other campaigns

- **Given** a subscriber is registered for campaign A (polling mode)
- **When** a document with `campaignId === 'B'` appears in the polled collection
- **Then** the subscriber handler is NOT called

#### Scenario: Polling teardown stops the interval

- **Given** a subscriber is using polling mode
- **When** the teardown function is called
- **Then** the `setInterval` is cleared and no further polls occur

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

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Cursor count bounded to one per process

- **Given** N SSE connections are open (N ≥ 2) across M campaigns (M ≥ 1) on Atlas
- **When** the transport is running
- **Then** exactly one `MongoClient.watch()` cursor exists in the process

### Requirement: Security

See functional scenarios in `openspec/specs/sse-stream/spec.md`: "Unauthorized request rejected before stream opens", "Forbidden request rejected for non-member".

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
