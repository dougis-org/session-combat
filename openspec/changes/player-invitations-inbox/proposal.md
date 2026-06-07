## GitHub Issues

- #308

## Why

- Problem statement: Players who are invited to join a campaign have no UI surface to see or respond to those invitations. The invite/respond APIs (2b) are complete but unreachable from the browser.
- Why now: Phase 2 (invite & accept flow) is otherwise complete (2a, 2b, 2c closed). This is the last sub-issue before the epic is done.
- Business/user impact: Without this, the multi-user campaign feature is unusable for players — a DM can invite but the invited player has no way to accept.

## Problem Space

- Current behavior: `GET /api/me/invitations` and `PATCH /api/campaigns/[id]/members/me` exist and are tested, but there is no UI that calls them. The NavBar has no indication of pending invites.
- Desired behavior: A player sees a count pill in the NavBar when they have pending invitations. Clicking it takes them to `/invitations`, where they see each invite with campaign name, inviter, and date. They can accept or decline. Accepting causes the campaign to appear in their campaigns list.
- Constraints: Must follow existing UI patterns — `ProtectedRoute`, `ErrorBanner`, `LoadingState`, Tailwind semantic tokens, no external toast library.
- Assumptions: The `GET /api/me/invitations` response shape `{ invitations: [{ id, campaignId, campaignName, invitedBy, invitedAt }] }` is stable.
- Edge cases considered:
  - No pending invitations (empty state, badge hidden)
  - Accept/decline API errors (shown via `ErrorBanner`)
  - User accepts then navigates to `/campaigns` (campaign appears because `/campaigns` re-fetches)
  - User declines (invite removed from list immediately)
  - Nav badge count drift after responding (badge re-fetches after respond action)

## Scope

### In Scope

- `lib/components/Toast.tsx` — standalone reusable toast component (hook + renderer)
- `lib/components/NavBar.tsx` — invitation count pill linking to `/invitations`
- `app/invitations/page.tsx` — new ProtectedRoute inbox page
- Unit tests for the inbox page and NavBar badge
- Toast shows success message on accept and decline

### Out of Scope

- Migrating `ActiveCombatView` / `useCombat` to use the new Toast component (tracked in #389)
- Real-time / polling for new invitations (badge refreshes on page load only)
- Email or push notifications
- Pagination of the invitations list

## What Changes

- New file `lib/components/Toast.tsx`: `useToast()` hook returning `{ showToast, Toast }`. Toast auto-dismisses after 3 seconds, renders fixed bottom-right, supports `success` and `error` types.
- Modified `lib/components/NavBar.tsx`: fetches `/api/me/invitations` on mount (when authenticated), renders `Invitations (N)` link with yellow pill when N > 0, hidden when 0.
- New file `app/invitations/page.tsx`: lists pending invitations, accept/decline per invite, success toast on respond, optimistic removal from list, empty state.
- New test file `tests/unit/components/InvitationsPage.test.tsx`
- Updated `tests/unit/components/NavBar.test.tsx` (or new test file if none exists)

## Risks

- Risk: NavBar fetches `/api/me/invitations` on every page load, adding a network request to the critical render path.
  - Impact: Minor latency; badge appears slightly after nav renders.
  - Mitigation: Request is lightweight (indexed query). Badge renders after auth check already completes, so no perceptible delay.
- Risk: Badge count goes stale after the user responds on the invitations page.
  - Impact: Badge still shows old count until next navigation.
  - Mitigation: After any respond action succeeds, re-fetch invitations to update the local list; NavBar will update on next navigation naturally. If needed, a simple callback or context can be added later.

## Open Questions

No unresolved ambiguity. All decisions were made during exploration:
- Inbox location: `/invitations` (dedicated page, consistent with app pattern)
- Nav badge: link with count pill, hidden when 0
- Toast: standalone `lib/components/Toast.tsx`, not added to `ui.tsx`
- Combat view migration: deferred to #389

## Non-Goals

- Persisting toast state across navigation
- Bulk accept/decline
- Filtering or sorting invitations
- Wiring Toast into any page other than `/invitations` (that's per-page follow-up work)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
