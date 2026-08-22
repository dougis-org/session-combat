## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Typed, scoped presence channel from CampaignChat to the global dice fab

The system SHALL provide a `lib/dice/diceSessionBridge.ts` module exposing `announcePresence({campaignId, sessionId})`, `clearPresence()`, and `onPresenceChange(callback)`, where the callback receives either `{campaignId, sessionId}` or `null`.

#### Scenario: Announcing presence notifies current subscribers

- **Given** a subscriber has registered via `onPresenceChange`
- **When** `announcePresence({campaignId: "c1", sessionId: "s1"})` is called
- **Then** the subscriber's callback is invoked with `{campaignId: "c1", sessionId: "s1"}`

#### Scenario: Clearing presence notifies current subscribers with null

- **Given** presence is currently `{campaignId: "c1", sessionId: "s1"}` and a subscriber is registered
- **When** `clearPresence()` is called
- **Then** the subscriber's callback is invoked with `null`

#### Scenario: A newly-registered subscriber immediately receives the current presence value

- **Given** presence is currently `{campaignId: "c1", sessionId: "s1"}`
- **When** a new subscriber registers via `onPresenceChange`
- **Then** it is immediately invoked once with `{campaignId: "c1", sessionId: "s1"}` (not left waiting for the next change)

#### Scenario: Unsubscribing stops further notifications

- **Given** a subscriber registered via `onPresenceChange` and later called the returned unsubscribe function
- **When** `announcePresence` or `clearPresence` is called afterward
- **Then** that subscriber's callback is not invoked again

---

### Requirement: ADDED Typed, scoped roll-request channel from the global dice fab to CampaignChat

The system SHALL provide `requestRoll({campaignId, sessionId, roll})` and `onRollRequested(callback)` on the same module, where `roll` matches the existing `{formula, rolls, total, visibility}` shape already accepted by `POST /api/campaigns/[id]/rolls`.

#### Scenario: Requesting a roll notifies current subscribers with the full scoped payload

- **Given** a subscriber has registered via `onRollRequested`
- **When** `requestRoll({campaignId: "c1", sessionId: "s1", roll: {formula: "1d20", rolls: [14], total: 14, visibility: {scope: "group"}}})` is called
- **Then** the subscriber's callback is invoked with that exact payload

#### Scenario: A roll request with no subscribers is a silent no-op

- **Given** no subscriber is currently registered via `onRollRequested`
- **When** `requestRoll(...)` is called
- **Then** the call completes without throwing and has no observable side effect

---

### Requirement: ADDED CampaignChat only acts on a roll request matching its own current campaign and session

The system SHALL cause `CampaignChat`'s roll-request subscriber to ignore any received payload whose `campaignId` or `sessionId` does not exactly match its own currently-mounted `campaignId` prop and current `activeSessionId` state at the moment the event is received.

#### Scenario: Matching payload is submitted through the existing roll-persistence path

- **Given** `CampaignChat` is mounted with `campaignId="c1"` and `activeSessionId="s1"`
- **When** a roll request arrives with `{campaignId: "c1", sessionId: "s1", roll: {...}}`
- **Then** `CampaignChat` performs the same POST to `/api/campaigns/c1/rolls` it performs for its own in-chat trigger, and on success appends the result to the feed and scrolls, using its existing dedupe/scroll logic unchanged

#### Scenario: Payload for a different campaign is ignored

- **Given** `CampaignChat` is mounted with `campaignId="c1"` and `activeSessionId="s1"`
- **When** a roll request arrives with `{campaignId: "c2", sessionId: "s1", roll: {...}}`
- **Then** no POST is made and the feed is not mutated

#### Scenario: Payload for a stale/mismatched session is ignored

- **Given** `CampaignChat` is mounted with `campaignId="c1"`, and `activeSessionId` has since changed from `"s1"` to `"s2"` (e.g. the session ended and a new one started)
- **When** a roll request arrives with `{campaignId: "c1", sessionId: "s1", roll: {...}}` (the stale session id)
- **Then** no POST is made and the feed is not mutated

---

### Requirement: ADDED CampaignChat announces and clears presence in lockstep with its own active-session lifecycle

The system SHALL cause `CampaignChat` to call `announcePresence({campaignId, sessionId: activeSessionId})` whenever it has a non-null `activeSessionId`, and to call `clearPresence()` when it unmounts or when `activeSessionId` transitions to null.

#### Scenario: Mounting with an active session announces presence

- **Given** `CampaignChat` mounts with `campaignId="c1"` and `activeSessionId="s1"`
- **When** the component finishes its initial render effects
- **Then** `announcePresence({campaignId: "c1", sessionId: "s1"})` has been called

#### Scenario: Session ending clears presence

- **Given** `CampaignChat` is mounted with presence announced for `{campaignId: "c1", sessionId: "s1"}`
- **When** `activeSessionId` transitions to `null` (session ends)
- **Then** `clearPresence()` is called

#### Scenario: Unmounting clears presence

- **Given** `CampaignChat` is mounted with presence announced for `{campaignId: "c1", sessionId: "s1"}`
- **When** the component unmounts (e.g. user navigates away from the campaign page)
- **Then** `clearPresence()` is called

#### Scenario: Mounting with no active session never announces presence

- **Given** `CampaignChat` mounts with `activeSessionId={null}`
- **When** the component finishes its initial render effects
- **Then** `announcePresence` is never called

---

## Traceability

- Proposal element "Presence channel: CampaignChat → GlobalDiceFab" → Requirements: ADDED Typed, scoped presence channel from CampaignChat to the global dice fab; ADDED CampaignChat announces and clears presence in lockstep with its own active-session lifecycle
- Proposal element "Roll-request channel: GlobalDiceFab → CampaignChat" → Requirements: ADDED Typed, scoped roll-request channel from the global dice fab to CampaignChat
- Proposal element "Roll requested for non-matching campaign/session is ignored" → Requirements: ADDED CampaignChat only acts on a roll request matching its own current campaign and session
- Design decision 2 (bridge module shape) → Requirements: both ADDED channel requirements
- Design decision 3 (scoping/id-match) → Requirements: ADDED CampaignChat only acts on a roll request matching its own current campaign and session; ADDED CampaignChat announces and clears presence in lockstep with its own active-session lifecycle
- Requirement → Task(s): see `openspec/changes/decouple-dice-panel-from-chat/tasks.md`, "diceSessionBridge" task group

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Bridge notification is synchronous and O(subscribers)

- **Given** N subscribers are registered on a given channel
- **When** `announcePresence`, `clearPresence`, or `requestRoll` is called
- **Then** exactly those N subscribers are invoked synchronously, with no network I/O or artificial delay introduced by the bridge itself

### Requirement: Security

See functional scenario: "Payload for a different campaign is ignored" and "Payload for a stale/mismatched session is ignored". The bridge carries no authority of its own — see `roll-share-ui` capability's unchanged reliance on `app/api/campaigns/[id]/rolls` for the actual authorization/validation boundary. This module must never be extended to bypass or duplicate that route's checks.

### Requirement: Reliability

#### Scenario: Bridge state does not leak between test cases

- **Given** a test-only `resetDiceSessionBridge()` export is called in test teardown
- **When** the next test registers subscribers and calls `announcePresence`/`requestRoll`
- **Then** no listener or presence value from a prior test is observed
