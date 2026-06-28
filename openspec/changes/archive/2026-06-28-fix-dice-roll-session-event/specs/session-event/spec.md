## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED `session` event type in `CampaignStreamEvent`

The system SHALL include a `session` discriminant in `CampaignStreamEvent` with shape `{ type: "session"; campaignId: string; data: { activeSessionId: string | null } }`.

#### Scenario: Session event shape is valid when session starts

- **Given** a DM starts a campaign session via `POST /api/campaigns/[id]/sessions/active`
- **When** the API emits a `session` stream event
- **Then** the event has `type === "session"`, `campaignId` equal to the campaign's ID, and `data.activeSessionId` equal to the newly created session's UUID

#### Scenario: Session event shape is valid when session ends

- **Given** a DM ends a campaign session via `DELETE /api/campaigns/[id]/sessions/active`
- **When** the API emits a `session` stream event
- **Then** the event has `type === "session"`, `campaignId` equal to the campaign's ID, and `data.activeSessionId === null`

---

### Requirement: ADDED `session` event emitted on session start

The system SHALL emit a `session` event to all connected subscribers after successfully starting a campaign session.

#### Scenario: `session` event reaches all active subscribers on start

- **Given** two clients (DM + player) are subscribed to the campaign SSE stream
- **When** the DM calls `POST /api/campaigns/[id]/sessions/active` and it returns 201
- **Then** both clients receive a `session` event with `data.activeSessionId` set to the new session ID

#### Scenario: No `session` event emitted when session start fails

- **Given** a session is already active for the campaign
- **When** the DM calls `POST /api/campaigns/[id]/sessions/active`
- **Then** the API returns 409 and no `session` stream event is emitted

---

### Requirement: ADDED `session` event emitted on session end

The system SHALL emit a `session` event to all connected subscribers after successfully ending a campaign session.

#### Scenario: `session` event reaches all active subscribers on end

- **Given** a session is active and clients are subscribed to the campaign SSE stream
- **When** the DM calls `DELETE /api/campaigns/[id]/sessions/active` and it returns 200
- **Then** all connected clients receive a `session` event with `data.activeSessionId === null`

---

### Requirement: ADDED `CampaignChat` forwards `session` events via `onSessionChange` callback

The system SHALL call `onSessionChange(activeSessionId)` when a `session` stream event is received, if the prop is provided.

#### Scenario: `onSessionChange` called with new session ID on start event

- **Given** `CampaignChat` is rendered with an `onSessionChange` callback
- **When** the SSE stream delivers a `session` event with `data.activeSessionId = "abc"`
- **Then** `onSessionChange` is called once with `"abc"`

#### Scenario: `onSessionChange` called with null on end event

- **Given** `CampaignChat` is rendered with an `onSessionChange` callback
- **When** the SSE stream delivers a `session` event with `data.activeSessionId = null`
- **Then** `onSessionChange` is called once with `null`

#### Scenario: No error when `onSessionChange` is not provided

- **Given** `CampaignChat` is rendered without an `onSessionChange` prop
- **When** the SSE stream delivers a `session` event
- **Then** no error is thrown and no other behavior changes

---

### Requirement: ADDED layout updates `activeSessionId` reactively from `session` events

The system SHALL update the layout's `activeSessionId` state when a `session` event is received, enabling or disabling the roll strip without a page reload.

#### Scenario: Roll strip enables when session starts after page load

- **Given** a user has loaded the campaign page with no active session (`activeSessionId = null`) and the roll strip is disabled
- **When** the DM starts a session and the `session` event arrives via SSE
- **Then** the layout's `activeSessionId` state updates to the new session ID and the roll strip becomes enabled

#### Scenario: Roll strip disables when session ends

- **Given** a user has the campaign page loaded with an active session and the roll strip is enabled
- **When** the DM ends the session and the `session` event arrives via SSE
- **Then** the layout's `activeSessionId` state updates to `null` and the roll strip becomes disabled

#### Scenario: Roll strip renders correctly when session is already active on initial load

- **Given** a campaign already has an active session when the page is loaded
- **When** the layout's one-shot fetch returns `activeSessionId` from the campaign document
- **Then** the roll strip is enabled immediately without waiting for a `session` event

## MODIFIED Requirements

### Requirement: MODIFIED `CampaignChat` component props

The component SHALL accept an optional `onSessionChange?: (activeSessionId: string | null) => void` prop in addition to its existing props.

#### Scenario: Existing props unchanged

- **Given** `CampaignChat` is rendered with only `campaignId` and `activeSessionId` (no `onSessionChange`)
- **When** the component renders and the stream operates normally
- **Then** all existing message, roll, and heartbeat behavior is unaffected

## REMOVED Requirements

None.

## Traceability

- Proposal element "Add `session` event to `CampaignStreamEvent`" → Requirement: ADDED `session` event type
- Proposal element "Emit from sessions/active POST" → Requirement: ADDED `session` event emitted on session start
- Proposal element "Emit from sessions/active DELETE" → Requirement: ADDED `session` event emitted on session end
- Proposal element "Handle in layout.tsx via callback" → Requirements: ADDED `onSessionChange` callback + ADDED layout updates reactively
- Design Decision 1 → Requirement: ADDED `session` event type
- Design Decision 2 → Requirements: ADDED session start + end emission
- Design Decision 3 → Requirements: ADDED `onSessionChange` callback + layout reactive update
- Requirement "session event type" → Task: Update `lib/types.ts`
- Requirement "emit on start/end" → Task: Update `app/api/campaigns/[id]/sessions/active/route.ts`
- Requirement "onSessionChange callback" → Task: Update `lib/components/CampaignChat.tsx`
- Requirement "layout reactive update" → Task: Update `app/campaigns/[id]/layout.tsx`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No additional SSE connections from layout

- **Given** the campaign layout mounts and `CampaignChat` is rendered
- **When** the SSE stream is established
- **Then** only one SSE connection is opened per campaign page (no second `subscribe` call from the layout)

### Requirement: Security

See functional scenarios: "No `session` event emitted when session start fails" — the API already enforces DM-only access for POST/DELETE on sessions/active; no additional access-control scenarios required for the event emission.

### Requirement: Reliability

#### Scenario: Existing event types are unaffected

- **Given** clients are subscribed to the campaign SSE stream
- **When** `message` and `roll` events are emitted
- **Then** existing handling continues to work correctly; the new `session` branch in handlers does not interfere
