## GitHub Issues

- #443
- #400
- #317

## Why

- Problem statement: `Campaign.activeSessionId` can only be set via `POST /api/campaigns/[id]/sessions/active` and cleared via `DELETE /api/campaigns/[id]/sessions/active`. No UI anywhere in the app calls either endpoint — a repo-wide search of non-test `app/`/`lib/` code turns up zero callers besides the route file itself. `activeSessionId` therefore stays `null` forever in normal use, so `RollEntryStrip` in `lib/components/CampaignChat.tsx` is permanently disabled ("No active session") and dice rolls never work.
- Why now: Issue #443 ("Dice rolls do not recognize an active session") has been reopened twice. Two prior fixes — PR #454 (add `session` SSE event + `onSessionChange` reactivity) and PR #488 (fix cross-instance SSE delivery) — correctly fixed real bugs in the reactive plumbing that propagates `activeSessionId` changes to clients, but neither could fix the underlying issue because nothing ever triggers the state change in the first place. Investigation (see `.wolf`/explore session, GitHub issue #443 comment thread) traced the gap to the original `campaign-active-session-lifecycle` proposal (`openspec/changes/archive/2026-06-09-campaign-active-session-lifecycle/proposal.md`), which explicitly listed "UI for open/close/reset" as Out of Scope, deferred to "issue 6b, #317." Issue #317 was later closed, but its actual delivered scope was the roll-entry control (dice buttons, visibility selector) — not a session start/end control. The deferred UI was never built under any issue.
- Business/user impact: DMs cannot start a session through the app at all, so the entire live dice-roll feature (issue #317's stated acceptance criteria — "a player rolls and shares ... and the right audience sees it live") is unreachable in practice. This blocks real play sessions from using in-app rolls.

## Problem Space

- Current behavior: `activeSessionId` is `null` on every campaign and can never change via the UI. `RollEntryStrip` shows "No active session" and disables all roll controls unconditionally. The `sessions/active` route, its storage methods (`claimActiveCampaignSession`, `setActiveCampaignSession`), the `session` SSE event type, and the client-side listener (`useCampaignStream`, `CampaignChat`'s `onSessionChange`, `CampaignLayout`'s `activeSessionId` state) all already exist and work correctly — they are simply never invoked.
- Desired behavior: A DM-only "Start Session" / "End Session" control in `CampaignLayout`'s header, visible on every campaign tab (Members, Sessions, Prompts, Library). Clicking "Start Session" calls `POST /api/campaigns/[id]/sessions/active`, which creates a `SessionLog` and sets `activeSessionId`; the control then reflects "End Session" state. Clicking "End Session" calls `DELETE /api/campaigns/[id]/sessions/active`, clearing `activeSessionId`. The control's state stays in sync with the existing `session` SSE event (already wired to `CampaignLayout` via `onSessionChange`) so it reflects reality across tabs, other DM devices, and other server instances without a page reload. The control also needs a path to recover from a stale `activeSessionId` (DM's browser crashed mid-session) using the route's existing `?force=true` escape hatch.
- Constraints:
  - Must be DM-only. Non-DM members must not see or be able to trigger the control (route already 404s for non-DM, but the UI should not render a broken/misleading control for players either).
  - Must not duplicate `SessionLog` creation logic that already exists in the `sessions/active` POST handler — the control triggers it, it does not reimplement it.
  - Must not conflict with the unrelated "New Session" journal-entry flow on the Sessions page (`app/campaigns/[id]/sessions/page.tsx`, `POST /api/campaigns/[id]/sessions`), which creates historical `SessionLog` rows independently of `activeSessionId`. These two concepts currently produce visually identical `SessionLog` rows in the journal list; the proposal does not change that overlap, only exposes the missing control (see Non-Goals).
  - Must reuse the existing `activeSessionId` state and `onSessionChange` plumbing already threaded through `CampaignLayout` → `CampaignChat`; the header control and the chat dock's `RollEntryStrip` must observe the same source of truth.
  - Per [[n013-use-sse-campaign-events-for-session-state-updates-instead-of-polling]]-style project convention, session state must update via the existing SSE `session` event, not polling.
- Assumptions:
  - `CampaignLayout` is the correct place for the control per explicit user decision (header, visible on every tab) rather than embedding it in `CampaignChat` or the Sessions page.
  - The DM role for the current user can be determined client-side the same way other DM-gated UI in this codebase does today (need to confirm the existing pattern during design — e.g. `useCampaignContext`/`role` from campaign fetch).
  - Route-level 409 ("already active") / 404 ("none active") responses are the correct signal for handling a state race (e.g., another DM tab already started/ended the session) and should be handled gracefully (re-sync from response/SSE) rather than surfaced as hard errors.
- Edge cases considered:
  - DM clicks "Start Session" while another of their own tabs/devices already started one → route returns 409; UI should reconcile to "session active" state rather than showing a raw error.
  - DM clicks "End Session" but `activeSessionId` was already cleared elsewhere → route returns 404; UI should reconcile to "no active session" state.
  - Stale `activeSessionId` from a crashed session (DM can't start a new one, stuck at 409) → control needs a recovery action using `DELETE ?force=true`.
  - Non-DM campaign member loads the page → control must not render (or must render disabled/absent), matching the route's DM-only gate.
  - DM has the large/expanded chat dock open when clicking Start/End Session → header control must remain reachable in both compact and `isLarge` `CampaignLayout` render branches.
  - Session already active when DM's browser first loads the page (existing `GET /api/campaigns/[id]` initial fetch case, unaffected by this change) → control must render in "End Session" state immediately, not just after an SSE event.

## Scope

### In Scope

- A DM-only Start Session / End Session control rendered in `CampaignLayout`'s header (`app/campaigns/[id]/layout.tsx`), visible across all campaign tabs and in both compact and large chat-dock layouts.
- Wiring the control to `POST` / `DELETE /api/campaigns/[id]/sessions/active`, reusing the layout's existing `activeSessionId` state (already updated by `onSessionChange`/the `session` SSE event).
- Handling 409 / 404 / stale-session responses from those routes with client-side reconciliation (re-sync UI state) rather than raw error dumps.
- A force-reset affordance (using `?force=true`) for recovering from a stuck `activeSessionId`, gated to the DM.
- Determining/consuming DM role client-side for gating the control's visibility.
- Unit and integration tests covering the control's states, transitions, and error handling.

### Out of Scope

- Any change to the `sessions/active` route, `lib/storage.ts` session methods, `CampaignStreamEvent` types, or `useCampaignStream`/SSE transport — all of this plumbing already works (verified in PRs #454, #488) and is reused as-is.
- Any change to the roll-entry control (`RollEntryStrip`) itself beyond it now actually becoming enabled once a session is active — its disabled logic and roll-posting behavior are unchanged.
- Reconciling or merging the `sessions/active` (`activeSessionId`) concept with the unrelated manual journal-entry flow on the Sessions page (`POST /api/campaigns/[id]/sessions`). They remain two distinct `SessionLog`-producing paths after this change.
- Any redesign of `CampaignChat`'s dock, resize, or expand/collapse behavior (`chat-window-resize` change).
- Mobile-specific layout treatment beyond what the existing header/nav already handles responsively.

## What Changes

- `app/campaigns/[id]/layout.tsx`: Add a Start Session / End Session header control, gated to the DM role, driven by and updating the existing `activeSessionId` state.
- Likely a small new client component (exact location decided in design) for the control's presentation and click handling, including the force-reset affordance.
- Client-side DM-role detection wired into the layout (source TBD in design — may reuse an existing hook/context or require a small addition).
- New/updated unit and integration tests for the control's states and API interactions.

## Risks

- Risk: Determining DM role client-side may require a new data source if none is currently available in `CampaignLayout`.
  - Impact: Could expand scope beyond a simple button if a new API call or context is needed just to know the role.
  - Mitigation: Design phase will confirm the cheapest existing source of role info (e.g., data already returned by the layout's existing `GET /api/campaigns/[id]` fetch) before deciding on any new fetch.

- Risk: Race between the control's optimistic/expected state and the SSE `session` event or another DM's concurrent action.
  - Impact: UI could flash between Start/End states or show a stale button label.
  - Mitigation: Treat 409/404 responses as authoritative reconciliation signals, and let the SSE `session` event remain the single source of truth for `activeSessionId` rather than trusting local optimistic state past the fetch response.

- Risk: End users may confuse "Start/End Session" (live session, drives dice rolls) with "New Session" (manual journal log entry) since both produce `SessionLog` rows.
  - Impact: Confusing UX, potential duplicate/orphaned journal entries.
  - Mitigation: Out of scope to redesign, but design.md should specify clear, distinct labeling/copy for the new control to minimize confusion within this change's scope.

## Open Questions

- Question: Should ending a session (`DELETE`) also navigate the DM to the Sessions page to review/finish the auto-created `SessionLog`, or just clear `activeSessionId` in place?
  - Needed from: Product/UX decision (user).
  - Blocker for apply: no — design.md will default to "stay in place, no forced navigation" unless the user specifies otherwise.
- Question: Exact visual placement/style within the header (inline next to the campaign name vs. within the tab nav row vs. a distinct row) — user specified "camlayout header" but not precise placement among `header`/`nav`.
  - Needed from: User confirmation during design, or design.md will propose a specific placement for review.
  - Blocker for apply: no.

## Non-Goals

- Merging or redesigning the relationship between "active session" and the manual "Session Journal" entries.
- Any presence/multi-DM-lock UX beyond the existing single-active-session-per-campaign 409 guard.
- Automatic session expiry/timeout.
- Changing which roles can see the chat dock or roll strip beyond the existing visibility rules.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
