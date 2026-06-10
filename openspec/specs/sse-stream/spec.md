## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED GET /api/campaigns/[id]/stream endpoint

The system SHALL expose `GET /api/campaigns/[id]/stream` returning a `text/event-stream` response to authorized campaign members.

#### Scenario: Authorized member opens stream

- **Given** a user is an active member of campaign `C`
- **And** the user has a valid auth token
- **When** they `GET /api/campaigns/C/stream`
- **Then** the response has status `200`
- **And** `Content-Type: text/event-stream`
- **And** the connection remains open (streaming)

#### Scenario: Unauthorized request rejected before stream opens

- **Given** a request with no auth token (or an invalid token)
- **When** `GET /api/campaigns/[id]/stream` is called
- **Then** the response has status `401`
- **And** no SSE bytes are written

#### Scenario: Expired / invalidated session rejected

- **Given** a request with a JWT whose `tokenVersion` does not match the DB value
- **When** `GET /api/campaigns/[id]/stream` is called
- **Then** the response has status `401`

#### Scenario: Forbidden request rejected for non-member

- **Given** a user has a valid session but is not an active member of campaign `C`
- **When** they `GET /api/campaigns/C/stream`
- **Then** the response has status `404` (per `assertCampaignAccess` not-found behavior)
- **And** no SSE bytes are written

#### Scenario: Heartbeat emitted at interval

- **Given** an authorized member has an open SSE connection
- **When** approximately 25 seconds elapse with no other events
- **Then** a `heartbeat` SSE event is emitted
- **And** the event data matches `{ type: 'heartbeat', campaignId: C, data: { ts: <number> } }`

#### Scenario: Connection closes cleanly on client disconnect

- **Given** an authorized member has an open SSE connection
- **When** the client closes the connection (abort signal fires)
- **Then** the transport teardown function is called
- **And** the heartbeat interval is cleared
- **And** the subscriber is removed from the registry

#### Scenario: Reconnected client gets a fresh subscription

- **Given** a client previously disconnected from the stream
- **When** the same client reconnects with `GET /api/campaigns/[id]/stream`
- **Then** a new subscription is created and events flow normally

---

### Requirement: ADDED withStreamAndParams middleware

The system SHALL provide `withStreamAndParams<P>` in `lib/middleware.ts` — a streaming-compatible auth wrapper whose handler returns `Response` (not `NextResponse`).

#### Scenario: Auth logic identical to withAuthAndParams

- **Given** a request with a valid token
- **When** processed by `withStreamAndParams`
- **Then** the same `requireAuth` + `checkAuth` (tokenVersion DB check) is performed as in `withAuthAndParams`

#### Scenario: Handler receives typed params

- **Given** a route at `app/api/campaigns/[id]/stream/route.ts`
- **When** `withStreamAndParams<{ id: string }>` wraps the handler
- **Then** the handler receives `params.id` as a string

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal: SSE endpoint gated by assertCampaignAccess → Requirement: ADDED GET /api/campaigns/[id]/stream; Scenarios: authorized member opens stream, unauthorized/forbidden rejected
- Proposal: Heartbeat/keepalive → Scenario: heartbeat emitted at interval
- Proposal: Clean teardown on disconnect → Scenario: connection closes cleanly on client disconnect
- Proposal: withStreamAndParams shares checkAuth → Requirement: ADDED withStreamAndParams; Scenario: auth logic identical to withAuthAndParams
- Design D5 → Requirement: ADDED withStreamAndParams
- Design D1 + D2 → Scenario: connection closes cleanly (subscriber removed, stream closes if last)
- Requirement: ADDED GET /api/campaigns/[id]/stream → Task: implement app/api/campaigns/[id]/stream/route.ts
- Requirement: ADDED withStreamAndParams → Task: update lib/middleware.ts

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios above: "Unauthorized request rejected before stream opens", "Expired / invalidated session rejected", "Forbidden request rejected for non-member". No additional security scenarios are needed — these functional scenarios fully cover access control.

### Requirement: Reliability

#### Scenario: Fly.io request timeout does not leave dangling subscribers

- **Given** Fly.io terminates a long-lived SSE connection (e.g. 60s idle timeout)
- **When** the request abort signal fires
- **Then** the teardown path (same as client disconnect) runs
- **And** no subscriber entry remains in the registry after termination

### Requirement: Performance

#### Scenario: Stream response begins before first event

- **Given** an authorized member opens the stream
- **When** the connection is established
- **Then** the initial response headers are flushed immediately (no blocking wait for first event)
- **And** the first heartbeat arrives within 25s
