## GitHub Issues

- #310 (sub-issue of #295)

## Why

- **Problem statement:** Phase 3a delivered the ability for players to share their characters into a campaign. Phase 3b closes the loop: the DM can't yet see or add those shared characters when building a party. The party builder only surfaces DM-owned characters, and no access rule guards against adding unowned, unshared characters.
- **Why now:** 3a is merged and closed. 3b is the unblocked next issue in the Phase 3 epic.
- **Business/user impact:** Without 3b, campaign-level party management is incomplete — the DM can't use player characters in parties, which is the core value proposition of the sharing feature. The campaign context (prompts, session journal) also silently drops player characters from context, making it appear the feature doesn't work.

## Problem Space

- **Current behavior:**
  - `GET /api/parties` and `PUT /api/parties/[id]` only handle DM-owned characters; no validation that a `characterId` is owned by the DM.
  - `GET /api/campaigns/[id]/characters` returns only the *caller's own* shares (filtered by `userId`); a DM calling it gets an empty list.
  - `PartyEditor` fetches `GET /api/characters` (DM-owned only) and shows a flat checkbox list; no awareness of shared characters or campaign context.
  - `fetchCampaignContext` assembles characters from `GET /api/characters` (DM-owned only) and filters by party membership. Shared characters owned by players never appear in the list — they are silently absent from prompt context even if added to a party.
  - When a player unshares a character or is removed from a campaign, active `Party.members[]` entries for that character are not cleaned up.

- **Desired behavior:**
  - DM can add a shared character to a campaign party; attempt to add an unshared character is rejected (403).
  - Party builder shows both DM-owned characters and shared player characters (grouped by owner) when a `campaignId` is set.
  - Unshare and member-removal proactively set `leftAt` on affected party member entries.
  - Shared player characters appear in campaign prompt context when they are active party members.
  - A reactive guard in `fetchCampaignContext` filters out any character whose share is no longer active (defense-in-depth).

- **Constraints:**
  - A full-scan of `parties` by `campaignId` is acceptable for now, but the query must be logged with timing to establish an observability baseline.
  - The enriched DM GET endpoint must include character metadata (name, type, owner userId) to avoid a second round-trip in the party builder UI.
  - Access rule logic must live in a testable helper (`canAddToCampaignParty`), not inline in the route.

- **Assumptions:**
  - "Active member" means `CampaignMember.status === 'active'`. An `invited` member's shared characters are not usable in parties until they accept.
  - `characters_active` semantics are enforced via `Character.deletedAt` check — soft-deleted characters are excluded from the enriched share list.
  - The `campaignCharacterShares` collection already has a unique `{campaignId, characterId}` index (delivered by 3a).

- **Edge cases considered:**
  - Character shared by a player who later leaves or is removed → proactive `leftAt` on party entry; reactive guard in context loader.
  - Character soft-deleted by its owner after being shared → excluded by `deletedAt` check in enriched GET and context loader.
  - DM tries to add a character they own to a campaign party (already valid path) → no regression; the access rule allows DM-owned characters unconditionally.
  - Party has no `campaignId` → access rule skips the share check; DM-owned characters only (existing behavior preserved).
  - Member removal cascades to multiple shared characters → all are cleaned up in a single pass.

## Scope

### In Scope

- New `storage.listAllSharesForCampaign(campaignId)` — all shares, no userId filter
- New `storage.loadPartiesByCampaign(campaignId)` — parties filtered by `campaignId`, with timing log
- New `storage.setPartyMemberLeftAt(campaignId, characterId, timestamp)` — proactive cleanup helper
- New `storage.canAddToCampaignParty(campaignId, characterId, dmUserId)` — access rule helper
- Extend `GET /api/campaigns/[id]/characters` — when caller is DM, return enriched `{ share, character }[]` for all active shares
- Extend `PUT /api/parties/[id]` — call `canAddToCampaignParty` for each new character when party has a `campaignId`
- Extend `POST /api/parties` — same access rule on creation
- Extend `DELETE /api/campaigns/[id]/characters/[cid]` — after unshare, call `setPartyMemberLeftAt`
- Extend `DELETE /api/campaigns/[id]/members/[userId]` — after member removal, cascade `setPartyMemberLeftAt` for all their shares
- Update `PartyEditor` — when `campaignId` selected, fetch shared characters and render grouped by owner; respect soft-delete
- Update `fetchCampaignContext` — merge shared characters; reactive guard filters unshared characters
- Unit tests for all new storage helpers and access rule
- Route-level tests for the modified endpoints

### Out of Scope

- Adding a `campaignId` index to `parties` collection (acceptable tech debt, noted for future)
- Player-facing UI changes (already delivered in 3a)
- Transfer of character ownership
- Party management within the campaign page itself (separate feature)

## What Changes

- `lib/storage.ts` — 4 new storage methods
- `app/api/campaigns/[id]/characters/route.ts` — GET extended with DM enriched view
- `app/api/parties/route.ts` — POST access rule added
- `app/api/parties/[id]/route.ts` — PUT access rule added
- `app/api/campaigns/[id]/characters/[cid]/route.ts` — DELETE triggers party cleanup
- `app/api/campaigns/[id]/members/[userId]/route.ts` — DELETE cascades party cleanup
- `app/parties/page.tsx` — PartyEditor fetches and renders shared characters
- `lib/utils/campaignContext.ts` — merges shared characters; reactive filter
- `lib/types.ts` — new `SharedCharacterEntry` type for enriched GET response
- New test files for storage helpers and updated route tests

## Risks

- Risk: Full-scan of `parties` by `campaignId` is O(n) over all parties in the system.
  - Impact: Slow cleanup on large datasets; not a concern for current scale.
  - Mitigation: Log query timing in `loadPartiesByCampaign` and `setPartyMemberLeftAt`. Add a note in code to revisit with an index if timing exceeds 50ms.

- Risk: Cascade cleanup in member-removal route makes an HTTP response depend on a secondary write that could fail.
  - Impact: Member removed but party entries not cleaned up.
  - Mitigation: Log and swallow cleanup errors — don't fail the removal response. The reactive guard in `fetchCampaignContext` is the safety net.

- Risk: DM-enriched GET exposes player character metadata (name, type) to the DM.
  - Impact: Minimal — DM is the campaign owner; this is intentional and consistent with existing DM access to campaign members.
  - Mitigation: None needed.

## Open Questions

No unresolved ambiguity. All design decisions were made during exploration:
- Enriched list (not bare share IDs) for DM GET: confirmed.
- Access rule in a `canAddToCampaignParty` helper: confirmed.
- Full-scan with timing observability (no index for now): confirmed.

## Non-Goals

- Real-time push notification when a share is revoked
- Bulk party management across multiple campaigns
- Exposing `setPartyMemberLeftAt` as a standalone API endpoint

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
