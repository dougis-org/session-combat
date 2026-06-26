## GitHub Issues

- #443

## Why

- Problem statement: Dice rolls in the campaign chat dock are permanently disabled when a DM starts a session after players have already loaded the campaign page. The layout fetches `activeSessionId` once on mount and never refreshes it, so clients miss session start/end events.
- Why now: Issue #443 was filed immediately after the roll-share UI (issue #317) shipped. The feature is live but broken in the most common real-world flow (DM starts session, players are already in the chat).
- Business/user impact: Players and DMs cannot use shared dice rolls — the entire Phase 6 deliverable is effectively unusable in a live session.

## Problem Space

- Current behavior: `app/campaigns/[id]/layout.tsx` fetches `activeSessionId` from `GET /api/campaigns/[id]` once on mount. `CampaignStreamEvent` has no session lifecycle event type. The `sessions/active` POST and DELETE routes update `activeSessionId` in MongoDB but emit nothing to connected SSE clients. If the DM starts a session after any client has loaded the page, those clients never learn the new `activeSessionId`, so `RollEntryStrip` stays disabled (`isDisabled = true` when `activeSessionId === null`).
- Desired behavior: When the DM starts or ends a session, all connected clients immediately update their `activeSessionId` state without a page reload.
- Constraints: The SSE stream (`/api/campaigns/[id]/stream`) is already established and consumed by `useCampaignStream`. The fix must stay within that existing channel.
- Assumptions: All users who care about dice rolls are already connected to the campaign SSE stream (they have the chat dock open or at least the campaign layout mounted).
- Edge cases considered:
  - DM ends a session while players are mid-roll (roll POST should fail with 409 from the API; client should show error already handled in `RollEntryStrip`).
  - Layout mounts after session is already active (static case — already works; must continue to work).
  - Multiple tabs / page reloads during an active session (each new mount fetches fresh state; SSE events cover the delta).

## Scope

### In Scope

- Add `session` event type to `CampaignStreamEvent` in `lib/types.ts`.
- Emit `session` event from `app/api/campaigns/[id]/sessions/active/route.ts` POST (session started) and DELETE (session ended).
- Handle `session` event in `app/campaigns/[id]/layout.tsx` to update `activeSessionId` state.

### Out of Scope

- Any UI changes to the roll strip or chat dock.
- Changes to roll history loading (already uses `activeSessionId` prop; will benefit automatically).
- Adding a GET endpoint for active session state.
- Polling or long-polling approaches.

## What Changes

- `lib/types.ts`: Add `| { type: "session"; campaignId: string; data: { activeSessionId: string | null } }` to `CampaignStreamEvent`.
- `app/api/campaigns/[id]/sessions/active/route.ts`: After POST succeeds, emit `session` event with the new `activeSessionId`. After DELETE succeeds, emit `session` event with `activeSessionId: null`.
- `app/campaigns/[id]/layout.tsx`: In the stream event handler passed to `useCampaignStream`, handle `type === "session"` by calling `setActiveSessionId(e.data.activeSessionId)`.

## Risks

- Risk: `useCampaignStream` hook currently lives inside `CampaignChat`, not in the layout — the layout has no direct stream handle.
  - Impact: The layout needs a way to react to stream events. Currently it doesn't consume the stream.
  - Mitigation: The layout can pass a callback into `CampaignChat` via a prop (`onSessionChange`), or `CampaignChat` can call it when it receives a `session` event. Alternatively, the layout can mount its own lightweight stream listener. Design decision deferred to design.md.
- Risk: Emitting stream events from route handlers requires access to the campaign pub/sub channel.
  - Impact: The sessions/active route must use the same event-emission mechanism the stream uses (check how `message` and `roll` events are emitted).
  - Mitigation: Verify the emission path before implementing; it is already used by rolls and messages.

## Open Questions

- No unresolved ambiguity. The root cause is confirmed, the fix direction is clear, and all edge cases are documented. Implementation decisions (emission mechanism, callback vs. shared hook) are deferred to design.md.

## Non-Goals

- Replacing the one-shot fetch in layout.tsx with polling.
- Adding a dedicated `GET /api/campaigns/[id]/sessions/active` endpoint.
- Changing visibility rules or roll behavior.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
