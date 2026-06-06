## GitHub Issues

- #306
- #294 (parent epic — Phase 2 Invite & accept flow)

## Why

- **Problem statement:** Invited players have no way to accept or decline campaign invitations, and no way to see what invitations are pending. The invite API (2a / #305) can create `CampaignMember` records with `status: "invited"` but there is no endpoint for the invitee to respond.
- **Why now:** 2a is merged. 2b is the direct unblocked dependency for the player-facing inbox UI (2d / #308) and the full invite flow cannot be tested end-to-end until it exists.
- **Business/user impact:** Without this, the multi-user campaigns initiative stalls. Players cannot join campaigns they've been invited to.

## Problem Space

- **Current behavior:** A DM can invite a player via `POST /api/campaigns/[id]/members`. The `CampaignMember` document is created with `status: "invited"` and a history entry. The player has no API to respond, and no API to list their pending invites.
- **Desired behavior:** An invited player can call `PATCH /api/campaigns/[id]/members/me` with `{ "action": "accept" | "decline" }`. Accepting transitions status to `active`; declining to `declined`. A separate `GET /api/me/invitations` lists all pending invitations for the caller, including campaign name and inviter username.
- **Constraints:**
  - Only the invited user may respond — not a DM, not another player.
  - `username` is now required on all `User` documents (backfill already run).
  - `CampaignMember` uses `history: MemberHistoryEntry[]` — no flat `respondedAt` field.
  - Storage layer already has `updateMemberStatus` and `getMember`.
- **Assumptions:**
  - All 4 existing users have usernames after the backfill script was run.
  - The `invitedAt` and `invitedBy` values are derived from the **last** history entry with `action: "invited"` (accounts for re-invite cycles).
- **Edge cases considered:**
  - Idempotent repeat requests (accept when already active, decline when already declined) → 200 with current status, no DB write.
  - Conflicting repeat requests (accept when already declined, decline when already accepted) → 409 with descriptive message.
  - No membership or `removed` status → 404.
  - Unauthenticated → 401.
  - Missing or invalid action field → 400.
  - Invitations list with no pending invites → 200 with empty array.
  - Batch user lookup for inviter usernames avoids N+1 queries.

## Scope

### In Scope

- `PATCH /api/campaigns/[id]/members/me` — accept or decline an invitation
- `GET /api/me/invitations` — list caller's pending invitations (with campaign name + inviter username)
- `lib/types.ts`: make `User.username` required; add `PublicUser` interface
- `lib/storage.ts`: add `getUserById`, `getUsersByIds`, `listInvitationsForUser`
- Unit tests for all new storage methods and both routes

### Out of Scope

- Player invitations inbox UI (issue #308 — depends on this change)
- Campaign member-management UI (issue #307)
- Push notifications or real-time updates for new invitations
- Pagination on `GET /api/me/invitations`

## What Changes

- `lib/types.ts`: `User.username` becomes required; new `PublicUser { id: string; username: string }` interface added
- `lib/storage.ts`: three new methods — `getUserById`, `getUsersByIds`, `listInvitationsForUser`
- `app/api/campaigns/[id]/members/me/route.ts`: new file — PATCH handler with full state-machine enforcement
- `app/api/me/invitations/route.ts`: new file — GET handler, creates the `me/` route area
- `tests/unit/storage/campaignMembers.test.ts`: new cases for `listInvitationsForUser`
- `tests/unit/storage/users.test.ts`: new file — `getUserById` + `getUsersByIds` cases
- `tests/unit/api/campaigns/[id]/members/me.test.ts`: new file — PATCH route unit tests
- `tests/unit/api/me/invitations.test.ts`: new file — GET route unit tests

## Risks

- Risk: `username` required change breaks TypeScript compilation for code that constructs `User` objects without `username`.
  - Impact: Build fails until all construction sites are updated.
  - Mitigation: The backfill is already run; grep for `User` construction sites before merging.

- Risk: Batch user lookup (`getUsersByIds`) fetches from `users` collection directly — if a user document is deleted, the inviter username is missing.
  - Impact: `invitedBy` field would be undefined for that entry.
  - Mitigation: Storage method returns `Record<string, string>` — route falls back to `"Unknown user"` for any missing entry (deleted accounts only).

- Risk: Concurrent accept/decline calls for the same membership.
  - Impact: Both could read `invited` status and both attempt to update.
  - Mitigation: `updateMemberStatus` is a single `updateOne` call — last write wins, both callers get a 200. Acceptable for this use case (player clicking twice).

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration:
- PATCH shape uses `{ action: "accept" | "decline" }` (intent vocabulary, not internal status values)
- Idempotency rule confirmed: same action = 200, conflicting action = 409
- `invitedBy` returns username (not userId)
- `getUserById` lives in `storage.ts` (typed); existing `permissions.ts` version stays for auth use

## Non-Goals

- Real-time invitation notifications
- Email notifications on invite/accept/decline
- Invitation expiry
- DM visibility into whether a player has seen the invitation

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
