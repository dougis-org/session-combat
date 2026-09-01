## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

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

## MODIFIED Requirements

### Requirement: MODIFIED SessionControl State Management

The system SHALL manage the active session state of `SessionControl` internally via SSE instead of relying on props passed from a parent layout.

#### Scenario: Component initialization
- **Given** the `SessionControl` component is rendered with an `initialSessionId` prop
- **When** the component mounts
- **Then** it initializes its state from the prop and begins listening to `session` events on the `useCampaignStream` to keep its internal state updated.

## REMOVED Requirements

None.

## Traceability

- Proposal element -> Requirement: Refactoring `<SessionControl>` -> MODIFIED SessionControl State Management, ADDED Real-time Sync of Session Controls
- Design decision -> Requirement: Decision 1: Self-Synchronizing SessionControl -> MODIFIED SessionControl State Management
- Design decision -> Requirement: Decision 2: Display Logic in Session Journal -> ADDED Start Session Button in Session Journal
- Requirement -> Task(s): All requirements map to updating `SessionControl.tsx` and `SessionsPage.tsx` (in `tasks.md`).

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Performance

#### Scenario: SSE Event processing overhead

- **Given** a client viewing a page with multiple `<SessionControl>` instances
- **When** a `session` SSE event is received
- **Then** all instances update their local state without triggering a full page re-render or excessive React layout thrashing.

### Requirement: Security

> If access-control rejections are already fully specified by functional scenarios above, replace the scenario below with a cross-reference: "See functional scenarios: [scenario name(s)]". Only add a distinct scenario here if there is a security property not expressed by the functional requirements (e.g., audit log written, token not leaked in error body).

#### Scenario: Access control

See functional scenarios: The visibility rules for DMs vs players are unaffected; the component still relies on `useIsDM(campaignId)`.

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a temporarily dropped SSE connection
- **When** the browser automatically reconnects and receives the latest session state (or the user manually refreshes)
- **Then** the `<SessionControl>` buttons recover correct state.
