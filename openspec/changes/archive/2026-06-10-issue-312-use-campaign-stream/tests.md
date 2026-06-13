---
name: tests
description: Tests for useCampaignStream hook
---

# Tests

## Overview

Test plan for the `issue-312-use-campaign-stream` change. All work follows strict TDD: write a failing test first, write the minimum code to pass it, refactor.

Test file: `tests/unit/hooks/useCampaignStream.test.ts`

A `MockEventSource` class is set up in the test file and assigned to `globalThis.EventSource` in `beforeEach`. It exposes:
- `triggerOpen()` — fires the `onopen` handler
- `triggerError(readyState)` — fires the `onerror` handler with a given `readyState`
- `triggerEvent(type, data)` — fires a named event listener with a `MessageEvent`
- `close` spy — records calls to `close()`

All reconnect-related tests use `jest.useFakeTimers()`.

---

## Test Cases

### T1 — Connection lifecycle

Spec ref: `specs/use-campaign-stream/spec.md` — Requirement: Connection lifecycle

- [ ] **T1-1** Initial status is `'connecting'`
  - Task ref: T1 (hook implementation)
  - Given: `renderHook(() => useCampaignStream('c1', onEvent))`
  - Then: returned `status` is `'connecting'` before `triggerOpen()` is called

- [ ] **T1-2** Status transitions to `'open'` after `onopen`
  - Task ref: T1
  - Given: hook mounted
  - When: `mockEs.triggerOpen()`
  - Then: `status` is `'open'`

- [ ] **T1-3** `EventSource` constructed with correct URL
  - Task ref: T1
  - Given: `useCampaignStream('campaign-abc', onEvent)` mounted
  - Then: `MockEventSource` constructor was called with `/api/campaigns/campaign-abc/stream`

- [ ] **T1-4** `campaignId` change closes previous `EventSource` and opens new one
  - Task ref: T1
  - Given: hook mounted with `campaignId = 'a'`, `triggerOpen()` called
  - When: re-rendered with `campaignId = 'b'`
  - Then: first mock's `close()` called; second `MockEventSource` constructor called with `/api/campaigns/b/stream`; `status` returns to `'connecting'`

---

### T2 — Event dispatch

Spec ref: `specs/use-campaign-stream/spec.md` — Requirement: Event dispatch

- [ ] **T2-1** `addEventListener('heartbeat', ...)` is registered (not `onmessage`)
  - Task ref: T1
  - Given: hook mounted
  - Then: `mockEs.addEventListener` was called with `'heartbeat'`; `mockEs.onmessage` is `null` or not assigned

- [ ] **T2-2** `addEventListener('change', ...)` is registered
  - Task ref: T1
  - Given: hook mounted
  - Then: `mockEs.addEventListener` was called with `'change'`

- [ ] **T2-3** Heartbeat event dispatched to `onEvent`
  - Task ref: T1
  - Given: hook mounted, `triggerOpen()` called
  - When: `mockEs.triggerEvent('heartbeat', '{"type":"heartbeat","campaignId":"c1","data":{"ts":1000}}')`
  - Then: `onEvent` called once with `{ type: 'heartbeat', campaignId: 'c1', data: { ts: 1000 } }`

- [ ] **T2-4** Change event dispatched to `onEvent`
  - Task ref: T1
  - Given: hook mounted, `triggerOpen()` called
  - When: `mockEs.triggerEvent('change', '{"type":"change","campaignId":"c1","data":{"name":"updated"}}')`
  - Then: `onEvent` called once with `{ type: 'change', campaignId: 'c1', data: { name: 'updated' } }`

- [ ] **T2-5** Updated `onEvent` ref receives subsequent events without reconnect
  - Task ref: T1
  - Given: hook mounted with `onEvent = fn1`, `triggerOpen()` called
  - When: re-rendered with `onEvent = fn2` (same `campaignId`); `mockEs.triggerEvent('change', ...)`
  - Then: `fn2` receives the event; `fn1` does not; no new `MockEventSource` constructed

---

### T3 — Reconnect behaviour

Spec ref: `specs/use-campaign-stream/spec.md` — Requirement: Reconnect behaviour

All tests in this group use `jest.useFakeTimers()`.

- [ ] **T3-1** `onerror` + `CLOSED` → status `'error'`, reconnect after 1 000 ms
  - Task ref: T1
  - Given: hook mounted, `triggerOpen()` called
  - When: `mockEs.triggerError(EventSource.CLOSED)`
  - Then: `status` is `'error'`; after `jest.advanceTimersByTime(1000)` a second `MockEventSource` is constructed

- [ ] **T3-2** Backoff doubles on second failure
  - Task ref: T1
  - Given: T3-1 scenario complete; second `MockEventSource` also fires `onerror` + `CLOSED`
  - When: `jest.advanceTimersByTime(2000)`
  - Then: a third `MockEventSource` is constructed

- [ ] **T3-3** Backoff doubles again (4 000 ms) on third failure
  - Task ref: T1
  - Given: continuation of T3-2
  - When: third `MockEventSource` fires `onerror` + `CLOSED`; `jest.advanceTimersByTime(4000)`
  - Then: a fourth `MockEventSource` is constructed

- [ ] **T3-4** Backoff is capped at 30 000 ms
  - Task ref: T1
  - Given: backoff has doubled past 30 000 ms (after ~5 failures: 1 s, 2 s, 4 s, 8 s, 16 s, 32 s → capped)
  - Then: the scheduled delay is exactly 30 000 ms, not a larger value

- [ ] **T3-5** Backoff resets to 1 000 ms after successful reconnect
  - Task ref: T1
  - Given: first reconnect attempt succeeds (`triggerOpen()` on second `MockEventSource`)
  - When: second `MockEventSource` also fires `onerror` + `CLOSED`
  - Then: next reconnect is scheduled after 1 000 ms (not a doubled value)

- [ ] **T3-6** `onerror` with `CONNECTING` state does not schedule reconnect
  - Task ref: T1
  - Given: hook mounted, `triggerOpen()` called
  - When: `mockEs.triggerError(EventSource.CONNECTING)`; `jest.runAllTimers()`
  - Then: no additional `MockEventSource` is constructed

---

### T4 — Teardown

Spec ref: `specs/use-campaign-stream/spec.md` — Requirement: Teardown

- [ ] **T4-1** `es.close()` called on unmount (open state)
  - Task ref: T1
  - Given: hook mounted, `triggerOpen()` called
  - When: `unmount()` (from `renderHook`)
  - Then: `mockEs.close` spy called exactly once

- [ ] **T4-2** Pending reconnect timer cancelled on unmount
  - Task ref: T1
  - Given: `onerror` + `CLOSED` fired; reconnect timer running (fake timers)
  - When: `unmount()` before timer fires; `jest.runAllTimers()`
  - Then: no additional `MockEventSource` constructed; no React setState warning

- [ ] **T4-3** Unmount before `onopen` does not throw
  - Task ref: T1
  - Given: hook mounted, `onopen` not yet fired (`status = 'connecting'`)
  - When: `unmount()`
  - Then: `mockEs.close()` called; no error thrown
