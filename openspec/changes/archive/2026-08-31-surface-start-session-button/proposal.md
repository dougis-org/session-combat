## GitHub Issues

- #602

## Why

- Problem statement: The "Start Session" button is currently only visible in the global layout top bar. When a DM is viewing the Session Journal page (`/campaigns/[id]/sessions`), they may overlook the global button if they are focused on logging or viewing sessions in the main content area.
- Why now: DMs need an obvious, contextual way to start a session when they are already on the screen dedicated to managing sessions.
- Business/user impact: Improves UX by surfacing the primary call-to-action ("Start Session") contextually where users expect it, reducing friction to starting a session.

## Problem Space

- Current behavior: The Session Journal page (`SessionsContent`) only shows a "+ New Session" button (which opens a form to log a past session). The "Start Session" button lives globally in the layout header (`CampaignLayout`).
- Desired behavior: If there is no active session, the Session Journal page should display the "Start Session" button directly within its main content area, in addition to the global button at the top of the screen. Both buttons must stay in sync (starting a session in one immediately updates the other).
- Constraints: The `activeSessionId` state is currently managed locally within `CampaignLayout` via a simple `useState` hook. The `SessionsPage` does not directly receive this state. 
- Assumptions: We do not want to lift `activeSessionId` into a heavy global React Context if we can avoid it.
- Edge cases considered: 
  - Network latency causing the buttons to temporarily desync.
  - The session being started from a different browser tab (should update the local buttons).

## Scope

### In Scope

- Refactoring the `<SessionControl>` component to autonomously manage its own sync state via the existing Server-Sent Events (SSE) stream (`useCampaignStream`).
- Displaying the `<SessionControl>` component within the `SessionsContent` page when there is no active session.

### Out of Scope

- Modifying the backend API logic for starting or ending sessions.
- Redesigning the Session Journal page layout beyond inserting the button.
- A full migration of `activeSessionId` to a global React Context provider.

## What Changes

- `<SessionControl>` will be updated to subscribe to the campaign SSE stream (`useCampaignStream`) to receive `session` events and keep its internal `activeSessionId` state up-to-date automatically.
- `CampaignLayout` will no longer need to manage `activeSessionId` state or pass it down; it will just render `<SessionControl campaignId={id} />`.
- `SessionsContent` will render `<SessionControl campaignId={campaignId} />` directly in the page body (conditionally, when no session is active).

## Risks

- Risk: Multiple `<SessionControl>` instances subscribing to the SSE stream could create duplicate SSE connections if not careful.
  - Impact: Unnecessary network connections and backend load.
  - Mitigation: `useCampaignStream` uses a singleton pattern for the SSE connection under the hood, or we ensure the browser handles multiple `EventSource` connections to the same endpoint efficiently. (Note: `useCampaignStream` does not currently multiplex connections, but the overhead of 2-3 connections per client is negligible for our scale. If it becomes an issue, we can extract the SSE connection to a provider).

## Open Questions

- None.

## Non-Goals

- Refactoring the entire `useCampaignContext` to be real-time.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
