## Context

- Relevant architecture: Phase 4 real-time transport. The server side (`GET /api/campaigns/[id]/stream`) is complete (issue #311). It emits `text/event-stream` with named event types (`event: heartbeat` / `event: change`) and JSON `data:` payloads matching the `CampaignStreamEvent` discriminated union. Auth is session-cookie-based via `withStreamAndParams` middleware.
- Dependencies: `CampaignStreamEvent` type (`lib/types.ts`), `EventSource` Web API, React (`useEffect`, `useRef`, `useState`, `useCallback`).
- Interfaces/contracts touched: New export `useCampaignStream` from `lib/hooks/useCampaignStream.ts`. No changes to existing files.

## Goals / Non-Goals

### Goals

- Wrap `EventSource` in a stable React hook with typed event dispatch
- Expose connection status for UI feedback
- Auto-reconnect with exponential backoff on HTTP-level failures
- Clean teardown on unmount and on `campaignId` change

### Non-Goals

- Interpreting event semantics (consumer's responsibility)
- Batching or deduplicating events
- Persisting events across remounts
- Polyfilling `EventSource` for non-supporting environments

## Decisions

### Decision 1: Use native `EventSource`, not `fetch` + `ReadableStream`

- Chosen: Native `EventSource`
- Alternatives considered: `fetch` with `ReadableStream` reader (gives full control over headers and retry); third-party `eventsource` polyfill
- Rationale: Auth is cookie-based so no custom headers are needed. Native `EventSource` handles same-origin credentials automatically. The simpler API reduces surface area for bugs.
- Trade-offs: Cannot set custom auth headers if auth mechanism changes. Browser controls baseline retry interval (~3 s) for network drops; we layer explicit backoff only for HTTP errors.

### Decision 2: `addEventListener` per named event type, not `onmessage`

- Chosen: `es.addEventListener('heartbeat', handler)` + `es.addEventListener('change', handler)`
- Alternatives considered: `es.onmessage` (single handler)
- Rationale: The server sets `event: heartbeat` / `event: change` on every frame. The `onmessage` handler only fires when no `event:` field is present; it would silently drop all messages.
- Trade-offs: Must register a listener per event type. Adding a new server-side event type requires a matching `addEventListener` call in the hook. Acceptable for Phase 4's two-type set.

### Decision 3: `onEvent` callback stored in a ref

- Chosen: `const onEventRef = useRef(onEvent); onEventRef.current = onEvent;` — effect captures the ref, not the function
- Alternatives considered: Include `onEvent` in effect deps (triggers reconnect on every render if consumer doesn't stabilise the function); `useCallback` in consumer (leaks responsibility)
- Rationale: Prevents stale closure bugs without forcing reconnect on each render.
- Trade-offs: Slightly non-obvious pattern; covered by a code comment.

### Decision 4: Explicit exponential backoff for `onerror` + `readyState === CLOSED`

- Chosen: On `onerror`, if `es.readyState === EventSource.CLOSED`, close the current instance, schedule reconnect after `min(delay * 2, 30000)` ms (starting at 1 s). Reset delay to 1 s on successful `onopen`.
- Alternatives considered: Rely solely on browser's built-in retry (no explicit backoff); immediate reconnect loop
- Rationale: Browser auto-reconnect handles transient network drops but does not recover from HTTP 401/403/500 responses (the stream closes permanently). Explicit backoff prevents hammering a broken server.
- Trade-offs: Two reconnect paths (browser-native for network, explicit for HTTP errors). Documented in code.

### Decision 5: Expose `status` string literal union, not boolean flags

- Chosen: `status: 'connecting' | 'open' | 'closed' | 'error'`
- Alternatives considered: `{ connected: boolean; error: boolean }`; just `boolean`
- Rationale: Consumers need to distinguish connecting (spinner) from error (show retry message) from open (active). A union is exhaustive and type-safe.
- Trade-offs: Consumers must handle four states; `'closed'` is the terminal state after explicit teardown (distinct from `'error'`).

### Decision 6: `campaignId` change tears down and recreates `EventSource`

- Chosen: `campaignId` in `useEffect` dependency array; teardown runs on change before new effect fires
- Alternatives considered: Imperative reconnect API (`reconnect()` function returned from hook)
- Rationale: Declarative — hook stays consistent with React idioms. `campaignId` changing is semantically a different subscription.
- Trade-offs: Brief `'connecting'` flash on `campaignId` change. Acceptable.

## Proposal to Design Mapping

- Proposal element: Auth via cookies, no custom headers
  - Design decision: Decision 1 (native `EventSource`)
  - Validation approach: Unit test — `EventSource` constructor called with URL only, no options object

- Proposal element: Named SSE event types (`event: heartbeat` / `event: change`)
  - Design decision: Decision 2 (`addEventListener` per type)
  - Validation approach: Unit test — mock `EventSource`, assert `addEventListener('heartbeat', ...)` and `addEventListener('change', ...)` are called

- Proposal element: Stale callback risk
  - Design decision: Decision 3 (ref pattern)
  - Validation approach: Unit test — update `onEvent` prop between renders, assert new callback receives subsequent events

- Proposal element: Auto-reconnect with backoff
  - Design decision: Decision 4
  - Validation approach: Unit tests — simulate `onerror` + CLOSED; assert new `EventSource` created after delay; assert delay doubles; assert cap at 30 s

- Proposal element: Connection status
  - Design decision: Decision 5
  - Validation approach: Unit tests — assert status transitions: `connecting` → `open` on `onopen`; `open` → `error` on `onerror`+CLOSED

- Proposal element: Teardown on unmount
  - Design decision: Decision 6 + teardown in effect cleanup
  - Validation approach: Unit test — unmount hook, assert `es.close()` called and backoff timer cancelled

## Functional Requirements Mapping

- Requirement: Open `EventSource` to `/api/campaigns/[id]/stream`
  - Design element: `useEffect` creates `new EventSource(url)` on mount and `campaignId` change
  - Acceptance criteria reference: specs/use-campaign-stream/spec.md — Connection lifecycle
  - Testability notes: Mock `globalThis.EventSource`; assert constructor URL

- Requirement: Dispatch typed events via `onEvent` callback
  - Design element: `addEventListener` handlers parse `e.data` as JSON, call `onEventRef.current`
  - Acceptance criteria reference: specs/use-campaign-stream/spec.md — Event dispatch
  - Testability notes: Fire mock `MessageEvent` on mock `EventSource`; assert callback received parsed object

- Requirement: Expose connection status
  - Design element: `useState<Status>('connecting')` updated in `onopen` / `onerror` / cleanup
  - Acceptance criteria reference: specs/use-campaign-stream/spec.md — Connection state
  - Testability notes: Assert `status` value after triggering each `EventSource` lifecycle event

- Requirement: Auto-reconnect with exponential backoff
  - Design element: Decision 4 backoff logic in `onerror` handler
  - Acceptance criteria reference: specs/use-campaign-stream/spec.md — Reconnect behaviour
  - Testability notes: Use fake timers; assert `EventSource` re-constructed after correct delay intervals

- Requirement: Teardown on unmount
  - Design element: Effect cleanup calls `es.close()` and clears backoff timer
  - Acceptance criteria reference: specs/use-campaign-stream/spec.md — Teardown
  - Testability notes: Unmount via `renderHook` cleanup; assert `close` called

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Reconnect cap prevents thundering herd against a broken server
  - Design element: `Math.min(delay * 2, 30_000)` cap in Decision 4
  - Acceptance criteria reference: specs/use-campaign-stream/spec.md — Reconnect behaviour
  - Testability notes: Assert delay after 10 onerror cycles equals 30 s

- Requirement category: reliability
  - Requirement: No state updates on unmounted component
  - Design element: `torn` flag checked before `setState` calls in async paths; timer cleared in cleanup
  - Acceptance criteria reference: Implicit — no React warning in test output
  - Testability notes: Unmount during reconnect delay; assert no setState warning

- Requirement category: operability
  - Requirement: Hook usable without SSR errors (Next.js server components)
  - Design element: `"use client"` directive; `EventSource` access only inside `useEffect`
  - Acceptance criteria reference: No SSR-specific spec — covered by build passing
  - Testability notes: TypeScript build passes; no `window is not defined` errors

## Risks / Trade-offs

- Risk/trade-off: New server event type added without updating hook
  - Impact: New event type silently dropped
  - Mitigation: Document the `addEventListener` registration requirement; the `CampaignStreamEvent` type union is the source of truth — adding a variant should prompt updating the hook

- Risk/trade-off: Test environment lacks `EventSource`
  - Impact: Tests fail at runtime
  - Mitigation: Assign a mock class to `globalThis.EventSource` in test setup

## Rollback / Mitigation

- Rollback trigger: Hook causes regressions in existing campaign pages, or SSE connections exhaust server resources in staging
- Rollback steps: Delete `lib/hooks/useCampaignStream.ts` and its test file; no other files changed
- Data migration considerations: None — hook is new, no existing consumers
- Verification after rollback: `npm run build` and `npm test` pass on main

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the failing check before reopening for review.
- If security checks fail: Do not merge. Escalate to repo owner if check appears to be a false positive.
- If required reviews are blocked/stale: Re-request after 24 h; escalate to repo owner after 48 h.
- Escalation path and timeout: Ping `@dougis` in the PR thread after 48 h of no review activity.

## Open Questions

No open questions. All design decisions were resolved during exploration prior to proposal.
