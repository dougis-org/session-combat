## GitHub Issues

- #521

## Why

- Problem statement: Dice rolling only exists inside `lib/components/CampaignChat.tsx`, which is mounted exclusively by `app/campaigns/[id]/layout.tsx`. The trigger button is disabled unless there is both an active campaign session and an open SSE stream (`isTriggerDisabled = activeSessionId !== null ? streamStatus !== 'open' : true`), and `handleRoll()` unconditionally POSTs to `/api/campaigns/:id/rolls`, which 409s without an active session. There is currently no way to roll dice anywhere in the app without being on a specific campaign's page with a live session.
- Why now: Users want to roll dice casually (checking a rule, settling a side bet, rolling before a session starts) without needing to be inside a campaign session. This is a standing user-facing gap, not a regression.
- Business/user impact: Removes friction from the single most common D&D interaction (rolling dice), making the app useful outside the narrow "actively in a live session" window, while preserving all existing in-session chat behavior unchanged.

## Problem Space

- Current behavior: Dice pool UI, roll computation, result rendering, and chat-feed persistence are a single undifferentiated unit inside `CampaignChat`, gated on `activeSessionId` + SSE stream state.
- Desired behavior: A persistent, globally available d20 icon (lower-left corner, every page) opens a center-screen modal that lets any logged-in user build a dice pool and roll it, with no campaign/session dependency. When the user happens to be on a campaign page with an active session, the modal additionally offers to send that roll into the session chat feed, using the exact same persistence/dedupe/scroll path that exists today.
- Constraints:
  - Must not change `app/api/campaigns/[id]/rolls/route.ts` — its auth (`withAuthAndParams`/JWT), membership check, `assertCampaignAccess`, active-session 409, and payload validation are already correct and must remain the sole trust boundary.
  - Must not change existing `CampaignChat`-internal dice pool behavior/tests (pool UI, `useDicePool`, `DicePoolPanel`, `DiceTriggerButton`) — the in-chat trigger keeps working exactly as it does today.
  - Dice roll generation must continue to use the existing `rollDicePool()` / `rollDie()` in `lib/utils/dice.ts` (crypto rejection-sampling); no new generation logic.
  - The global dice panel must require authentication (`lib/hooks/useAuth.ts`).
- Assumptions:
  - "The lower left corner of every page" means a fixed-position element rendered once from the root layout (`app/layout.tsx`), not per-page.
  - "If the user is also in a session chat" is interpreted narrowly: the user must currently be on that campaign's page (`app/campaigns/[id]`) with that campaign's session active — not a cross-campaign picker from anywhere in the app.
  - A client-side event/presence bridge is an acceptable UI-only mechanism, given the server route remains fully authoritative regardless of caller.
- Edge cases considered:
  - User opens the global panel while on a campaign page but the session is inactive/ended mid-interaction → "send to chat" option must disappear (presence cleared), not silently fail.
  - Multiple tabs open on different campaigns → a roll requested for campaign A must never be delivered to a `CampaignChat` instance mounted for campaign B.
  - User navigates away from the campaign page while the global modal is still open → presence must clear and the "send to chat" option must be removed/disabled.
  - Unauthenticated user (session expired mid-use) → fab must not offer rolling.

## Scope

### In Scope

- New always-mounted `GlobalDiceFab` component (fixed lower-left d20 icon + center-screen modal), gated by `useAuth()`.
- Dice pool builder UI in the new modal, reusing `lib/utils/dice.ts`.
- A small, purpose-built, typed client-side bridge module (not a generic pub/sub) connecting `GlobalDiceFab` and `CampaignChat`:
  - Presence channel: `CampaignChat` → `GlobalDiceFab`, `{ campaignId, sessionId } | null`.
  - Roll-request channel: `GlobalDiceFab` → `CampaignChat`, `{ campaignId, sessionId, roll }`.
- Wiring `CampaignChat` to announce/clear presence and to subscribe to roll requests, feeding them into its existing POST/append/scroll path.
- Modal open/close behavior: Escape key, outside click, no auto-timeout.
- Tests for the new component, the bridge's scoping/lifecycle behavior, and a regression check that the existing rolls route still rejects non-members/inactive sessions regardless of trigger source.

### Out of Scope

- Any change to `app/api/campaigns/[id]/rolls/route.ts` or other server routes.
- A cross-campaign/session picker (sending a roll to a campaign/session other than the one currently active in the browser tab).
- Changing `CampaignChat`'s internal dice pool UI, trigger button, or its own tests.
- Persisting or showing history for rolls made outside of a session (those are ephemeral, client-only, shown once in the modal).
- Mobile-specific layout/gesture work beyond making the fixed fab usable at common breakpoints.

## What Changes

- Add `GlobalDiceFab` (or similarly named) component, mounted in `app/layout.tsx`.
- Add `lib/dice/diceSessionBridge.ts` (typed presence + roll-request channels, scoped by `{campaignId, sessionId}`).
- Modify `CampaignChat.tsx` to: announce/clear presence on mount/unmount/session-change, and subscribe to roll requests, routing matching ones through its existing `handleRoll` POST/append/scroll tail.
- No changes to `lib/utils/dice.ts` or any API route.

## Risks

- Risk: A client-side bridge could be mistaken for (or later abused as) a security boundary.
  - Impact: A future change might skip re-validating on the server, believing the client-side scoping is sufficient.
  - Mitigation: Explicitly document in `design.md` that the bridge is UI-transport only; the server route remains the sole authority and is unchanged by this work. Add a regression test asserting the route still 403/409s regardless of trigger source.
- Risk: Stale presence/listeners across mount/unmount cycles (fast navigation, remounts) could cause a "send to chat" option to appear/linger incorrectly, or a roll to be dropped/misdelivered.
  - Impact: Confusing UX (option shown but roll doesn't land) or, in the worst case, a roll delivered to the wrong campaign's chat in a multi-tab scenario.
  - Mitigation: Presence and roll-request channels are scoped by `{campaignId, sessionId}`; `CampaignChat` only accepts a roll request when both ids match its own current values, and explicitly clears presence on unmount and on session going inactive. Covered by lifecycle tests.
- Risk: Introducing a persistent fixed-position element on every page could visually collide with existing UI (e.g., other floating elements, mobile nav) or affect layout/CLS.
  - Impact: Visual regressions on some pages.
  - Mitigation: Manual pass across representative pages during implementation; keep the fab a fixed, low-z-index-conflict corner element consistent with existing dice popout portal patterns (`lib/components` already renders dice popouts through a body-level portal).

## Open Questions

This proposal was developed through an `/opsx:explore` session (GitHub issue #521) where the ownership split, presence/roll-request scoping, and non-goals were discussed and explicitly resolved with the requester. No unresolved ambiguity remains blocking design/specs/tasks.

- Question: Exact visual placement/spacing of the fab relative to other fixed UI (e.g., footer, any existing floating elements) on mobile breakpoints.
  - Needed from: Design/visual pass during implementation (not a blocker for this proposal).
  - Blocker for apply: no

## Non-Goals

- Building a generic, app-wide event bus for other features to reuse. The bridge module is purpose-built for this one presence/roll-request pairing.
- Supporting rolling into a campaign/session the user is not currently viewing.
- Persisting standalone (no-session) rolls anywhere server-side.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
