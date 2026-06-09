---
name: tests
description: TDD test plan for issue-311-sse-stream-transport (SSE stream endpoint + transport abstraction)
---

# Tests

## Overview

Tests for `issue-311-sse-stream-transport`. All implementation follows strict TDD: write a failing test, make it pass, refactor. Each case maps to a task in `tasks.md` and a scenario in `specs/`.

Test files:
- `tests/unit/server/transport.test.ts` — transport abstraction unit tests (T3)
- `tests/integration/campaigns-stream.integration.test.ts` — SSE endpoint integration tests (T4)

Existing file to verify unchanged behavior:
- `tests/unit/lib/middleware.test.ts` (or equivalent) — must still pass after T2 exports

---

## T1 — CampaignStreamEvent type

### T1-1: Heartbeat event compiles with correct shape
- **Spec:** transport/spec.md — "Heartbeat event shape"
- **File:** compile-time only (no runtime test needed)
- **Given** `CampaignStreamEvent` is defined
- **When** `const e: CampaignStreamEvent = { type: 'heartbeat', campaignId: 'c1', data: { ts: 1 } }`
- **Then** `npx tsc --noEmit` passes with no errors

### T1-2: Unknown event type is rejected by TypeScript
- **Spec:** transport/spec.md — "TypeScript rejects unknown event types"
- **File:** compile-time only
- **Given** `CampaignStreamEvent` is a closed union
- **When** `const e: CampaignStreamEvent = { type: 'unknown', campaignId: 'c1', data: {} }`
- **Then** TypeScript emits a type error (verified by `tsc --noEmit` failing on that line in a negative-test file)

---

## T2 — withStreamAndParams middleware

### T2-1: Existing middleware tests still pass
- **Spec:** sse-stream/spec.md — "Auth logic identical to withAuthAndParams"
- **File:** existing `tests/unit/` middleware test file
- **When** `npx jest lib/middleware` (or equivalent) is run after T2 changes
- **Then** all previously passing tests still pass

### T2-2: withStreamAndParams rejects missing token
- **Spec:** sse-stream/spec.md — "Unauthorized request rejected before stream opens"
- **File:** `tests/unit/server/transport.test.ts` or middleware test
- **Given** a request with no auth cookie or Authorization header
- **When** a handler wrapped with `withStreamAndParams` is called
- **Then** the response status is `401` and the handler is never invoked

### T2-3: withStreamAndParams rejects invalidated session
- **Spec:** sse-stream/spec.md — "Expired / invalidated session rejected"
- **File:** `tests/unit/` middleware test
- **Given** a JWT whose `tokenVersion` does not match the DB record
- **When** `withStreamAndParams` processes the request
- **Then** response status is `401`

### T2-4: withStreamAndParams passes auth payload and params to handler
- **Spec:** sse-stream/spec.md — "Handler receives typed params"
- **File:** `tests/unit/` middleware test
- **Given** a valid token and params `{ id: 'abc' }`
- **When** `withStreamAndParams<{ id: string }>` wraps a handler
- **Then** the handler receives the correct `auth.userId` and `params.id === 'abc'`

---

## T3 — Transport abstraction (lib/server/transport.ts)

File: `tests/unit/server/transport.test.ts`

### T3-1: First subscribe (Atlas) opens exactly one cursor
- **Spec:** transport/spec.md — "First subscription opens the shared change stream"
- **Given** `isReplicaSet` detection returns `true`
- **When** `subscribe('campaign-1', handler)` is called
- **Then** `client.watch` is called exactly once

### T3-2: Second subscribe reuses existing cursor
- **Spec:** transport/spec.md — "Subsequent subscriptions reuse the existing stream"
- **Given** a cursor is already open
- **When** `subscribe('campaign-2', handler2)` is called
- **Then** `client.watch` call count remains 1

### T3-3: Concurrent subscribes during lazy open result in one cursor
- **Spec:** transport/spec.md — "Concurrent subscriptions during lazy open do not race"
- **Given** no cursor is open
- **When** two `subscribe()` calls are made before `watch()` resolves (Promise not yet settled)
- **Then** `client.watch` is called exactly once
- **And** both handlers are registered

### T3-4: Teardown removes handler from registry
- **Spec:** transport/spec.md — "Teardown removes subscriber"
- **Given** a handler is subscribed to `campaignId: 'c1'`
- **When** the returned teardown function is called
- **Then** the handler is no longer in the registry for `'c1'`

### T3-5: Last subscriber teardown closes cursor
- **Spec:** transport/spec.md — "Last subscriber drop closes the shared stream"
- **Given** only one subscriber remains
- **When** its teardown function is called
- **Then** `cursor.close()` is called
- **And** `openPromise` is reset to `null`

### T3-6: Last subscriber drops while open is in flight
- **Spec:** transport/spec.md — "Last subscriber drops while open is in flight"
- **Given** `watch()` has been called but not yet resolved
- **When** the sole subscriber's teardown fires before the promise settles
- **Then** `cursor.close()` is called immediately after the promise resolves
- **And** no events are dispatched after teardown

