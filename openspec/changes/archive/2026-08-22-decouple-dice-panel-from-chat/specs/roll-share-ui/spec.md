## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement. It layers on top of the existing `roll-share-ui` capability baseline at `openspec/specs/roll-share-ui/spec.md`, which is otherwise unchanged by this delta.

### Requirement: ADDED CampaignChat submits externally-requested rolls through its existing commit path

The system SHALL cause `CampaignChat` to treat a matching roll request received from `lib/dice/diceSessionBridge.ts` (see `dice-session-bridge` capability) exactly as it treats its own in-chat "Roll" commit: one POST to `/api/campaigns/[id]/rolls` with the request's `formula`/`rolls`/`total`/`visibility`, followed by the existing success/409/error handling, feed append, dedupe, and scroll behavior.

#### Scenario: Externally-requested roll appears in the feed identically to an in-chat roll

- **Given** `CampaignChat` is mounted for `campaignId="c1"` with `activeSessionId="s1"` and an open stream
- **When** a matching roll request `{campaignId: "c1", sessionId: "s1", roll: {formula: "2d6", rolls: [3,5], total: 8, visibility: {scope: "group"}}}` is received via the bridge
- **Then** a POST is made to `/api/campaigns/c1/rolls` with that formula/rolls/total/visibility, and on a 201 response the roll appears in the feed as a `RollFeedItem`, indistinguishable in rendering from a roll committed via the in-chat pop-out

#### Scenario: Externally-requested roll triggers the same auto-scroll rule as a self-committed roll

- **Given** `CampaignChat`'s feed is scrolled such that the bottom is not visible
- **When** an externally-requested roll (matching the mounted campaign/session) is successfully committed
- **Then** the feed scrolls to show the new roll, following the existing "own committed roll always scrolls" rule (see `roll-share-ui`'s "MODIFIED Feed auto-scrolls on a new dice roll" requirement) rather than the bottom-proximity-gated rule used for remote/other-user rolls

#### Scenario: 409 (no active session race) on an externally-requested roll surfaces the same inline handling

- **Given** a matching roll request arrives but the session has just become inactive server-side
- **When** the POST resolves with 409
- **Then** `CampaignChat` handles it exactly as it does for its own in-chat commit today (no roll added to the feed; no crash), per the existing "409 response (no active session race)" scenario

#### Scenario: In-chat dice pool trigger and behavior are unaffected

- **Given** `CampaignChat` is mounted with an active session
- **When** the user uses the existing in-chat dice pop-out trigger and pool (unrelated to the global fab)
- **Then** all existing `roll-share-ui` scenarios for staging, committing, and rendering rolls continue to behave exactly as specified in the baseline capability, with no observable change

---

## Traceability

- Proposal element "CampaignChat continues to own POST/append/dedupe/scroll; existing chat-roll behavior must not change" → Requirements: ADDED CampaignChat submits externally-requested rolls through its existing commit path (all scenarios)
- Design decision 3 (roll-request scoping, existing tail reused) → Requirements: ADDED CampaignChat submits externally-requested rolls through its existing commit path
- Requirement → Task(s): see `openspec/changes/decouple-dice-panel-from-chat/tasks.md`, "CampaignChat bridge wiring" task group

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenario: "409 (no active session race) on an externally-requested roll surfaces the same inline handling", and the `dice-session-bridge` capability's "Payload for a different campaign is ignored" / "Payload for a stale/mismatched session is ignored" scenarios. No new access-control logic is introduced in `CampaignChat`; `app/api/campaigns/[id]/rolls/route.ts` remains the sole authorization/validation boundary, unchanged by this delta.

### Requirement: Reliability

See `dice-session-bridge` capability's presence/roll-request lifecycle scenarios (announce on mount, clear on unmount/session-end) — this delta does not duplicate those, only the consumption side within `CampaignChat`'s existing commit path.
