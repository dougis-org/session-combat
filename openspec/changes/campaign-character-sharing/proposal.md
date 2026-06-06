## GitHub Issues

- #309
- #295 (parent epic)

## Why

- **Problem statement:** Players in a multi-user campaign have no way to make their own characters available to the DM for party building. The DM can only add characters they personally own to a party.
- **Why now:** Phase 1 (campaign members collection, issue 1e) is complete. The `campaignMembers` collection and active-member concept are in place, giving us the guard condition (active membership) that character sharing requires.
- **Business/user impact:** Without character sharing, multiplayer campaigns are blocked — the DM cannot build parties that include player characters.

## Problem Space

- **Current behavior:** A DM can only add characters they own to a party. No mechanism exists for a player to contribute their characters to a campaign.
- **Desired behavior:** A player who is an active member of a campaign can opt specific characters in or out of that campaign. Shared characters become available to the DM for party building (handled in 3b).
- **Constraints:**
  - Character ownership is immutable — there is no transfer mechanism. A `CampaignCharacterShare` record always belongs to the character's owner.
  - The unique index on `{campaignId, characterId}` enforces that a character can appear in a campaign at most once, regardless of who shared it.
  - Only active members may share; invited/declined/removed members cannot.
- **Assumptions:**
  - `1e` is fully merged: `campaignMembers` collection, `getMember`, `addMember`, `updateMemberStatus`, `listMembersForCampaign` are all available in `storage`.
  - Characters are soft-deleted via `characters_active` — the share API does not need to validate liveness (that is a 3b concern for the party builder).
- **Edge cases considered:**
  - Player tries to share a character they don't own → 403.
  - Player tries to share into a campaign where they are not an active member → 403.
  - Player shares the same character twice → 409 (duplicate).
  - Player unshares a character that was already added to a party by the DM → cleanup is out of scope for 3a; handled reactively in 3b.

## Scope

### In Scope

- `CampaignCharacterShare` type in `lib/types.ts`
- `campaignCharacterShares` MongoDB collection with unique index on `{campaignId, characterId}`
- `DuplicateShareError` in `lib/errors.ts`
- Storage methods: `addShare`, `removeShare`, `listSharesForCampaign`
- API routes under `app/api/campaigns/[id]/characters/`:
  - `POST /api/campaigns/[id]/characters` — share a character
  - `GET /api/campaigns/[id]/characters` — list caller's shares in this campaign
  - `DELETE /api/campaigns/[id]/characters/[cid]` — unshare a character
- Player UI on the campaign view: a panel showing the player's own characters with share toggles (visible only to players, not DMs)
- Unit tests (RTL for UI, Jest for routes and storage methods)

### Out of Scope

- Party builder changes (3b)
- Cleanup of party entries on unshare (3b)
- DM visibility of shared characters (3b)
- Character ownership transfer
- Sharing characters across multiple campaigns in a single action

## What Changes

- `lib/types.ts` — add `CampaignCharacterShare` interface
- `lib/errors.ts` — add `DuplicateShareError`
- `lib/storage.ts` — add `addShare`, `removeShare`, `listSharesForCampaign` to the storage interface and MongoDB implementation; register `campaignCharacterShares` collection in `initializeDatabase()`
- `app/api/campaigns/[id]/characters/route.ts` — POST and GET handlers
- `app/api/campaigns/[id]/characters/[cid]/route.ts` — DELETE handler
- `app/campaigns/` UI — add character-sharing panel to campaign view (player-only)
- Tests for all of the above

## Risks

- **Risk:** `listSharesForCampaign` leaks shares from other users if the GET route does not filter by `auth.userId`
  - **Impact:** Player A sees Player B's shared characters
  - **Mitigation:** GET filters by `{ campaignId, userId: auth.userId }` — list endpoint returns only the caller's own shares

- **Risk:** DELETE route could allow a player to unshare another player's character by guessing the `characterId`
  - **Impact:** Denial of service against another player's campaign participation
  - **Mitigation:** DELETE handler verifies `character.userId === auth.userId` before calling `removeShare`

- **Risk:** Share record persists after the character is deleted (soft or hard)
  - **Impact:** Stale share in `listSharesForCampaign`; minor UI noise in 3a, more significant in 3b
  - **Mitigation:** Out of scope for 3a; 3b adds reactive filtering. Acceptable for now.

## Open Questions

No unresolved ambiguity remains. All design questions were resolved during exploration:
- Route shape: Option A (`/api/campaigns/[id]/characters`) — confirmed
- Uniqueness constraint: `{campaignId, characterId}` (no ownership transfer) — confirmed
- UI placement: campaign view — confirmed
- Unshare mechanism: `DELETE /api/campaigns/[id]/characters/[cid]` by characterId — confirmed

## Non-Goals

- Notifying the DM when a player shares a character
- Bulk share/unshare operations
- Share expiry or time-limited sharing
- Sharing characters into campaigns the player is not a member of

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
