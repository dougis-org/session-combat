## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

---

### Requirement: ADDED Connection lifecycle

The system SHALL open an `EventSource` connection to `/api/campaigns/[id]/stream` on mount and expose a `status` reflecting the current connection state.

#### Scenario: Initial status is connecting

- **Given** a consumer renders `useCampaignStream('campaign-1', onEvent)`
- **When** the hook mounts
- **Then** `status` is `'connecting'` before the `EventSource` fires `onopen`

#### Scenario: Status transitions to open on successful connection

- **Given** `useCampaignStream` has mounted and `status` is `'connecting'`
- **When** the mock `EventSource` fires its `onopen` handler
- **Then** `status` becomes `'open'`

#### Scenario: Correct URL is used

- **Given** a consumer renders `useCampaignStream('campaign-abc', onEvent)`
- **When** the hook mounts
- **Then** `EventSource` is constructed with `/api/campaigns/campaign-abc/stream`

#### Scenario: campaignId change recreates the connection

- **Given** `useCampaignStream` is mounted with `campaignId = 'a'` and `status` is `'open'`
- **When** the consumer re-renders with `campaignId = 'b'`
- **Then** the previous `EventSource` is closed and a new one is created for `/api/campaigns/b/stream`, with `status` returning to `'connecting'`

---

### Requirement: ADDED Event dispatch

The system SHALL call the `onEvent` callback with a parsed `CampaignStreamEvent` when the server emits a named SSE event.

#### Scenario: heartbeat event dispatched

- **Given** `useCampaignStream` is connected (`status = 'open'`)
- **When** the mock `EventSource` fires an `addEventListener('heartbeat', ...)` handler with `data: '{"type":"heartbeat","campaignId":"c1","data":{"ts":1000}}'`
- **Then** `onEvent` is called once with `{ type: 'heartbeat', campaignId: 'c1', data: { ts: 1000 } }`

#### Scenario: change event dispatched

- **Given** `useCampaignStream` is connected (`status = 'open'`)
- **When** the mock `EventSource` fires an `addEventListener('change', ...)` handler with `data: '{"type":"change","campaignId":"c1","data":{"name":"updated"}}'`
- **Then** `onEvent` is called once with `{ type: 'change', campaignId: 'c1', data: { name: 'updated' } }`

#### Scenario: onmessage is not used

- **Given** the hook is mounted
- **When** the mock `EventSource` is inspected
- **Then** `es.onmessage` is not assigned (named `event:` field is always present; `onmessage` would silently drop all frames)

#### Scenario: Updated onEvent callback receives subsequent events

- **Given** `useCampaignStream` is connected with an initial `onEvent` callback
- **When** the consumer re-renders with a new `onEvent` reference (same `campaignId`)
- **Then** the next SSE event dispatches to the new callback, not the old one; no reconnect occurs

---

### Requirement: ADDED Reconnect behaviour

The system SHALL attempt to reconnect with exponential backoff when the `EventSource` encounters an HTTP-level failure.

#### Scenario: onerror with CLOSED state triggers reconnect after delay

- **Given** `useCampaignStream` is connected
- **When** the mock `EventSource` fires `onerror` and `readyState` is `EventSource.CLOSED`
- **Then** `status` becomes `'error'` and a new `EventSource` is created after a 1 000 ms delay

#### Scenario: Backoff doubles on repeated failures

- **Given** the first reconnect attempt also fails (`onerror` + `CLOSED`)
- **When** the second reconnect delay fires
- **Then** the delay before the third attempt is 2 000 ms; the delay before the fourth is 4 000 ms

#### Scenario: Backoff is capped at 30 seconds

- **Given** multiple consecutive reconnect failures have doubled the delay past 30 000 ms
- **When** the next reconnect is scheduled
- **Then** the delay is 30 000 ms (not a larger value)

#### Scenario: Backoff resets on successful reconnect

- **Given** a reconnect attempt succeeds (mock `EventSource` fires `onopen`)
- **When** a subsequent `onerror` + `CLOSED` occurs
- **Then** the next reconnect delay is 1 000 ms (reset to initial)

#### Scenario: onerror without CLOSED does not schedule reconnect

- **Given** `useCampaignStream` is connected
- **When** the mock `EventSource` fires `onerror` and `readyState` is `EventSource.CONNECTING` (transient drop; browser will retry)
- **Then** no new `EventSource` is created; `status` remains `'open'` or transitions as the browser manages the retry

---

### Requirement: ADDED Teardown

The system SHALL close the `EventSource` and cancel any pending reconnect timer when the hook unmounts.

#### Scenario: EventSource closed on unmount

- **Given** `useCampaignStream` is connected (`status = 'open'`)
- **When** the consumer unmounts
- **Then** `es.close()` is called exactly once

#### Scenario: Pending backoff timer cancelled on unmount

- **Given** `useCampaignStream` is in `'error'` state with a reconnect scheduled in 4 000 ms
- **When** the consumer unmounts before the timer fires
- **Then** no new `EventSource` is constructed and no state updates occur after unmount

#### Scenario: Early unmount before open

- **Given** `useCampaignStream` has mounted but `onopen` has not yet fired (`status = 'connecting'`)
- **When** the consumer unmounts
- **Then** `es.close()` is called; no error is thrown

---

## MODIFIED Requirements

None. This is a new capability with no existing requirements to modify.

---

## REMOVED Requirements

None.

---

## Traceability

- Proposal: "Open `EventSource` to `/api/campaigns/[id]/stream`" → Requirement: Connection lifecycle
- Proposal: "Typed event dispatch via `onEvent` callback" → Requirement: Event dispatch
- Proposal: "Auto-reconnect with exponential backoff" → Requirement: Reconnect behaviour
- Proposal: "Teardown on unmount" → Requirement: Teardown
- Design Decision 1 (native `EventSource`) → Connection lifecycle scenarios
- Design Decision 2 (`addEventListener` per type) → Event dispatch scenarios
- Design Decision 3 (ref for `onEvent`) → "Updated onEvent callback receives subsequent events"
- Design Decision 4 (explicit backoff) → Reconnect behaviour scenarios
- Design Decision 5 (`status` union) → Connection lifecycle + Reconnect scenarios
- Design Decision 6 (`campaignId` change recreates) → "campaignId change recreates the connection"
- All requirements → Task T1 (`lib/hooks/useCampaignStream.ts`) and T2 (tests)

---

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: No state update on unmounted component

- **Given** `useCampaignStream` is unmounted while a reconnect timer is pending
- **When** the timer fires (if it somehow escaped cancellation)
- **Then** no React "Can't perform a state update on an unmounted component" warning is emitted
  (enforced by the `torn` flag checked before all `setState` calls)

### Requirement: Security

See functional scenario: "Correct URL is used" — the hook constructs its URL from the `campaignId` argument. The server enforces auth via `assertCampaignAccess`; the hook does not need to validate access. No additional security NFAC scenario applies here.

### Requirement: Operability

#### Scenario: No SSR errors

- **Given** a Next.js app with server-side rendering enabled
- **When** a component importing `useCampaignStream` is rendered on the server
- **Then** no `window is not defined` or `EventSource is not defined` error is thrown (the `"use client"` directive ensures the hook only runs in browser context)
