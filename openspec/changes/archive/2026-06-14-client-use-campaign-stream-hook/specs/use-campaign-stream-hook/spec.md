## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED useCampaignStream hook

The system SHALL provide a React hook `useCampaignStream(campaignId, onEvent)` that wraps `EventSource`, manages connection lifecycle, and dispatches typed `CampaignStreamEvent` objects.

#### Scenario: Initial connection

- **Given** a component mounts and calls `useCampaignStream('c1', onEvent)`
- **When** the hook initialises
- **Then** an `EventSource` is constructed for `/api/campaigns/c1/stream` and `status` is `'connecting'`

#### Scenario: Successful open

- **Given** the hook has constructed an `EventSource`
- **When** the server accepts the connection and `onopen` fires
- **Then** `status` becomes `'open'`

#### Scenario: campaignId URL-encoding

- **Given** a campaignId containing special characters (e.g. `'campaign/with spaces'`)
- **When** the hook constructs the `EventSource`
- **Then** the URL uses `encodeURIComponent(campaignId)`, i.e. `/api/campaigns/campaign%2Fwith%20spaces/stream`

#### Scenario: campaignId change

- **Given** the hook is connected to campaign `'a'`
- **When** `campaignId` prop changes to `'b'`
- **Then** the previous `EventSource` is closed, a new one opens for campaign `'b'`, and `status` resets to `'connecting'`

### Requirement: ADDED typed event dispatch

The system SHALL parse SSE frames and invoke `onEvent` with a typed `CampaignStreamEvent` for `heartbeat` and `change` event types.

#### Scenario: heartbeat event received

- **Given** the connection is open
- **When** the server sends a `heartbeat` SSE frame with `data: {"type":"heartbeat","campaignId":"c1","data":{"ts":1000}}`
- **Then** `onEvent` is called once with `{ type: 'heartbeat', campaignId: 'c1', data: { ts: 1000 } }`

#### Scenario: change event received

- **Given** the connection is open
- **When** the server sends a `change` SSE frame
- **Then** `onEvent` is called with the parsed `CampaignStreamEvent` object

#### Scenario: malformed payload ignored

- **Given** the connection is open
- **When** the server sends an SSE frame with non-JSON data
- **Then** `onEvent` is not called and no error is thrown

#### Scenario: stale closure avoided

- **Given** the hook is open and the caller passes a new `onEvent` function without changing `campaignId`
- **When** a subsequent event arrives
- **Then** the updated `onEvent` is called, the old one is not, and no new `EventSource` is created

### Requirement: ADDED auto-reconnect with exponential backoff

The system SHALL automatically reconnect after HTTP-level failures, with backoff starting at 1 s, doubling per failure, capped at 30 s, and resetting to 1 s after a successful open.

#### Scenario: first reconnect after CLOSED error

- **Given** the connection closes with `readyState === CLOSED`
- **When** `onerror` fires
- **Then** `status` becomes `'error'` and a new `EventSource` is created after 1000 ms

#### Scenario: backoff doubles on second failure

- **Given** the first reconnect attempt also fails with `CLOSED`
- **When** `onerror` fires again
- **Then** the next reconnect is scheduled for 2000 ms

#### Scenario: backoff is capped at 30 s

- **Given** multiple failures have driven delay to 16 s
- **When** another failure occurs
- **Then** the next reconnect is scheduled for exactly 30 000 ms (not 32 000)

#### Scenario: backoff resets after success

- **Given** a reconnect attempt succeeds (`onopen` fires)
- **When** a subsequent failure occurs
- **Then** the next reconnect delay is 1000 ms (reset)

#### Scenario: browser-managed reconnect (CONNECTING state)

- **Given** the connection enters `readyState === CONNECTING` during `onerror` (transient drop, browser retrying)
- **When** `onerror` fires
- **Then** `status` becomes `'connecting'`, no explicit reconnect timer is scheduled, and no new `EventSource` is created

### Requirement: ADDED clean teardown

The system SHALL close the `EventSource` and cancel any pending reconnect timer when the hook unmounts or `campaignId` changes.

#### Scenario: unmount while open

- **Given** the hook is in `status === 'open'`
- **When** the component unmounts
- **Then** `EventSource.close()` is called

#### Scenario: unmount during pending reconnect

- **Given** a reconnect timer is pending after a CLOSED error
- **When** the component unmounts before the timer fires
- **Then** the timer is cancelled and no new `EventSource` is created

#### Scenario: unmount before onopen

- **Given** the hook has constructed an `EventSource` but `onopen` has not fired
- **When** the component unmounts
- **Then** `EventSource.close()` is called and no error is thrown

## MODIFIED Requirements

None — this is a new capability.

## REMOVED Requirements

None.

## Traceability

- Proposal element: Auto-reconnect/backoff → Requirement: ADDED auto-reconnect with exponential backoff
- Proposal element: Typed event dispatch → Requirement: ADDED typed event dispatch
- Proposal element: Connection state → `status` state in hook (covered by connection lifecycle scenarios)
- Proposal element: Clean teardown → Requirement: ADDED clean teardown
- Design Decision 1 (onEvent ref) → Scenario: stale closure avoided
- Design Decision 2 (globalThis.EventSource) → testability NFR
- Design Decision 3 (CLOSED vs CONNECTING branch) → Scenarios: first reconnect after CLOSED, browser-managed reconnect
- Design Decision 4 (URL encoding) → Scenario: campaignId URL-encoding
- Requirement: ADDED useCampaignStream hook → Tasks: T-1 (types), T-2 (hook), T-3 (tests)
- Requirement: ADDED typed event dispatch → Tasks: T-3 (T2 test suite)
- Requirement: ADDED auto-reconnect → Tasks: T-3 (T3 test suite)
- Requirement: ADDED clean teardown → Tasks: T-3 (T4 test suite)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

*See functional scenario: "Scenario: backoff is capped at 30 s" — reconnect storm prevention is fully specified there.*

### Requirement: Testability

- All hook behaviour is exercised without a real browser via `MockEventSource` substituted on `globalThis.EventSource`.
- See functional scenarios above for coverage of all branches (T1–T4).

### Requirement: Security

- The hook passes only `campaignId` (URL-encoded) in the `EventSource` URL; no credentials or tokens are embedded in the URL.
- Authentication is enforced server-side by the SSE endpoint (assertCampaignAccess — see issue #311); the hook is not responsible for access control.
