## Purpose

Provide a typed, session-scoped in-memory presence channel (`lib/dice/diceSessionBridge.ts`) that lets `CampaignChat` announce an active `{campaignId, sessionId}` and the global dice fab observe it, so a roll can be sent to session chat without the fab depending on any mounted chat component.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-08-22-decouple-dice-panel-from-chat/design.md) document, not a replacement.

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
- Design decision 2 (bridge module shape) → Requirements: ADDED Typed, scoped presence channel from CampaignChat to the global dice fab
- Design decision 3 (scoping/id-match) → Requirements: ADDED CampaignChat announces and clears presence in lockstep with its own active-session lifecycle
- Requirement → Task(s): see `openspec/changes/archive/2026-08-22-decouple-dice-panel-from-chat/tasks.md`, "diceSessionBridge" task group

**Note (2026-08-29, `decouple-dice-roll-capability`):** The roll-request channel
(`requestRoll`/`onRollRequested`) and `CampaignChat`'s campaign/session-matching subscriber
were removed — `GlobalDiceFab` now submits rolls directly via `lib/dice/useRollSubmission.ts`
instead of asking whichever `CampaignChat` instance is mounted to submit on its behalf. See
`openspec/changes/archive/2026-08-29-decouple-dice-roll-capability/design.md` decision 3 and
the `dice-pool-shared-state` capability for where submission now lives.

## Non-Functional Acceptance Criteria

### Performance

#### Scenario: Bridge notification is synchronous and O(subscribers)

- **Given** N subscribers are registered on a given channel
- **When** `announcePresence`, `clearPresence`, or `requestRoll` is called
- **Then** exactly those N subscribers are invoked synchronously, with no network I/O or artificial delay introduced by the bridge itself

### Security

See functional scenario: "Payload for a different campaign is ignored" and "Payload for a stale/mismatched session is ignored". The bridge carries no authority of its own — see `roll-share-ui` capability's unchanged reliance on `app/api/campaigns/[id]/rolls` for the actual authorization/validation boundary. This module must never be extended to bypass or duplicate that route's checks.

### Reliability

#### Scenario: Bridge state does not leak between test cases

- **Given** a test-only `resetDiceSessionBridge()` export is called in test teardown
- **When** the next test registers subscribers and calls `announcePresence`/`requestRoll`
- **Then** no listener or presence value from a prior test is observed
