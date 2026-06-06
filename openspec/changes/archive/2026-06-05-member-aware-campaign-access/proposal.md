## GitHub Issues

- #304
- #293 (parent epic)

## Why

- Problem statement: Campaign read routes gate access by `userId === campaign.userId` (owner check), so player members added via the `campaignMembers` collection in issue #303 cannot read campaigns they have been invited to. They hit 404 on every GET.
- Why now: Issue #303 (1d) landed the `campaignMembers` collection and storage methods; #304 is the next sub-issue in Phase 1 and the access layer must follow before any player-facing UI can be built.
- Business/user impact: Without this, the multi-user campaigns initiative is blocked — players cannot load any campaign data despite being valid members.

## Problem Space

- Current behavior: `loadCampaignById(id, userId)` queries `{ id, userId }` — only the document owner matches. All campaign sub-routes (`/sessions`, `/combat-events`) use the same owner-only pattern. Write routes (PATCH, DELETE, POST) have no role distinction because there was only ever one role.
- Desired behavior: Any `active` campaign member (DM or player) can read campaign data. Write operations remain DM-only. Non-members receive 404 (no information leakage about campaign existence).
- Constraints: Owner is already seeded as an `active` DM member in `campaignMembers` (per #303), so membership is the single authoritative gate — no special-casing needed for owners.
- Assumptions: Only `status === 'active'` members are granted access. `pending` and `declined` members are treated identically to non-members.
- Edge cases considered:
  - Campaign document exists but has no membership record (legacy data or bug): returns 404.
  - Member record exists but campaign doc is missing: returns 404.
  - Player attempts a DM-only write: returns 404 (not 403, to avoid leaking role info).

## Scope

### In Scope

- New storage method `getMember(campaignId, userId): Promise<CampaignMember | null>`
- New storage method `loadCampaignByIdAny(id: string): Promise<Campaign | null>` (no userId filter)
- New `assertCampaignAccess(campaignId, userId)` utility in `lib/utils/campaign.ts` returning `{ campaign, role } | NextResponse`
- Refactor all routes under `app/api/campaigns/[id]/**`:
  - GET routes: use `assertCampaignAccess` (any active member)
  - Write routes (PATCH, DELETE, POST, sessions PATCH): use `assertCampaignAccess` + `role === 'dm'` check
- Unit tests for `assertCampaignAccess` and the two new storage methods
- Integration/route tests covering player-can-read, non-member-gets-404, player-write-gets-404, DM-write-succeeds

### Out of Scope

- Invite/accept flow (Phase 2)
- Exposing member role in API response bodies
- Frontend changes
- Any route outside `app/api/campaigns/[id]/**`

## What Changes

- `lib/storage.ts`: add `getMember` and `loadCampaignByIdAny`
- `lib/utils/campaign.ts`: add `assertCampaignAccess`; existing `sanitizeChapters` / `sanitizeCurrentChapterId` unchanged
- `app/api/campaigns/[id]/route.ts`: replace `findCampaign` calls with `assertCampaignAccess`; add DM check on PATCH and DELETE
- `app/api/campaigns/[id]/sessions/route.ts`: replace `loadCampaignById` guard with `assertCampaignAccess`; add DM check on POST
- `app/api/campaigns/[id]/sessions/[sessionId]/route.ts`: add `assertCampaignAccess` + DM check on PATCH (currently ungated at the campaign level)
- `app/api/campaigns/[id]/combat-events/route.ts`: add `assertCampaignAccess` gate on GET (query still filters by `auth.userId` — players see their own events only)

## Risks

- Risk: `loadCampaignByIdAny` bypasses the userId ownership filter — any code that calls it without a prior membership check would leak data.
  - Impact: Medium — wrong caller could expose campaign docs to arbitrary users.
  - Mitigation: Keep `loadCampaignByIdAny` private to the storage layer; only `assertCampaignAccess` calls it. Name signals intent.

- Risk: Legacy campaigns that predate `campaignMembers` seeding will be inaccessible even to their owners.
  - Impact: High if any such campaigns exist in production.
  - Mitigation: The owner-seeding in #303 must backfill existing campaigns. Confirm backfill migration ran before deploying this change.

## Open Questions

- No unresolved ambiguity exists. All design decisions were confirmed during explore session: sessions sub-routes in scope, Path B (assertCampaignAccess + role check) for writes, 404 for non-members, return type follows existing `X | NextResponse` pattern.

## Non-Goals

- Granting players write access to any resource (deferred to per-feature decisions in later phases)
- Exposing membership metadata (roles, member lists) via campaign read endpoints
- Changing how `loadCampaignById` behaves for existing callers outside the campaign routes

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
