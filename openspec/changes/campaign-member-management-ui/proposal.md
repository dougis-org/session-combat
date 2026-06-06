## GitHub Issues

- #307
- #294 (parent epic: Phase 2 — Invite & accept flow)

## Why

- **Problem statement:** The campaign page does not exist as a standalone route. There is no UI for a DM to see who is in their campaign, invite new players by username, or remove a member. The invite API (2a, #305) was shipped with no corresponding frontend.
- **Why now:** Issue #305 (2a) is closed. The invite API is live. The UI is the logical next step to make the feature usable.
- **Business/user impact:** Without this UI, DMs cannot manage campaign membership from the browser. The multi-user campaigns feature is blocked for real use until members can be invited and removed.

## Problem Space

- **Current behavior:** No `app/campaigns/[id]/page.tsx` exists. Campaign sub-pages (sessions, prompts, combat, library) exist but there is no campaign home. Members can be invited only via direct API calls.
- **Desired behavior:** Navigating to `/campaigns/[id]` shows a campaign home page with a full member management panel: member list with role/status badges, username search, invite action, pending-invite highlights, and remove-member (DM only).
- **Constraints:**
  - Must follow `lib/components` + Tailwind semantic-token conventions used across the app.
  - Member `userId` is stored but not `username`; enrichment requires a `$in` lookup against the `users` collection in the GET members API.
  - Remove is a soft-delete: sets `status: "removed"` via `updateMemberStatus`, not a hard delete.
  - Only the DM (role `dm`, status `active`) may invite or remove. Non-DMs see the list read-only.
  - DM cannot remove themselves.
- **Assumptions:**
  - Any active campaign member (not just DM) may read the member list.
  - `GET /api/campaigns/[id]` already exists and returns campaign details (name, etc.).
  - Username search results exclude the searching user (already enforced by `users/search` route).
  - 2b (#306) accept/decline API is not yet built; invited members stay `invited` until 2b ships.
- **Edge cases considered:**
  - Re-inviting a `removed` or `declined` member (handled by 2a upsert — UI just calls POST).
  - Inviting a user who is already `active` or `invited` → API returns 409; UI shows inline error.
  - DM tries to remove themselves → blocked at API level and disabled in UI.
  - Empty search query → no results shown, no API call made.
  - Campaign not found or user not a member → 403/404 → redirect or error banner.

## Scope

### In Scope

- `GET /api/campaigns/[id]/members` — list all members enriched with usernames
- `DELETE /api/campaigns/[id]/members/[userId]` — DM-only soft-delete to `status: "removed"`
- `app/campaigns/[id]/page.tsx` — campaign home page with member management UI
- Add a "Members" link on each campaign card in `app/campaigns/page.tsx`

### Out of Scope

- Accept/decline flow (2b, 2d — separate issues)
- Real-time member list updates (Phase 4)
- Role changes (no spec for promoting/demoting members)
- Pagination of member list (campaigns are small; full list is fine)
- Email notifications on invite

## What Changes

- **New file:** `app/api/campaigns/[id]/members/route.ts` — add `GET` handler alongside existing `POST`
- **New file:** `app/api/campaigns/[id]/members/[userId]/route.ts` — `DELETE` handler
- **New file:** `app/campaigns/[id]/page.tsx` — campaign home/members page
- **Modified:** `app/campaigns/page.tsx` — add Members link per campaign card

## Risks

- Risk: `$in` username enrichment adds a second DB round-trip on every member list load.
  - Impact: Minor latency; campaigns have small membership so query is bounded.
  - Mitigation: No pagination needed; acceptable for current scale.

- Risk: No `app/campaigns/[id]/layout.tsx` exists, so there is no shared nav between sub-pages.
  - Impact: Users navigating to `/campaigns/[id]` have no tab bar linking to sessions/combat/etc.
  - Mitigation: This issue scopes only the members page. Cross-sub-page nav is out of scope.

- Risk: Invited members show as `invited` indefinitely until 2b ships.
  - Impact: UX shows a pending badge with no way to accept in-app yet.
  - Mitigation: Badge is informational; 2d will add the player inbox. Not a blocker.

## Open Questions

No unresolved ambiguity. All design decisions confirmed in pre-proposal exploration:
- UI location: `app/campaigns/[id]/page.tsx` ✓
- Remove verb: `DELETE /api/campaigns/[id]/members/[userId]` ✓
- Username enrichment: `$in` lookup in GET handler ✓

## Non-Goals

- Building the player invitations inbox (2d, #308)
- Building accept/decline API (2b, #306)
- Adding a shared campaign layout/tab bar
- Hard-deleting members from the database

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
