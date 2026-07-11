## GitHub Issues

- #480

## Why

- Problem statement: `storage.deleteCampaign` only removes the `Campaign` document. It never cleans up the campaign-scoped rows in `parties`, `campaignMembers`, `sessionLogs`, `campaignRolls`, `campaignCharacterShares`, `savedContent`, and `campaignMessages`, so every campaign deletion leaves orphaned data behind in seven collections.
- Why now: Filed as a follow-up while building #474 (auto-create default Party on campaign creation), which adds one more piece of state (the default Party) that becomes orphaned on every delete. Epic: #470.
- Business/user impact: Orphaned rows are invisible to users but accumulate indefinitely in the database, inflate storage/query costs over time, and can resurface as confusing "ghost" data if any future feature queries by `campaignId` without an existence check on the parent campaign.

## Problem Space

- Current behavior: `DELETE /api/campaigns/[id]` → `storage.deleteCampaign(id, userId)` → `campaigns.deleteOne({ id, userId })`. Nothing else is touched.
- Desired behavior: Deleting a campaign also deletes every row in the seven campaign-scoped collections that reference it, leaving no orphaned data.
- Constraints:
  - No MongoDB transactions are used anywhere in this codebase today (confirmed via grep for `startSession`/`withTransaction`); the fix should stay consistent with that and not introduce transactional semantics unilaterally.
  - `storage.deleteCampaign` has a second caller shape: it is also used as a best-effort rollback helper during campaign creation (`app/api/campaigns/route.ts`, `app/api/campaigns/global/[id]/copy/route.ts`) when a later step (`saveParty`/`addMember`) fails. The cascade must not break or meaningfully change behavior for that rollback path.
- Assumptions:
  - "Campaign-scoped" means any collection whose documents carry a `campaignId` field. Surfaced seven: `Party`, `CampaignMember`, `SessionLog`, `CampaignRoll`, `CampaignCharacterShare`, `SavedContent`, `CampaignMessage`.
  - Best-effort (non-transactional) parallel deletes are acceptable, matching the existing precedent in `storage.clear(userId)` (lib/storage.ts:1256), which already does a `Promise.all` of `deleteMany` calls across `parties`, `campaignMembers`, and `campaignCharacterShares` scoped by `userId` for full account deletion.
- Edge cases considered:
  - Campaign has zero children in one or more collections — `deleteMany` matching nothing is a no-op, not an error.
  - `deleteCampaign` called mid-rollback before any children exist yet (e.g. `saveParty` itself failed) — cascade deletes find nothing, harmless.
  - `deleteCampaign` called mid-rollback after `deleteParty` already ran manually (member-add failure path) — cascade re-deletes the same (already-gone) party row, harmless.
  - Partial failure mid-cascade (process crash between deleting some children and others, or before deleting the `Campaign` doc itself) — see ordering decision in design.md.

## Scope

### In Scope

- Update `storage.deleteCampaign` to cascade-delete matching rows in `parties`, `campaignMembers`, `sessionLogs`, `campaignRolls`, `campaignCharacterShares`, `savedContent`, and `campaignMessages` by `campaignId` only — none of these collections are scoped by `userId`, since multi-user campaigns can have rows owned by any member, not just the deleting DM.
- Unit test coverage for the cascade (all seven collections cleaned, ordering, no-op when nothing to clean).

### Out of Scope

- Any UI change. This is a storage-layer fix; the `DELETE /api/campaigns/[id]` route already calls `storage.deleteCampaign` and needs no changes.
- Introducing MongoDB transactions/sessions for atomicity — would be a larger, separate architectural change and isn't used anywhere else in the codebase.
- Auditing or fixing the rollback call sites in `app/api/campaigns/route.ts` / `.../global/[id]/copy/route.ts` beyond confirming the cascade doesn't break them — no behavior change is intended there.
- Soft-delete / history preservation for cascaded rows. Unlike character removal (which sets `leftAt` on party memberships to preserve history), a full campaign delete is a permanent, user-initiated destroy of the whole campaign; there is nothing left to preserve history *for*.

## What Changes

- `lib/storage.ts`: `deleteCampaign(id, userId)` gains a cascade step — a `Promise.all` of `deleteMany` calls against the seven campaign-scoped collections, run before the `campaigns.deleteOne` call.
- `tests/unit/storage/campaigns.test.ts`: new/updated test cases asserting the cascade.

## Risks

- Risk: Non-transactional deletes mean a crash between the cascade and the final `campaigns.deleteOne` (or partway through the cascade's `Promise.all`) can leave the system in an intermediate state.
  - Impact: Low — worst case is a retryable partial cleanup, not silent data corruption. Ordering (children first, `Campaign` doc last) ensures a retry is always possible because the parent campaign still exists as long as any cleanup is incomplete.
  - Mitigation: Document the ordering rationale in design.md; no automatic retry is added in this change since none of the existing delete paths in this codebase have one.
- Risk: `campaignMembers` and `campaignRolls` are accessed as untyped `db.collection(...)` elsewhere in `storage.ts` (no generic type parameter), unlike `Party`/`SessionLog`/`CampaignCharacterShare`.
  - Impact: Cosmetic/type-safety only; does not affect runtime behavior.
  - Mitigation: Match existing style per collection when writing the fix rather than introducing inconsistent typing.

## Open Questions

- Question: none blocking. The scope (all 5 collections vs. just the 2 named in the issue) was already decided during exploration: fix all 5.
  - Needed from: n/a
  - Blocker for apply: no

## Non-Goals

- Transactional atomicity for campaign deletion.
- Any change to how campaigns are created or how the existing rollback helpers call `deleteCampaign`.
- Soft-delete semantics for cascaded rows.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
