## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-11-add-active-session-controls/design.md) document, not a replacement.

### Requirement: ADDED DM can start an active session from the campaign layout header

The system SHALL render a "Start Session" control in `CampaignLayout`'s header, visible on every campaign tab, that an active DM member can use to call `POST /api/campaigns/[id]/sessions/active` and, on success, update `activeSessionId` for the whole layout (including `RollEntryStrip`) without a page reload.

#### Scenario: DM starts a session

- **Given** the current user is an active DM member of the campaign and `activeSessionId` is `null`
- **When** the DM clicks "Start Session" in the campaign layout header
- **Then** the client calls `POST /api/campaigns/[id]/sessions/active`, and on a 201 response the control switches to "End Session" state and `RollEntryStrip` becomes enabled, without a page reload

#### Scenario: Start Session request fails unexpectedly

- **Given** the current user is an active DM member and `activeSessionId` is `null`
- **When** the DM clicks "Start Session" and the request returns a non-2xx, non-409 status (e.g. 500)
- **Then** the control remains in "Start Session" state and an inline error message is shown near the control

### Requirement: ADDED DM can end an active session from the campaign layout header

The system SHALL render an "End Session" control in `CampaignLayout`'s header, visible on every campaign tab, that an active DM member can use to call `DELETE /api/campaigns/[id]/sessions/active` and, on success, clear `activeSessionId` for the whole layout without a page reload.

#### Scenario: DM ends a session

- **Given** the current user is an active DM member of the campaign and `activeSessionId` is a non-null session id
- **When** the DM clicks "End Session" in the campaign layout header
- **Then** the client calls `DELETE /api/campaigns/[id]/sessions/active`, and on a 200 response the control switches to "Start Session" state and `RollEntryStrip` becomes disabled, without a page reload

#### Scenario: End Session request fails unexpectedly

- **Given** the current user is an active DM member and `activeSessionId` is a non-null session id
- **When** the DM clicks "End Session" and the request returns a non-2xx, non-404 status (e.g. 500)
- **Then** the control remains in "End Session" state and an inline error message is shown near the control

### Requirement: ADDED Non-DM members do not see the session control

The system SHALL NOT render the Start/End Session control for a campaign member whose role is not an active DM, matching the existing server-side DM-only gate on `sessions/active`.

#### Scenario: Non-DM member does not see the control

- **Given** the current user is a campaign member with role `player` (or an inactive/removed `dm` membership)
- **When** the campaign layout renders any tab
- **Then** no Start/End Session control is rendered anywhere in the header

### Requirement: ADDED Session control state stays reactive across tabs, devices, and server instances

The system SHALL keep the Start/End Session control's displayed state synchronized with `activeSessionId` as delivered by the existing `session` server-sent event, without introducing polling.

#### Scenario: Control updates reactively on session SSE event

- **Given** the DM has the campaign layout open in this browser tab with `activeSessionId` set to `null`
- **When** a `session` stream event arrives (e.g. because the DM started the session from another tab, another device, or another server instance) carrying a non-null `activeSessionId`
- **Then** the control updates from "Start Session" to "End Session" state using the existing `onSessionChange` callback path, with no additional fetch or polling request issued by the control itself

#### Scenario: Control state matches RollEntryStrip state

- **Given any sequence of Start Session, End Session, or incoming session SSE events**
- **When** the resulting `activeSessionId` value is observed at any point in time
- **Then** the Start/End Session control's displayed state and `RollEntryStrip`'s enabled/disabled state are always derived from that same `activeSessionId` value and never disagree

### Requirement: ADDED Concurrent session start/end races are reconciled without a user-facing error

The system SHALL treat a 409 response from `POST .../sessions/active` and a 404 response from `DELETE .../sessions/active` as benign reconciliation signals (another DM tab/device already changed the state), and SHALL update the control to reflect the true state instead of showing an error.

#### Scenario: Race with another DM tab is reconciled silently

- **Given** the DM clicks "Start Session" in this tab at the same moment another of their tabs already started a session
- **When** the `POST` request returns 409 ("A session is already active")
- **Then** the client re-fetches the campaign's current `activeSessionId` and updates the control to "End Session" state, with no error message shown to the DM

#### Scenario: End Session race is reconciled silently

- **Given** the DM clicks "End Session" in this tab at the same moment another of their tabs already ended the session
- **When** the `DELETE` request returns 404 ("No active session")
- **Then** the client updates the control to "Start Session" state (`activeSessionId` set to `null`), with no error message shown to the DM

### Requirement: ADDED DM can recover from a stale/stuck active session

