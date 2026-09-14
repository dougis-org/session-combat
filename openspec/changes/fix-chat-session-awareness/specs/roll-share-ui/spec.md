This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED CampaignChat accepts activeSessionId prop

`CampaignChat` SHALL NOT accept `activeSessionId` or `onSessionChange` as props. It SHALL derive `activeSessionId` internally via the non-subscribing `useActiveSessionIdCore(campaignId)` (see `session-controls` capability) — fed `session`-typed events from the single `useCampaignStream` subscription its message/roll feed already holds, NOT via a second, independent subscription — and use that value to gate roll-history fetching and dice-session presence announcement (see `dice-session-bridge` capability), exactly as it previously did with the externally-supplied value. It SHALL NOT gate any dice-rolling control, because the chat dock does not render one; all dice rolling is provided by `GlobalDiceFab` (see `global-dice-fab` capability). All other scenarios in this capability that reference "`CampaignChat` is rendered with `activeSessionId={X}`" now refer to the value `useActiveSessionId(campaignId)` resolves to internally, not an externally-supplied prop; their observable behavior (roll history gating, presence announcement, footer rendering) is unchanged by this substitution.

#### Scenario: An already-active session is reflected without an external prop

- **Given** a campaign's `activeSessionId` is already "session-abc" when `CampaignChat` mounts (no `session` stream event has occurred during this page visit)
- **When** the dock is expanded
- **Then** roll history is fetched for "session-abc" and dice-session presence is announced, exactly as if `activeSessionId="session-abc"` had been passed as a prop under the prior contract

#### Scenario: activeSessionId null disables roll history and presence, feed still loads

- **Given** `useActiveSessionId(campaignId)` has resolved to `null` for the campaign `CampaignChat` is mounted for
- **When** the dock is expanded
- **Then** no roll-history fetch to `/api/campaigns/[id]/rolls` is attempted
- **And** no dice-session presence is announced
- **And** the message feed loads normally
- **And** the "No active session" footer is shown (see "ADDED Chat dock shows a no-active-session footer instead of a dice bar")

#### Scenario: activeSessionId non-null enables roll history and presence

- **Given** `useActiveSessionId(campaignId)` has resolved to "session-abc" for the campaign `CampaignChat` is mounted for
- **When** the dock is expanded
- **Then** roll history is fetched for "session-abc"
- **And** dice-session presence `{ campaignId, sessionId: "session-abc" }` is announced while the component owns that active session
- **And** no dice control is rendered in the drawer

## Traceability

- Proposal element: "CampaignChat (and/or useChatFeed): adopt the shared hook internally instead of accepting props from the caller" → Requirement: MODIFIED CampaignChat accepts activeSessionId prop
- Design Decision 3 (remove activeSessionId/onSessionChange props, call hook internally) → Requirement: MODIFIED CampaignChat accepts activeSessionId prop; Scenario: "An already-active session is reflected without an external prop"
- Requirements → Task(s): see `tasks.md`

## Non-Functional Acceptance Criteria

### Requirement: Reliability

See `session-controls` capability's "An already-active session is visible without a prior stream event" and "Hook state resets when campaignId changes" scenarios — these are the underlying hook-level guarantees this capability's `CampaignChat`-level scenarios depend on.
