This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## ADDED Requirements

### Requirement: ADDED Shared active-session-tracking logic is the sole source of active-session state for both `SessionControl` and `CampaignChat`

The system SHALL provide one shared implementation, `lib/hooks/useActiveSessionId.ts`, of fetching a campaign's current `activeSessionId`, reconciling `session`-typed `CampaignStreamEvent`s into it, and exposing a setter for optimistic local updates — exported as a non-subscribing `useActiveSessionIdCore(campaignId)` (fetch + state + setter + a `handleStreamEvent` function for a caller-supplied stream) and a self-subscribing `useActiveSessionId(campaignId)` wrapper that opens its own `useCampaignStream` subscription and feeds it into the core. `SessionControl` SHALL use the self-subscribing wrapper (it has no other reason to hold a stream subscription); `CampaignChat` SHALL use the non-subscribing core, feeding it `session`-typed events from the single `useCampaignStream` subscription `CampaignChat`'s message/roll feed already requires — `CampaignChat` SHALL NOT open a second subscription for session state. In both cases, no active-session data is passed as a prop between the two components or through `CampaignLayout`.

#### Scenario: An already-active session is visible without a prior stream event

- **Given** a campaign's `activeSessionId` is already set to "session-123" before any client subscribes
- **When** `SessionControl` mounts and calls `useActiveSessionId(campaignId)`, or `CampaignChat` mounts and calls `useActiveSessionIdCore(campaignId)`
- **Then** the resolved `activeSessionId` is "session-123" from the initial fetch, without requiring a `session` stream event to arrive first

#### Scenario: A stream event updates both components independently and consistently

- **Given** `SessionControl` (via the self-subscribing wrapper) and `CampaignChat` (via the core, fed by its own existing subscription) are both mounted for the same campaign, and `activeSessionId` is currently `null` in both
- **When** a `session` stream event arrives with `data.activeSessionId = "session-456"` on each component's respective subscription
- **Then** both `SessionControl`'s and `CampaignChat`'s `activeSessionId` update to "session-456" independently, without either component reading the other's state, sharing a subscription, or `CampaignLayout` mediating the update

#### Scenario: An optimistic update is not reverted by a stale in-flight fetch

- **Given** `useActiveSessionIdCore(campaignId)` (or the wrapper) has an initial fetch in flight for a campaign whose `activeSessionId` was `null` when the fetch started
- **When** `setActiveSessionId("session-789")` is called (e.g. by `SessionControl` after a successful session-start POST) before the in-flight fetch resolves, and the fetch subsequently resolves with the stale value `null`
- **Then** `activeSessionId` remains "session-789"; the stale fetch result is discarded

#### Scenario: A duplicate confirming stream event does not revert an optimistic update

- **Given** `setActiveSessionId("session-789")` was just called optimistically
- **When** `handleStreamEvent` is subsequently called with a `session` event confirming `data.activeSessionId = "session-789"` (the same value)
- **Then** `activeSessionId` remains "session-789" with no flicker or error

#### Scenario: Hook state resets when campaignId changes

- **Given** `useActiveSessionIdCore("campaign-a")` (or the wrapper) has resolved `activeSessionId` to "session-a1"
- **When** the consuming component re-renders with a different `campaignId`, "campaign-b"
- **Then** `activeSessionId` resets to `undefined` (not yet loaded) and a fresh fetch begins for "campaign-b", with no leakage of "session-a1"

## MODIFIED Requirements

### Requirement: MODIFIED SessionControl State Management

The system SHALL manage `SessionControl`'s active-session state entirely via the shared, self-subscribing `useActiveSessionId(campaignId)` wrapper (see "ADDED Shared active-session-tracking logic" above). `SessionControl` SHALL NOT accept an `initialSessionId` (or any other active-session) prop; it SHALL accept only `campaignId`, and SHALL render nothing until `useActiveSessionId` has resolved an initial value (i.e., while `activeSessionId` is `undefined`).

#### Scenario: Component initialization with no props beyond campaignId

- **Given** `SessionControl` is rendered with only `{ campaignId }`
- **When** the component mounts
- **Then** it calls `useActiveSessionId(campaignId)` internally and renders nothing until it resolves an initial `activeSessionId` value, then renders "Start Session" or "End Session" per that value

#### Scenario: Start/end/force-end actions use the hook's setter

- **Given** `SessionControl` has resolved `activeSessionId` via `useActiveSessionId`
- **When** the DM successfully starts, ends, or force-ends a session (existing `handleStart`/`handleEnd`/`handleForceEnd` behavior, unchanged)
- **Then** the component calls `useActiveSessionId`'s `setActiveSessionId` with the resulting value, exactly as it previously called its own local `setState`

## Traceability

- Proposal element: "Shared, reusable mechanism (hook) for tracking a campaign's activeSessionId" → Requirement: ADDED Shared active-session-tracking logic
- Proposal element: "Refactoring SessionControl to use this shared mechanism instead of its own hand-rolled fetch/subscribe/state" → Requirement: MODIFIED SessionControl State Management
- Design Decision 1 (core/wrapper split, race handling — revised during design review to avoid a redundant `CampaignChat` subscription) → Scenarios: "An already-active session is visible...", "An optimistic update is not reverted...", "A duplicate confirming stream event..."
- Design Decision 2 (no Context/provider) → Scenario: "A stream event updates both components independently and consistently"
- Design Decision 3 (`CampaignChat` uses the core, fed by its existing subscription) → Scenario: "A stream event updates both components independently and consistently"; NFAC "No new SSE connections or polling introduced"
- Design Decision 4 (SessionControl drops `initialSessionId`, uses the self-subscribing wrapper) → Requirement: MODIFIED SessionControl State Management
- Requirements → Task(s): see `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: No new SSE connections or polling introduced

- **Given** a campaign page with one `SessionControl` and one `CampaignChat` mounted, as today (two `useCampaignStream` subscriptions total: one owned by `SessionControl` via the wrapper, one owned by `CampaignChat`/`useChatFeed` for message/roll events, now also feeding session state into the core)
- **When** the shared active-session-tracking logic is adopted by both
- **Then** the total number of SSE subscriptions remains exactly two and the absence of polling is unchanged from before this change — `CampaignChat` does NOT gain a second subscription by using `useActiveSessionIdCore` (this is the specific property this scenario exists to pin down; an implementation that has `CampaignChat` call the self-subscribing `useActiveSessionId` wrapper instead of the core would fail this scenario by introducing a third subscription)

### Requirement: Security

See functional scenarios in this document and in `session-controls/spec.md`'s existing "Non-DM members do not see the session control" requirement (unchanged by this capability delta) — no new access-control surface is introduced by centralizing state into a hook.

### Requirement: Reliability

See functional scenario: "Hook state resets when campaignId changes" — this is the reliability property most relevant to this change (no stale cross-campaign state leakage).
