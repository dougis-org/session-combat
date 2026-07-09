## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

The system SHALL continue to deliver `message`, `roll`, and `session` events to same-instance subscribers via the existing synchronous `emitFiltered()` call, in addition to (not instead of) the cross-instance-safe change-stream/poll-derived delivery.

#### Scenario: Same-instance subscriber receives the fast-path delivery immediately

- **Given** a subscriber is registered on the same instance that handles a roll POST
- **When** the POST handler calls `emitFiltered()` synchronously after persisting the roll
- **Then** the subscriber's handler is invoked before the handler returns the HTTP response (no dependency on the change-stream/poll cycle completing)

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

## MODIFIED Requirements

### Requirement: MODIFIED Transport abstraction — change stream path (Atlas)

The system SHALL, when running against a replica-set MongoDB, open a single shared **database-level** change stream per process (not collection-level, and not one cursor per collection) covering the `campaigns`, `campaignMessages`, and `campaignRolls` collections, and route incoming change documents to the correct per-campaign subscriber set based on both `campaignId` and source collection.

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

---

### Requirement: MODIFIED Transport abstraction — polling path (standalone Mongo)

The system SHALL, when running against a standalone (non-replica-set) MongoDB, poll `campaigns`, `campaignMessages`, and `campaignRolls` (by `campaignId` + `createdAt`/`updatedAt` greater than the subscription's `since` timestamp) on each subscription's existing polling interval, in addition to the previously-polled `campaigns`-only behavior.

#### Scenario: Polling observes new messages and rolls, not just campaign changes

- **Given** a subscriber is registered with polling mode active, `sinceTimestamp` is T0
- **When** the poll interval fires and a new document exists in `campaignMessages` with `createdAt > T0` for the subscribed campaign
- **Then** the subscriber handler is called with a `{ type: 'message', ... }` event
- **And** `sinceTimestamp` advances to the current time, covering all three polled collections

## REMOVED Requirements

None.

## Traceability

- Proposal element: "Making session/roll/message event delivery cross-instance-safe" → Requirement: ADDED Cross-instance delivery for message, roll, and session events
- Proposal element: "Preserving direct-emitFiltered as a same-instance fast path" → Requirement: ADDED Same-instance fast path preserved alongside cross-instance delivery
- Design Decision 1 (broadened db-level watch/poll) → Requirement: MODIFIED Transport — change stream path; MODIFIED Transport — polling path
- Design Decision 2 (dual-path + client dedup) → Requirement: ADDED Same-instance fast path preserved; Scenario: Duplicate delivery deduped by id
- Design Decision 3 (session derivation from activeSessionId) → Requirement: ADDED Session event derivation from activeSessionId field changes
- Design Decision 4 (visibility replication) → Requirement: ADDED Visibility enforcement in the change-stream/poll-derived delivery path

- Requirements → Tasks: all requirements map to the implementation tasks in `tasks.md` covering `lib/server/transport.ts` broadening, route-handler-unchanged verification, and `CampaignChat.tsx` dedup verification — see `tasks.md`.

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Cursor count stays bounded to one per process after broadening scope

- **Given** N SSE connections are open (N ≥ 2) across M campaigns (M ≥ 1) on Atlas, subscribed to a mix of message, roll, and session activity
- **When** the transport is running with the broadened db-level watch
- **Then** exactly one `MongoClient.db().watch()` cursor exists in the process (same bound as before this change; see `openspec/specs/transport/spec.md` — "Cursor count bounded to one per process")

### Requirement: Security

See functional scenarios: "DM-only roll withheld from a non-DM subscriber via the change-stream path", "DM-only roll delivered to the DM subscriber via the change-stream path", "Visibility enforcement applies identically in the polling path". No additional NFAC scenario needed — these functional scenarios fully cover the access-control property for this change.

### Requirement: Reliability

#### Scenario: Behavior verified in both transport modes

- **Given** the full set of cross-instance delivery, dedup, session-derivation, and visibility scenarios above
- **When** each is exercised under both `detectReplicaSet() === true` (change-stream) and `detectReplicaSet() === false` (polling) mocks
- **Then** the outcome (delivered / withheld / deduped) is identical between the two modes for equivalent inputs
