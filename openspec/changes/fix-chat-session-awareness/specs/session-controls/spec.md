This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## ADDED Requirements

### Requirement: ADDED Shared `useActiveSessionId` hook is the sole source of active-session state for both `SessionControl` and `CampaignChat`

The system SHALL provide a single hook, `useActiveSessionId(campaignId)`, that fetches a campaign's current `activeSessionId`, subscribes to `session`-typed `CampaignStreamEvent`s to keep it current, and exposes a setter for optimistic local updates. Both `SessionControl` and `CampaignChat` SHALL call this hook independently to obtain their active-session state, with no active-session data passed as a prop between them or through `CampaignLayout`.

#### Scenario: An already-active session is visible without a prior stream event

- **Given** a campaign's `activeSessionId` is already set to "session-123" before any client subscribes
- **When** `SessionControl` (or `CampaignChat`, independently) mounts and calls `useActiveSessionId(campaignId)`
- **Then** the hook resolves `activeSessionId` to "session-123" from its initial fetch, without requiring a `session` stream event to arrive first

#### Scenario: A stream event updates both components independently and consistently

- **Given** `SessionControl` and `CampaignChat` are both mounted for the same campaign, each with its own `useActiveSessionId(campaignId)` call, and `activeSessionId` is currently `null` in both
- **When** a `session` stream event arrives with `data.activeSessionId = "session-456"`
- **Then** both `SessionControl`'s and `CampaignChat`'s `activeSessionId` update to "session-456" independently, without either component reading the other's state or `CampaignLayout` mediating the update

#### Scenario: An optimistic update is not reverted by a stale in-flight fetch

- **Given** `useActiveSessionId(campaignId)` has an initial fetch in flight for a campaign whose `activeSessionId` was `null` when the fetch started
- **When** the hook's `setActiveSessionId("session-789")` is called (e.g. by `SessionControl` after a successful session-start POST) before the in-flight fetch resolves, and the fetch subsequently resolves with the stale value `null`
- **Then** the hook's `activeSessionId` remains "session-789"; the stale fetch result is discarded

#### Scenario: A duplicate confirming stream event does not revert an optimistic update

- **Given** `useActiveSessionId` just had `setActiveSessionId("session-789")` called optimistically
- **When** a `session` stream event subsequently arrives confirming `data.activeSessionId = "session-789"` (the same value)
- **Then** `activeSessionId` remains "session-789" with no flicker or error

#### Scenario: Hook state resets when campaignId changes

- **Given** `useActiveSessionId("campaign-a")` has resolved `activeSessionId` to "session-a1"
- **When** the consuming component re-renders with a different `campaignId`, "campaign-b"
- **Then** the hook's `activeSessionId` resets to `undefined` (not yet loaded) and a fresh fetch/subscription begins for "campaign-b", with no leakage of "session-a1"

## MODIFIED Requirements

### Requirement: MODIFIED SessionControl State Management

The system SHALL manage `SessionControl`'s active-session state entirely via the shared `useActiveSessionId(campaignId)` hook (see "ADDED Shared `useActiveSessionId` hook" above). `SessionControl` SHALL NOT accept an `initialSessionId` (or any other active-session) prop; it SHALL accept only `campaignId`, and SHALL render nothing until `useActiveSessionId` has resolved an initial value (i.e., while `activeSessionId` is `undefined`).

#### Scenario: Component initialization with no props beyond campaignId

- **Given** `SessionControl` is rendered with only `{ campaignId }`
- **When** the component mounts
- **Then** it calls `useActiveSessionId(campaignId)` internally and renders nothing until the hook resolves an initial `activeSessionId` value, then renders "Start Session" or "End Session" per that value

#### Scenario: Start/end/force-end actions use the hook's setter

- **Given** `SessionControl` has resolved `activeSessionId` via the hook
- **When** the DM successfully starts, ends, or force-ends a session (existing `handleStart`/`handleEnd`/`handleForceEnd` behavior, unchanged)
- **Then** the component calls the hook's `setActiveSessionId` with the resulting value, exactly as it previously called its own local `setState`

## Traceability

- Proposal element: "Shared, reusable mechanism (hook) for tracking a campaign's activeSessionId" → Requirement: ADDED Shared `useActiveSessionId` hook
- Proposal element: "Refactoring SessionControl to use this shared mechanism instead of its own hand-rolled fetch/subscribe/state" → Requirement: MODIFIED SessionControl State Management
- Design Decision 1 (hook shape, race handling) → Scenarios: "An already-active session is visible...", "An optimistic update is not reverted...", "A duplicate confirming stream event..."
- Design Decision 2 (no Context/provider) → Scenario: "A stream event updates both components independently and consistently"
- Design Decision 4 (SessionControl drops `initialSessionId`) → Requirement: MODIFIED SessionControl State Management
- Requirements → Task(s): see `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No new SSE connections or polling introduced

- **Given** a campaign page with one `SessionControl` and one `CampaignChat` mounted, as today
- **When** `useActiveSessionId` is adopted by both
- **Then** the total number of SSE subscriptions and the absence of polling is unchanged from before this change (each hook instance reuses the existing `useCampaignStream` primitive; no new fixed-interval polling is introduced)

### Requirement: Security

See functional scenarios in this document and in `session-controls/spec.md`'s existing "Non-DM members do not see the session control" requirement (unchanged by this capability delta) — no new access-control surface is introduced by centralizing state into a hook.

### Requirement: Reliability

See functional scenario: "Hook state resets when campaignId changes" — this is the reliability property most relevant to this change (no stale cross-campaign state leakage).
