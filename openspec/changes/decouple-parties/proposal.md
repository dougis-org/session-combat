## GitHub Issues

- dougis-org/session-combat#603

## Why

- Problem statement: Parties are currently tightly coupled to a single campaign (`campaignId` property on Party). When a campaign is deleted or archived, all associated parties are deleted as well.
- Why now: Users are finding that they cannot reuse parties across campaigns or keep a party around after finishing a campaign.
- Business/user impact: Allows players and DMs to form persistent adventuring parties that can transcend single campaigns, supporting "living world" or shared universe playstyles.

## Problem Space

- Current behavior: `Party` documents contain a `campaignId: string` field. `storage.deleteCampaign()` cascades and deletes all parties with that `campaignId`.
- Desired behavior: `Party` should be an independent entity. `Campaign` should store references to the parties involved in it (`partyIds: string[]`), making the campaign the host and the party a decoupled participant.
- Constraints: Must not break existing campaign loading or party listings.
- Assumptions: A party can exist with 0 campaigns. A party can be associated with multiple campaigns sequentially or simultaneously.
- Edge cases considered: Removing a party from a campaign should just remove the ID from `partyIds` on the Campaign, leaving the Party document intact.

## Scope

### In Scope

- Migrating the `campaignId` off the `Party` model to `partyIds` on the `Campaign` model.
- Updating `storage.deleteCampaign` to stop deleting parties.
- Updating `loadPartiesByCampaign` to fetch parties using `Campaign.partyIds`.
- Updating any API routes or UI components that currently rely on `party.campaignId`.

### Out of Scope

- Creating a new UI for managing multi-campaign parties (unless required to not break existing flows).
- Merging existing duplicate parties across campaigns.

## What Changes

- `Campaign` interface: Add `partyIds?: string[]`.
- `Party` interface: Deprecate/remove `campaignId?: string`.
- Storage layer:
  - `storage.deleteCampaign`: Remove `db.collection<Party>("parties").deleteMany({ campaignId: id })`.
  - `loadPartiesByCampaign`: Fetch campaign by ID, extract `partyIds`, then query parties by those IDs.
- API layer: Adjust party creation/association logic to update `Campaign.partyIds` instead of setting `Party.campaignId`.

## Risks

- Risk: Data migration issues for existing campaigns.
  - Impact: Existing campaigns might lose sight of their parties if not migrated properly.
  - Mitigation: Add fallback or migration logic in `loadPartiesByCampaign` to read legacy `campaignId` from the Party if `partyIds` on the Campaign is empty, and automatically populate the Campaign.

## Open Questions

- Question: Do we need a script to backfill `partyIds` into `Campaign` documents, or is lazy migration (e.g. read legacy `Party.campaignId` if `partyIds` is empty) sufficient?
  - Needed from: Requester
  - Blocker for apply: no

## Non-Goals

- Complete overhaul of the party management UI.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
