# Phase 3 — Cross-user characters into parties

**Goal:** Let players opt their own characters into a campaign, and let the DM pull
those shared characters into the parties they build — even though the DM doesn't
own them.

**Depends on:** Phase 1 (1e access). Benefits from Phase 2 (active members exist),
but the data layer can be built against memberships directly.

## Deliverables (sub-issues)

### 3a. Character sharing (opt-in) — data + player UI
- Add `CampaignCharacterShare` type; create `campaignCharacterShares` collection
  with unique `{campaignId, characterId}`.
- API for a player to share/unshare one of **their** characters into a campaign
  they're an active member of, plus a list endpoint of characters a member has
  shared.
- Player UI: on the campaign (or character) view, choose which characters to share.
- **Depends on:** 1e.
- **Acceptance:** a player can share/unshare only their own characters into
  campaigns they belong to; sharing a character they don't own is rejected.

### 3b. Party builder uses shared characters
- Update the party access rule: the DM may add a `characterId` to a party in a
  campaign if that character is shared into the campaign by an active member (in
  addition to characters the DM owns).
- Party builder UI: surface shared members' characters as selectable, grouped by
  owner; respect soft-delete (`characters_active`).
- **Depends on:** 3a.
- **Acceptance:** DM can add a player's shared character to a campaign party;
  unsharing/removing a member or character handles party membership gracefully;
  DM cannot add an unshared character.