### T3-7: Change stream event routes to correct campaign handlers only
- **Spec:** transport/spec.md — "Event routed to correct campaign subscribers"
- **Given** handlers for campaign A and campaign B are registered
- **When** a change document arrives with `fullDocument.campaignId === 'A'`
- **Then** only campaign A's handler is called
- **And** campaign B's handler is not called

### T3-8: Non-replica-set detection selects polling path
- **Spec:** transport/spec.md — "Replica-set detection selects polling path"
- **Given** `db.admin().command({ replSetGetStatus: 1 })` throws with a non-replica-set error
- **When** `subscribe()` is called
- **Then** `client.watch` is NOT called
- **And** a polling interval is started

### T3-9: Detection result is cached across subscribes
- **Spec:** transport/spec.md — "Detection result is cached"
- **Given** detection has already run once
- **When** a second `subscribe()` call arrives
- **Then** `db.admin().command` is called only once total

### T3-10: Polling emits events since last timestamp
- **Spec:** transport/spec.md — "Polling emits new events since last check"
- **Given** polling mode is active with `sinceTimestamp = T0`
- **And** a document exists in the collection with `createdAt > T0` and matching `campaignId`
- **When** the poll interval fires
- **Then** the handler is called with a `CampaignStreamEvent`
- **And** `sinceTimestamp` advances to after T0

### T3-11: Polling skips documents for other campaigns
- **Spec:** transport/spec.md — "Polling skips events for other campaigns"
- **Given** polling for campaign A
- **When** only a document with `campaignId === 'B'` exists since last check
- **Then** the handler is NOT called

### T3-12: Polling teardown clears interval
- **Spec:** transport/spec.md — "Polling teardown stops the interval"
- **Given** a polling interval is running
- **When** the teardown function is called
- **Then** `clearInterval` is called and no further polls occur

### T3-13: Cursor invalidation triggers one reconnect attempt
- **Spec:** transport/spec.md — "Change stream cursor invalidation triggers one reconnect"
- **Given** the shared cursor is open
- **When** the cursor emits a `ChangeStreamInvalidatedError`
- **Then** one `client.watch()` call is made for reconnect
- **And** event delivery resumes after successful reconnect

### T3-14: Poll DB error is caught, interval continues
- **Spec:** transport/spec.md — "Transport does not crash the process on poll DB error"
- **Given** polling mode is active
- **When** `getDatabase()` throws during a poll
- **Then** the error is logged (`console.error`)
- **And** the interval continues (subscriber not removed)

---

## T4 — SSE stream endpoint

File: `tests/integration/campaigns-stream.integration.test.ts`

### T4-1: Authorized member receives 200 text/event-stream
- **Spec:** sse-stream/spec.md — "Authorized member opens stream"
- **Given** a valid token for an active campaign member
- **When** `GET /api/campaigns/[id]/stream`
- **Then** response status `200`, `Content-Type: text/event-stream`

### T4-2: Missing token returns 401
- **Spec:** sse-stream/spec.md — "Unauthorized request rejected before stream opens"
- **Given** no auth token in request
- **When** `GET /api/campaigns/[id]/stream`
- **Then** status `401`, no SSE bytes written

### T4-3: Invalidated token returns 401
- **Spec:** sse-stream/spec.md — "Expired / invalidated session rejected"
- **Given** a JWT with mismatched `tokenVersion`
- **When** `GET /api/campaigns/[id]/stream`
- **Then** status `401`

### T4-4: Non-member returns 404
- **Spec:** sse-stream/spec.md — "Forbidden request rejected for non-member"
- **Given** valid auth but user not in campaign
- **When** `GET /api/campaigns/[id]/stream`
- **Then** status `404`

### T4-5: Heartbeat event emitted within interval
- **Spec:** sse-stream/spec.md — "Heartbeat emitted at interval"
- **Given** an open SSE connection (using fake timers)
- **When** 25 seconds advance
- **Then** a `heartbeat` SSE frame is emitted with correct `campaignId` and `ts`

### T4-6: Abort signal triggers teardown
- **Spec:** sse-stream/spec.md — "Connection closes cleanly on client disconnect"
- **Given** an open SSE connection
- **When** the `AbortController` fires
- **Then** the transport teardown fn is called
- **And** the heartbeat interval is cleared
- **And** the stream controller is closed

### T4-7: Two connections to same campaign share one cursor
- **Spec:** transport/spec.md — "Cursor count bounded to one per process" (NFAC)
- **Given** Atlas mode active (mock)
- **When** two simultaneous `GET /api/campaigns/[id]/stream` requests open
- **Then** `client.watch` is called exactly once

### T4-8: Reconnected client establishes fresh subscription
- **Spec:** sse-stream/spec.md — "Reconnected client gets a fresh subscription"
- **Given** a client previously disconnected
- **When** same client reconnects
- **Then** a new subscription is created and heartbeats flow normally
