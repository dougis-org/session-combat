## GitHub Issues

- dougis-org/session-combat#303
- dougis-org/session-combat#293 (parent epic — Phase 1: Identity & membership foundations)

## Why

- Problem statement: Campaigns currently model ownership via a single `userId` field. There is no way to express that a campaign has multiple participants (DM + players), which is a prerequisite for the multi-user campaign feature.
- Why now: Issue 303 is the dependency-free leaf of Phase 1. Issues 1e (`assertCampaignAccess`) and all Phase 2+ work block on this collection existing.
- Business/user impact: Unblocks the entire multi-user campaign initiative. Without membership records, players cannot be invited, access cannot be scoped, and collaborative play cannot ship.

## Problem Space

- Current behavior: A `Campaign` document has a single `userId` (the owner). Campaign reads and writes are gated solely on `{ id, userId }` ownership.
- Desired behavior: A `campaignMembers` collection records every participant with a role (`dm` | `player`) and status (`active` | `pending` | `declined`). On campaign creation the owner is automatically seeded as an `active` `dm` member.
- Constraints:
  - Must not break existing campaign CRUD (owner-only access stays intact for now; 1e handles access refactor).
  - Index must enforce uniqueness of `{campaignId, userId}` at the DB layer.
  - Duplicate membership attempts must surface a typed `DuplicateMemberError` (not a raw Mongo error).
- Assumptions:
  - The `users` sparse unique index on `username` (issue 1a) is not required here — member lookup is by `userId`.
  - `invitedBy` is always a valid userId; referential integrity is application-enforced, not DB-enforced.
- Edge cases considered:
  - Campaign creation failure after `saveCampaign` but before `addMember` — member seeding must be idempotent or wrapped in error handling at the call-site.
  - Calling `addMember` twice for the same `{campaignId, userId}` pair must throw `DuplicateMemberError`.
  - `updateMember` on a non-existent member should be a no-op (or throw — chosen: no-op, caller is responsible for validating membership first).

## Scope

### In Scope

- `CampaignMember` type, `MemberRole` enum (`MEMBER_ROLES` const tuple), `MemberStatus` type, `CampaignMemberSummary` type in `lib/types.ts`
- `DuplicateMemberError` in `lib/errors.ts` (new file)
- `campaignMembers` collection unique index `{campaignId, userId}` in `lib/db.ts`
- Four storage methods on the `storage` object in `lib/storage.ts`: `addMember`, `updateMember`, `listMembersForCampaign`, `listCampaignsForMember`
- DM membership seeding in `app/api/campaigns/route.ts` POST handler
- Unit tests in `tests/unit/storage/campaigns.members.test.ts`
- Integration tests in `tests/integration/campaigns.members.integration.test.ts`

### Out of Scope

- Member-aware access control (`assertCampaignAccess`) — that is issue 1e / #304
- Invite flow, accept/decline endpoints — Phase 2
- Removing a member / leaving a campaign
- UI changes
- Backfilling `campaignMembers` records for existing campaigns (deferred; 1e will handle via migration or access-check fallback)

## What Changes

- `lib/types.ts`: add `MEMBER_ROLES`, `MemberRole`, `MemberStatus`, `CampaignMember`, `CampaignMemberSummary`
- `lib/errors.ts`: new file, exports `DuplicateMemberError`
- `lib/db.ts`: create unique compound index on `campaignMembers.{campaignId, userId}` inside `initializeDatabase`
- `lib/storage.ts`: four new methods (`addMember`, `updateMember`, `listMembersForCampaign`, `listCampaignsForMember`)
- `app/api/campaigns/route.ts`: seed DM membership after `saveCampaign` in POST handler
- Two new test files (unit + integration)

## Risks

- Risk: Campaign creation becomes a two-write operation; if `addMember` throws unexpectedly, the campaign exists without a DM member record.
  - Impact: Medium — 1e's access check will deny the owner access to their own campaign.
  - Mitigation: Wrap both writes in the route handler's try/catch and consider deleting the campaign on `addMember` failure, or use idempotent retry logic.

- Risk: `DuplicateMemberError` detection depends on MongoDB error code 11000 (duplicate key); driver version changes could affect this.
  - Impact: Low — mongo driver is locked in package-lock.json.
  - Mitigation: Test the duplicate rejection path in integration tests against the real DB.

## Open Questions

No unresolved ambiguity exists. All design decisions were resolved during exploration:
- `MemberRole` as a `const` tuple enum (matching `CAMPAIGN_STATUSES` pattern) — confirmed.
- `listCampaignsForMember` returns `CampaignMemberSummary[]` (`{ id, name }`) — confirmed.
- Typed `DuplicateMemberError` — confirmed.
- `updateMember` uses named params (not a patch object) — confirmed.
- Seeding at the API route call-site (Option B) — confirmed.
- Test files scoped to `campaigns.members.*`, not merged into existing campaign test files — confirmed.

## Non-Goals

- Full multi-user RBAC system
- Campaign ownership transfer
- Member permissions beyond `dm` / `player` role distinction
- Real-time membership updates (WebSocket / polling)

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
