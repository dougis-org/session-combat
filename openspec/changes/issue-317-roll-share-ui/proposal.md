## GitHub Issues

- dougis-org/session-combat#317
- dougis-org/session-combat#298 (Phase 6 epic)

## Why

- Problem statement: Players and the DM have no way to share dice rolls in the campaign chat dock. The rolls API (6a, #316) is complete and the chat dock is live (5b, #315), but they are not connected — rolls cannot be entered, posted, or seen by other session participants.
- Why now: Both blocking dependencies (#315, #316) closed on 2026-06-19. This is the final deliverable of Phase 6.
- Business/user impact: Without this, the chat dock is text-only and players must share roll results verbally or in free-text messages, which is error-prone and loses the structured breakdown needed for transparent play (e.g., "did that hit?" verification).

## Problem Space

- Current behavior: `CampaignChat` handles `CampaignStreamEvent` of type `message` only; `type: "roll"` events from the SSE stream are silently ignored. There is no roll-entry UI in the dock. Roll history is never fetched.
- Desired behavior: A roll-entry strip below the chat composer lets any active member select a die size (d4–d20), optionally add a flat modifier, choose group or DM-only visibility, and fire the roll. Rolls appear in the feed interleaved with messages by timestamp, rendered as a distinct item showing formula, per-die breakdown, total, roller handle, and visibility marker. The strip is disabled (greyed, labelled "No active session") when `campaign.activeSessionId` is null.
- Constraints:
  - `RollVisibility` is `group | dm-only` only — no direct/whisper scope for rolls.
  - The API requires `formula`, `rolls[]`, `total`, and `visibility`; rolling is done client-side using the existing `rollDie()` utility.
  - The API returns 409 when there is no `activeSessionId` — the UI must guard against this pre-flight.
  - Roll history GET requires an explicit `sessionId` param; only `campaign.activeSessionId` is available client-side.
- Assumptions:
  - `CampaignChat` receives `activeSessionId` as a prop from its parent (the campaign page already holds campaign state).
  - One die per roll click (e.g., clicking d20 rolls 1d20 + modifier). Multi-die shortcuts (2d6) are out of scope.
  - Roll history is loaded for the active session only; prior-session rolls are out of scope.
  - Optimistic feed entries for rolls (like messages have) are not required for MVP — the SSE echo back is fast enough.
- Edge cases considered:
  - No active session: strip is greyed out; if a 409 arrives anyway (race), show inline error and do not clear the roll state.
  - Stream delivers a roll event before history loads (dedup by id, same pattern as messages).
  - Modifier field: allow negative values (e.g., −2 to simulate disadvantage penalty); clamp display but do not clamp value.
  - Roll event received for a roll the current user cannot see (server should not emit it, but if it arrives, `canSeeRoll` acts as a client-side guard).

## Scope

### In Scope

- Unified feed type (`FeedItem`) replacing the `messages` state in `CampaignChat`.
- Roll feed item component: formula, per-die breakdown, total, roller handle, timestamp, visibility marker.
- Roll-entry strip in the dock: d4/d6/d8/d10/d12/d20 buttons, modifier input (integer, positive or negative), visibility selector (group/dm-only), disabled state when no active session.
- SSE stream handler extended to consume `type: "roll"` events.
- Roll history fetch on dock expand (parallel with message history fetch), merged and sorted by `createdAt`.
- `activeSessionId` prop added to `CampaignChat`.

### Out of Scope

- Multi-die formula input (e.g., "2d6+3" free text entry).
- Roll history across multiple sessions.
- Advantage/disadvantage rolling (2d20 keep highest/lowest).
- Whisper-scoped rolls (`direct` visibility).
- Optimistic roll feed items.
- Unread-count tracking for roll events.

## What Changes

- `lib/components/CampaignChat.tsx`: add `activeSessionId` prop; replace `messages: CampaignMessage[]` state with `feed: FeedItem[]`; extend stream handler; add roll history fetch; add `RollFeedItem` sub-component; add `RollEntryStrip` sub-component.
- `lib/types.ts`: export `FeedItem` discriminated union (or define it locally in `CampaignChat.tsx` — TBD in design).
- Caller of `CampaignChat` (campaign page): pass `activeSessionId` prop.

## Risks

- Risk: Feed merge complexity — sorting mixed message/roll arrays on each state update could cause render thrash.
  - Impact: Jank on rapid incoming events.
  - Mitigation: Insert into sorted position rather than re-sorting the entire array; or sort once on initial load and append/insert incrementally via stream.

- Risk: Roll history and message history fetched in parallel but merged — a slow roll history fetch could cause a layout jump.
  - Impact: Visual shift after initial render.
  - Mitigation: Show loading indicator until both fetches resolve; merge before first render of history items.

- Risk: `activeSessionId` going stale — the campaign page may not re-fetch the campaign when a DM starts/ends a session mid-visit.
  - Impact: Roll strip remains enabled/disabled incorrectly.
  - Mitigation: The campaign SSE `change` event should carry updated campaign fields; `CampaignChat` (or parent) should update `activeSessionId` on `type: "change"` events. Flag as a follow-up if not already handled.

## Open Questions

- No unresolved questions remain that would block implementation. All design decisions were made during the explore session:
  - Mixed feed: confirmed.
  - Quick buttons + modifier field: confirmed.
  - No active session → greyed strip: confirmed.
  - `activeSessionId` via prop: confirmed.

## Non-Goals

- Server-side formula parsing or re-rolling.
- Roll statistics, history search, or export.
- Push notifications for rolls.
- Sound effects or animation on roll.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
