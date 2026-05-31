# Phase 2 — Invite & accept flow

**Goal:** Let a DM find users by username and invite them; let invited users accept
or decline. Membership only becomes `active` on acceptance.

**Depends on:** Phase 1 (1c search, 1d members, 1e access).

## Deliverables (sub-issues)

### 2a. Invite API
- `POST /api/campaigns/[id]/members` — DM-only — creates a `CampaignMember` with
  status `invited` for a given `userId` (resolved from username search).
- Guards: caller must be the campaign DM; cannot invite an existing
  active/invited member; cannot invite self.
- **Depends on:** 1c, 1d, 1e.
- **Acceptance:** DM can invite a user by username; duplicates and self-invites
  rejected; non-DM cannot invite.

### 2b. Accept / decline API + invitations inbox
- `POST /api/campaigns/[id]/members/respond` (or `PATCH .../members/me`) for the
  invited user to set status `active` or `declined`; stamps `respondedAt`.
- `GET /api/me/invitations` listing the caller's pending invites.
- **Depends on:** 1d.
- **Acceptance:** invited user can accept (→ active member) or decline; inbox lists
  only the caller's pending invites; others cannot respond on their behalf.

### 2c. Campaign member-management UI
- On the campaign page: member list with roles/status, a username search box, and
  an invite action; pending-invite badges; DM can remove a member
  (status `removed`).
- **Depends on:** 2a.
- **Acceptance:** DM can search, invite, see pending/active members, and remove a
  member; follows existing `lib/components` + Tailwind semantic-token conventions.

### 2d. Player invitations inbox UI
- A surface (nav badge + page/panel) where a player sees pending campaign invites
  and accepts/declines.
- **Depends on:** 2b.
- **Acceptance:** player sees invites, can accept/decline, and the campaign appears
  in their campaign list once accepted.
