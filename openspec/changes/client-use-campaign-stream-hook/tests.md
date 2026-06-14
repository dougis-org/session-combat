---
name: tests
description: Tests for the client-use-campaign-stream-hook change
---

# Tests

## Overview

This document outlines the tests for the `client-use-campaign-stream-hook` change.
All work follows a strict TDD process: write a failing test, make it pass, refactor.

The full test suite lives in `tests/unit/hooks/useCampaignStream.test.ts`.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2. **Write code to pass the test:** Write the simplest possible code to make the test pass.
3. **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### T-1 — `CampaignStreamEvent` type (lib/types.ts)

- [x] T1-type-1: Type compiles correctly — TypeScript accepts a `heartbeat` event shape
- [x] T1-type-2: Type compiles correctly — TypeScript accepts a `change` event shape
- [x] T1-type-3: Discriminated union is exhaustive — unknown `type` values are rejected at compile time

### T-2 / T-3 — `useCampaignStream` hook (lib/hooks/useCampaignStream.ts + tests/)

Maps to spec scenarios in `specs/use-campaign-stream-hook/spec.md`.

#### T1 — Connection lifecycle

- [x] T1-1: initial status is `connecting`
- [x] T1-2: status becomes `open` after `onopen` fires
- [x] T1-3: `EventSource` constructed with correct URL for a plain campaignId
- [x] T1-3b: campaignId containing `/` and spaces is URL-encoded in the EventSource URL
- [x] T1-4: campaignId change closes previous `EventSource` and opens a new one; status resets to `connecting`

#### T2 — Event dispatch

- [x] T2-1: `addEventListener('heartbeat')` is called; `onmessage` is NOT assigned
- [x] T2-2: `addEventListener('change')` is called
- [x] T2-3: `heartbeat` SSE frame is parsed and dispatched to `onEvent` with correct shape
- [x] T2-4: `change` SSE frame is parsed and dispatched to `onEvent` with correct shape
- [x] T2-5: updated `onEvent` reference receives subsequent events without triggering reconnect (stale closure test)

#### T3 — Reconnect behaviour

- [x] T3-1: `onerror` + `CLOSED` state → status `error`, new `EventSource` created after 1000 ms
- [x] T3-2: backoff doubles on second failure (2000 ms)
- [x] T3-3: backoff doubles again on third failure (4000 ms)
- [x] T3-4: backoff is capped at 30 000 ms after multiple failures
- [x] T3-5: backoff resets to 1000 ms after a successful `onopen`
- [x] T3-6: `onerror` + `CONNECTING` state → status `connecting`; no explicit reconnect scheduled; no new `EventSource`

#### T4 — Teardown

- [x] T4-1: `es.close()` called on unmount when status is `open`
- [x] T4-2: pending reconnect timer is cancelled on unmount before the timer fires
- [x] T4-3: unmount before `onopen` does not throw; `es.close()` still called