The system SHALL provide a distinct, clearly-labeled "force reset" action, visible only while a session is showing as active, that calls `DELETE .../sessions/active?force=true` to clear a stuck `activeSessionId` (e.g. after the DM's browser or process crashed mid-session) without requiring the normal End Session precondition.

#### Scenario: DM force-resets a stale session

- **Given** `activeSessionId` is non-null (a session appears active) and the DM believes no session is actually in progress
- **When** the DM clicks the force reset action
- **Then** the client calls `DELETE /api/campaigns/[id]/sessions/active?force=true`, and on success the control switches to "Start Session" state

## Traceability

- Proposal element: DM-only Start/End Session control in `CampaignLayout` header, visible on every tab -> Requirement: ADDED DM can start an active session from the campaign layout header; ADDED DM can end an active session from the campaign layout header
- Proposal element: Handling 409/404/stale-session responses with reconciliation -> Requirement: ADDED Concurrent session start/end races are reconciled without a user-facing error; ADDED DM can recover from a stale/stuck active session
- Proposal element: Reuse existing `activeSessionId` state / `session` SSE event, no polling -> Requirement: ADDED Session control state stays reactive across tabs, devices, and server instances
- Proposal element: DM-only gating -> Requirement: ADDED Non-DM members do not see the session control
- Design decision: Decision 1 (control location) -> Requirement: ADDED DM can start an active session from the campaign layout header; ADDED DM can end an active session from the campaign layout header
- Design decision: Decision 2 (`useIsDM`) -> Requirement: ADDED Non-DM members do not see the session control
- Design decision: Decision 3 (single source of truth) -> Requirement: ADDED Session control state stays reactive across tabs, devices, and server instances
- Design decision: Decision 4 (reconciliation + force reset) -> Requirement: ADDED Concurrent session start/end races are reconciled without a user-facing error; ADDED DM can recover from a stale/stuck active session
- Requirement -> Task(s): see `tasks.md` (task IDs T1-T7)

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the DM clicks "Start Session" or "End Session" under normal network conditions
- **When** the request completes successfully
- **Then** the control's visible state updates within the round-trip time of a single API call (no artificial delay, debounce, or additional polling round-trip is introduced by the control itself)

### Requirement: Security

See functional scenarios: "Non-DM member does not see the control", "DM starts a session", "DM ends a session". These already cover client-side DM gating layered on top of the pre-existing, unchanged server-side 404 gate in `app/api/campaigns/[id]/sessions/active/route.ts`. No additional distinct security scenario is introduced by this change.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** `activeSessionId` is stuck non-null due to a crashed DM session and normal `DELETE` (without `force`) would otherwise be blocked by the route's precondition semantics for a stale state
- **When** the DM uses the force reset action described in "DM can recover from a stale/stuck active session"
- **Then** the system recovers to a clean `activeSessionId: null` state without requiring server-side manual intervention (e.g. a direct database edit)

---

## ADDED Requirements (surface-start-session-button — 2026-08-31)

This section is additive to the [`design.md`](../../changes/archive/2026-08-31-surface-start-session-button/design.md) document.

### Requirement: ADDED Start Session Button in Session Journal

The system SHALL display a "Start Session" button on the Session Journal page when there is no currently active session.

#### Scenario: No active session

- **Given** a DM viewing the Session Journal page
- **When** the campaign has no active session (`activeSessionId` is null)
- **Then** the "Start Session" button is visible at the top of the main content area.

#### Scenario: Session is active

- **Given** a DM viewing the Session Journal page
- **When** the campaign has an active session
- **Then** the "Start Session" button is hidden from the main content area (relying on the global nav).

### Requirement: ADDED Real-time Sync of Session Controls

The system SHALL synchronize the state of all `SessionControl` instances on the page automatically via SSE.

#### Scenario: Starting a session updates all buttons

- **Given** a DM viewing the Session Journal page with no active session (seeing two "Start Session" buttons: one in global nav, one in main content)
- **When** the DM clicks "Start Session" on one of the buttons
- **Then** both buttons update to their "End Session" state immediately (once the backend confirms the start and emits the SSE event).

## MODIFIED Requirements (surface-start-session-button — 2026-08-31)

### Requirement: MODIFIED SessionControl State Management

The system SHALL manage the active session state of `SessionControl` internally via SSE instead of relying on props passed from a parent layout.

#### Scenario: Component initialization

- **Given** the `SessionControl` component is rendered with an `initialSessionId` prop
- **When** the component mounts
- **Then** it initializes its state from the prop and begins listening to `session` events on the `useCampaignStream` to keep its internal state updated.

## Non-Functional Acceptance Criteria (surface-start-session-button — 2026-08-31)

### Requirement: Performance

#### Scenario: SSE Event processing overhead

- **Given** a client viewing a page with multiple `<SessionControl>` instances
- **When** a `session` SSE event is received
- **Then** all instances update their local state without triggering a full page re-render or excessive React layout thrashing.

### Requirement: Security

> See functional scenarios: The visibility rules for DMs vs players are unaffected; the component still relies on `useIsDM(campaignId)`.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a temporarily dropped SSE connection
- **When** the browser automatically reconnects and receives the latest session state (or the user manually refreshes)
- **Then** the `<SessionControl>` buttons recover correct state.
