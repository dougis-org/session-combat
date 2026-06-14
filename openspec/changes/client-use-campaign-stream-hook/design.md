## Context

- Relevant architecture: Next.js app with `"use client"` components. Real-time data flows via SSE (`text/event-stream`) from `GET /api/campaigns/[id]/stream` (issue #311). The hook lives in `lib/hooks/` alongside `useAuth`, `useCombat`, etc.
- Dependencies: `react` (useEffect, useLayoutEffect, useRef, useState); `CampaignStreamEvent` union type from `lib/types.ts`; browser `EventSource` API (accessed via `globalThis` for test isolation).
- Interfaces/contracts touched: `CampaignStreamEvent` in `lib/types.ts`; the hook's public API `useCampaignStream(campaignId, onEvent) → { status }`.

## Goals / Non-Goals

### Goals

- Wrap `EventSource` so components subscribe to a campaign SSE stream with a single hook call.
- Expose `status: 'connecting' | 'open' | 'error'` for UI feedback.
- Reconnect automatically with exponential backoff (1s base, ×2 per failure, cap 30s, reset on success).
- Dispatch typed `CampaignStreamEvent` objects to caller via `onEvent`.
- Tear down cleanly (close ES, cancel pending timer) on unmount or `campaignId` change.

### Non-Goals

- Manual reconnect API.
- Retry count or error details in returned state.
- End-to-end integration test (deferred to 4a).

## Decisions

### Decision 1: `onEvent` stored in a ref (not a dep)

- Chosen: Keep `onEvent` in a `useRef`, synced via `useLayoutEffect` on every render.
- Alternatives considered: Include `onEvent` in `useEffect` dependency array (causes reconnect on every render if caller uses an inline function).
- Rationale: Avoids spurious reconnects while still always calling the latest handler.
- Trade-offs: `useLayoutEffect` fires synchronously after DOM mutation — correct in this case since it must update before the event fires.

### Decision 2: `globalThis.EventSource` (not bare `EventSource`)

- Chosen: Construct `EventSource` via `globalThis.EventSource`.
- Alternatives considered: Import a polyfill; use bare `EventSource`.
- Rationale: Allows Jest tests to swap in `MockEventSource` without a real browser environment. Bare `EventSource` fails in JSDOM.
- Trade-offs: Slightly non-idiomatic; the comment in the file explains why.

### Decision 3: Explicit backoff only on `CLOSED` state; browser-managed on `CONNECTING`

- Chosen: In `onerror`, branch on `es.readyState`. If `CLOSED`, close and schedule explicit reconnect with backoff. If `CONNECTING`, browser is handling it — only update status to `'connecting'`.
- Alternatives considered: Always schedule explicit reconnect regardless of readyState.
- Rationale: Avoids racing with the browser's own retry, which fires first for transient drops. HTTP-level failures (CLOSED) require an explicit new `EventSource`.
- Trade-offs: Two distinct reconnect paths; both are unit-tested (T3-1 vs T3-6).

### Decision 4: `encodeURIComponent` on `campaignId`

- Chosen: URL-encode `campaignId` when constructing the EventSource URL.
- Alternatives considered: Trust callers to pass safe IDs.
- Rationale: Defends against IDs containing slashes or spaces; test T1-3b covers this.
- Trade-offs: None meaningful.

## Proposal to Design Mapping

- Proposal element: Auto-reconnect/backoff
  - Design decision: Decision 3 (explicit backoff on CLOSED; browser-managed on CONNECTING)
  - Validation approach: T3-1 through T3-6 unit tests

- Proposal element: Connection state
  - Design decision: `status` state var with `'connecting' | 'open' | 'error'`
  - Validation approach: T1-1, T1-2, T3-1, T3-6

- Proposal element: Typed event dispatch
  - Design decision: `CampaignStreamEvent` union in `lib/types.ts`; dispatched via `onEventRef`
  - Validation approach: T2-3, T2-4, T2-5

- Proposal element: Stale closure avoidance
  - Design decision: Decision 1 (onEvent ref)
  - Validation approach: T2-5

- Proposal element: Clean teardown
  - Design decision: `torn` flag + `currentEs?.close()` + `clearTimeout(timerId)` in cleanup
  - Validation approach: T4-1, T4-2, T4-3

## Functional Requirements Mapping

- Requirement: Hook connects to `/api/campaigns/[id]/stream`
  - Design element: `new globalThis.EventSource(...)` with URL-encoded campaignId
  - Acceptance criteria reference: T1-3, T1-3b
  - Testability notes: MockEventSource records the URL passed to constructor

- Requirement: Reconnects after CLOSED error with backoff
  - Design element: `onerror` CLOSED branch; `delay` var doubling up to 30s
  - Acceptance criteria reference: T3-1 through T3-5
  - Testability notes: jest fake timers advance backoff intervals

- Requirement: Tears down on unmount
  - Design element: useEffect cleanup closes ES and clears timer
  - Acceptance criteria reference: T4-1, T4-2, T4-3
  - Testability notes: MockEventSource.close is a jest.fn(); timer checked with runAllTimers

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Reconnect cap prevents runaway retry storms
  - Design element: `Math.min(delay * 2, 30_000)` cap
  - Acceptance criteria reference: T3-4
  - Testability notes: Advance fake timers through 5 failures, verify 30s cap

- Requirement category: testability
  - Requirement: All branches exercised without a real browser
  - Design element: `globalThis.EventSource` swap; `MockEventSource` in test setup
  - Acceptance criteria reference: All T1–T4 tests
  - Testability notes: beforeEach replaces globalThis.EventSource; afterEach restores it

## Risks / Trade-offs

- Risk/trade-off: `CampaignStreamEvent` type is minimal (`heartbeat | change`) and will need extension as 4a defines more event names.
  - Impact: Callers may receive events they cannot discriminate until the type is updated.
  - Mitigation: Discriminated union is open for extension; adding variants is non-breaking.

## Rollback / Mitigation

- Rollback trigger: Hook causes regressions in existing component behaviour.
- Rollback steps: Revert the hook file; the type extension to `lib/types.ts` is additive and safe to leave.
- Data migration considerations: None (client-only, no persistent state).
- Verification after rollback: Run full test suite; verify no import errors.

## Operational Blocking Policy

- If CI checks fail: Read failure logs via `gh run view --log-failed`, fix in code, re-push.
- If security checks fail: Treat as a blocking CI failure; investigate dependency advisories.
- If required reviews are blocked/stale: Address all unresolved review threads; resolve via GraphQL mutation if auto-resolve hasn't fired after 3-minute wait.
- Escalation path and timeout: If blocked for > 24 h with no reviewer response, ping the team in the PR and flag to the project maintainer.

## Open Questions

- No unresolved questions. All design decisions are already implemented and tested.
