## GitHub Issues

- dougis-org/session-combat#305
- dougis-org/session-combat#294 (parent epic)

## Why

- Problem statement: DMs cannot yet invite players to a campaign. The campaign exists but membership is restricted to the DM owner, making multi-user campaigns non-functional.
- Why now: Phase 1 (1c user search, 1d members collection, 1e access guards) is complete. Issue #305 is the first deliverable of Phase 2 and unblocks 2b (accept/decline), 2c (member management UI), and 2d (player inbox UI).
- Business/user impact: Without an invite API, the multi-user campaign feature cannot be used at all. This is the entry point for the entire invite/accept flow.

## Problem Space

- Current behavior: `POST /api/campaigns` creates a campaign and seeds the creator as an `active` DM member. No route exists to invite additional users. `CampaignMember` stores `invitedBy`, `invitedAt`, and `respondedAt` as flat scalar fields.
- Desired behavior: A DM can POST a `userId` to `/api/campaigns/[id]/members` to invite a player. If the target user has a prior `declined` or `removed` membership, the invite resets their status (upsert). Active or already-invited members are rejected. All membership transitions are recorded in an append-only `history` array on `CampaignMember`.
- Constraints: `userId` is resolved from username search (Phase 1c) before the POST; this endpoint accepts `userId` directly and does not perform username resolution itself. No email or push notification in this phase.
- Assumptions: No existing data in `campaignMembers` collection — no DB migration required for schema changes. `getMember` and `loadCampaignByIdAny` storage methods already exist (Phase 1e).
- Edge cases considered: self-invite; inviting an already-active member; inviting an already-invited member; re-inviting a declined member; re-inviting a removed member; non-DM attempting to invite; invalid `userId` (user does not exist).

## Scope

### In Scope

- `MemberStatus` type updated to `"active" | "invited" | "declined" | "removed"` (drops `"pending"`, adds `"removed"`)
- New `MemberHistoryEntry` interface: `{ action: MemberStatus; by: string; at: Date }`
- `CampaignMember` interface updated: remove `invitedBy`, `invitedAt`, `respondedAt`; add `history: MemberHistoryEntry[]`
- `storage.updateMember` replaced by `storage.updateMemberStatus(campaignId, userId, status, actorId)` — atomically `$set status` and `$push` a history entry
- `storage.addMember` callers updated to pass `history: [...]` instead of flat fields
- DM owner seed in `app/api/campaigns/route.ts` updated to match new schema
- New route `app/api/campaigns/[id]/members/route.ts` — `POST` handler
- Existing `addMember` unit tests updated for new schema
- New unit tests for the POST route (all guard branches + all three upsert branches)

### Out of Scope

- Accept/decline endpoint (issue #306)
- Member removal (issue #307)
- Invitations inbox UI (issue #308)
- Email or push notifications for invites
- Username resolution (Phase 1c already handles this upstream of this endpoint)
- Role changes (DM/player promotion/demotion)

## What Changes

- `lib/types.ts`: `MemberStatus`, new `MemberHistoryEntry` interface, `CampaignMember` shape
- `lib/storage.ts`: replace `updateMember` with `updateMemberStatus`; no signature change to `addMember`
- `app/api/campaigns/route.ts`: update DM owner seed (line ~51)
- `app/api/campaigns/[id]/members/route.ts`: new file
- `tests/unit/storage/campaignMembers.test.ts` (or equivalent): update for new schema
- New test file: `tests/unit/api/campaigns/[id]/members/route.unit.test.ts`

## Risks

- Risk: `updateMember` replacement breaks consumers
  - Impact: Low — `updateMember` has zero application call sites; only defined in storage.ts
  - Mitigation: Verified via grep before design; safe to replace
- Risk: Schema change affects other Phase 2 sub-issues (2b, 2c, 2d)
  - Impact: Medium — those issues depend on `CampaignMember` shape
  - Mitigation: History-list schema is strictly more capable; downstream issues benefit from it. Phase doc updated to reflect the design.
- Risk: `$push` + `$set` not atomic in MongoDB without a transaction
  - Impact: Low — a history entry missing the status update (or vice versa) would be inconsistent, but both ops are in a single `updateOne` with a combined update document (`{ $set: ..., $push: ... }`), which MongoDB applies atomically at the document level.
  - Mitigation: Use a single `updateOne` call with both operators in one update document.

## Open Questions

No unresolved ambiguity. All design decisions were resolved during exploration:
- `"invited"` chosen over `"pending"` (no existing data, spec uses `"invited"`)
- `"removed"` added to `MemberStatus` now (needed for re-invite path; actual removal endpoint deferred to 2c)
- `history: MemberHistoryEntry[]` replaces flat scalar fields
- `action: MemberStatus` (state transitioned to) rather than a separate verb vocabulary
- Response shape: `201 { id, status }` (not the full document)

## Non-Goals

- Bulk invite
- Invite by email
- Invite links / tokens
- Rate limiting on invites (can be added later)
- Notifications of any kind

## Change Control

If scope changes after proposal approval, update `openspec/changes/invite-api/proposal.md`,
`openspec/changes/invite-api/design.md`, `openspec/changes/invite-api/specs/**/*.md`,
and `openspec/changes/invite-api/tasks.md` before implementation starts.
