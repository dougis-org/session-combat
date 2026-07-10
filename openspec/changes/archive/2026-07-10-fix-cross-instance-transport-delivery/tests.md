---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `fix-cross-instance-transport-delivery` change. All work should follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T1 — Two-instance simulation harness (`tests/unit/server/transport.test.ts`)

- [x] Harness constructs two independent transport module instances (`jest.isolateModules` or equivalent), each with its own mocked Mongo client/cursor/collection stubs, sharing one fake underlying doc store so a write via instance A's mocks is visible to instance B's mocked `watch()`/poll query
- [x] Harness proves the two instances' `registry` Maps are independent (throwaway assertion removed once confirmed; not a permanent test case)

### T2 — Broaden the Atlas change-stream path

Maps to spec scenarios in `specs/transport/spec.md`: "Single shared cursor covers all three collections", "Event routed to correct campaign subscribers regardless of source collection", "Session event delivered cross-instance (change-stream path)", "Roll event delivered cross-instance (change-stream path)", "Message event delivered cross-instance (change-stream path)".

- [x] Test: first `subscribe()` on a replica-set-mocked instance opens exactly one `db().watch()` cursor (not `collection('campaigns').watch()`) — fails before T2 implementation, passes after
- [x] Test: a change document from `campaignRolls` with `fullDocument.campaignId === 'A'` is routed only to campaign A's handlers, built as a `{ type: 'roll', ... }` event
- [x] Test: a change document from `campaignMessages` with `fullDocument.campaignId === 'A'` is routed only to campaign A's handlers, built as a `{ type: 'message', ... }` event
- [x] Test (two-instance harness): instance A sets `activeSessionId` on a `campaigns` doc for "camp-1"; instance B's registered subscriber for "camp-1" receives a `session` event without instance A calling instance B directly
- [x] Test (two-instance harness): instance A inserts a `campaignRolls` doc for "camp-1"; instance B's subscriber receives the corresponding `roll` event
- [x] Test (two-instance harness): instance A inserts a `campaignMessages` doc for "camp-1"; instance B's subscriber receives the corresponding `message` event
- [x] Regression: existing scenarios "First subscription opens the shared change stream (Atlas)", "Subsequent subscriptions reuse the existing stream", "Concurrent subscriptions during lazy open do not race", "Teardown removes subscriber", "Last subscriber drop closes the shared stream", "Last subscriber drops while open is in flight", "Change stream cursor invalidation triggers one reconnect" still pass unmodified against the db-level watch

### T3 — Broaden the polling path

Maps to spec scenarios: "Session, roll, and message events delivered cross-instance (polling path)", "Polling observes new messages and rolls, not just campaign changes".

- [x] Test: polling subscriber with `sinceTimestamp` T0 receives a `message` event when a new `campaignMessages` doc with `createdAt > T0` appears for its campaign
- [x] Test: polling subscriber receives a `roll` event when a new `campaignRolls` doc with `createdAt > T0` appears for its campaign
- [x] Test: `sinceTimestamp` advances to current time after a poll cycle covering all three collections
- [x] Test (two-instance harness, both polling): a session start/end, roll insert, or message insert made "via instance A" is observed by instance B's next poll cycle and delivered to instance B's subscribers
- [x] Regression: existing scenarios "Replica-set detection selects polling path", "Detection result is cached", "Polling emits new events since last check", "Polling skips events for other campaigns", "Polling teardown stops the interval", "Transport does not crash the process on poll DB error" still pass

### T4 — Session event derivation from `activeSessionId`

Maps to spec scenarios: "Unrelated campaign field change does not emit a spurious session event", "activeSessionId change emits a session event", "Per-campaign session state is cleaned up when the last subscriber tears down".

- [x] Test (change-stream branch): a `campaigns` write changing only `name` (with `activeSessionId` unchanged) emits no `session` event; a `change` event may still be emitted
- [x] Test (change-stream branch): a `campaigns` write changing `activeSessionId` from `null` to `"session-2"` emits `{ type: 'session', campaignId, data: { activeSessionId: 'session-2' } }`, and the transport's last-known value updates
- [x] Test (polling branch): same two scenarios above, mirrored under polling mode
- [x] Test: after the last subscriber for a campaign tears down, the transport's last-known `activeSessionId` state for that campaign is removed (assert via re-subscribing and confirming the "unrelated field change" test's baseline behavior, i.e. no stale state leaks into a fresh subscription)

### T5 — Visibility replication in the Mongo-observed path

Maps to spec scenarios: "DM-only roll withheld from a non-DM subscriber via the change-stream path", "DM-only roll delivered to the DM subscriber via the change-stream path", "Visibility enforcement applies identically in the polling path" (and message equivalents).

- [x] Test (change-stream branch): a `dm-only` roll inserted on instance A is NOT delivered to a non-DM subscriber ("player-1") registered on instance B
- [x] Test (change-stream branch): the same `dm-only` roll IS delivered to a DM-role subscriber registered on instance B
- [x] Test (change-stream branch): message equivalent of the above two cases using `canSeeMessage`
- [x] Test (polling branch): same withhold/deliver outcomes as the change-stream branch, for both rolls and messages
- [x] Test: `storage.listMembersForCampaign` is called at most once per poll/change-batch when filtering multiple events/subscribers for the same campaign (memoization check)

### T6 — Same-instance fast path + client-side dedup

Maps to spec scenarios: "Same-instance subscriber receives the fast-path delivery immediately", "Duplicate delivery deduped by id".

- [x] Test (`tests/unit/server/transport.test.ts`): a same-instance subscriber's handler is invoked synchronously within `emitFiltered()`, independent of any change-stream/poll cycle having run
- [x] Test (`tests/unit/components/CampaignChat.test.tsx`): delivering the same roll `id` twice through `onStreamEvent` (simulating fast-path + Mongo-observed redelivery) results in the feed containing exactly one entry for that id
- [x] Test (`tests/unit/components/CampaignChat.test.tsx`): delivering the same message `id` twice through `onStreamEvent` results in the feed containing exactly one entry for that id
- [x] Test: delivering the same `activeSessionId` value twice via `onSessionChange` does not cause incorrect state (idempotent; assert final state is correct, not necessarily that a second call is suppressed)
- [x] Regression: existing route handler tests (`tests/unit/api/campaigns/[id]/sessions/active.route.test.ts` and equivalents for messages/rolls) still pass with `emitFiltered` called unchanged

### T7 — Architecture docs

- [x] Manual review: `docs/multi-user-campaigns/04-realtime-transport.md` diagrams and text accurately describe the db-level watch across `campaigns`/`campaignMessages`/`campaignRolls`, the derived `session` event, and the dual-path delivery model (no automated test; verified during PR review)

## Non-Functional Test Cases

- [x] Test: with N ≥ 2 SSE connections across M ≥ 1 campaigns on a replica-set-mocked instance, exactly one `db().watch()` cursor exists in the process after the broadened watch (extends existing "Cursor count bounded to one per process" coverage)
- [x] Test: every cross-instance/dedup/session-derivation/visibility scenario above is run under both `detectReplicaSet() === true` and `detectReplicaSet() === false` mocks, asserting identical delivered/withheld/deduped outcomes for equivalent inputs
