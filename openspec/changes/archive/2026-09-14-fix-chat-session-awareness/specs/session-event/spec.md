This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## REMOVED Requirements

### Requirement: REMOVED `CampaignChat` forwards `session` events via `onSessionChange` callback

Reason for removal: `CampaignChat` no longer accepts an `onSessionChange` prop. It calls the shared `useActiveSessionId(campaignId)` hook internally (see `session-controls` capability, "ADDED Shared `useActiveSessionId` hook") and derives its own `activeSessionId` directly from that hook's handling of `session` stream events. There is no longer a callback for a parent to receive session changes through — `CampaignChat` needs none, since it no longer depends on a parent for this state at all.

### Requirement: REMOVED layout updates `activeSessionId` reactively from `session` events

Reason for removal: `CampaignLayout` no longer holds `activeSessionId` state at all (it was already partially retired by the `surface-start-session-button` change for `SessionControl`'s side; this removal retires the remainder, which had gone stale/unused for `CampaignChat`'s side since commit `3c53030` and was the root cause of GitHub issue #721). Each of `SessionControl` and `CampaignChat` now independently derives `activeSessionId` via `useActiveSessionId(campaignId)` (see `session-controls` capability). There is no "layout's `activeSessionId` state" left to update.

### Requirement: REMOVED `CampaignChat` component props (`onSessionChange` addition)

Reason for removal: superseded by the hook-based contract. `CampaignChat`'s props no longer include `activeSessionId` or `onSessionChange` at all (see `roll-share-ui` capability, "MODIFIED CampaignChat accepts activeSessionId prop" for the current prop contract, which has none related to session state).

## MODIFIED Requirements

### Requirement: MODIFIED `session` event type in `CampaignStreamEvent`

The system SHALL continue to emit the `session` event with its existing shape (`{ type: "session"; campaignId: string; data: { activeSessionId: string | null } }`) on session start/end, unchanged by this client-side-only change. All scenarios under "ADDED `session` event type in `CampaignStreamEvent`", "ADDED `session` event emitted on session start", and "ADDED `session` event emitted on session end" remain in force unchanged.

#### Scenario: Event shape and emission are unaffected by this change

- **Given** the existing `session` event scenarios in this capability (session start, session end, shape validation)
- **When** this change (centralizing client-side consumption into `useActiveSessionId`) is applied
- **Then** none of those server-side scenarios' behavior changes; only how clients consume the event changes (see `session-controls` capability)

## Traceability

- Proposal element: "CampaignChat/useChatFeed: adopt the shared hook internally instead of accepting props from the caller" → Requirement: REMOVED `CampaignChat` forwards `session` events via `onSessionChange` callback
- Proposal element: "CampaignLayout: stop threading activeSessionId/onSessionChange/initialSessionId between its children" → Requirement: REMOVED layout updates `activeSessionId` reactively from `session` events
- Design Decision 3 (CampaignChat prop removal) → Requirement: REMOVED `CampaignChat` component props (`onSessionChange` addition)
- Design Decision 5 (CampaignLayout simplification) → Requirement: REMOVED layout updates `activeSessionId` reactively
- Requirements → Task(s): see `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

See `session-controls` capability's "No new SSE connections or polling introduced" and "Hook state resets when campaignId changes" scenarios — this capability's own event-shape and emission reliability scenarios (unaffected by this change) remain those already documented under "ADDED `session` event emitted on session start"/"...end".
