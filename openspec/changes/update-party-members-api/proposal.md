## GitHub Issues

- #471
- #470 (Epic)

## Why

- Problem statement: Currently, players cannot directly add or remove their characters to/from a campaign party. They must share them with the campaign and rely on the GM to manage party members.
- Why now: Part of the Epic to move to party-centric character sharing.
- Business/user impact: Streamlines the player experience by giving them direct control over which parties their characters participate in.

## Problem Space

- Current behavior: Party membership updates are handled by the GM via the full party update PUT endpoint.
- Desired behavior: Players can directly manage their characters' presence in a specific party within a campaign.
- Constraints: 
  - Cannot expose GM-only fields or other players' characters for modification.
  - Characters can be in multiple parties simultaneously.
- Assumptions:
  - Caller must be an active member of the campaign.
  - The party must belong to the campaign.
- Edge cases considered:
  - Modifying another player's characters (prevented by design).
  - Adding characters not owned by the player (prevented by ownership checks).
  - Removing a character (tracked via `leftAt` timestamp rather than physical deletion).

## Scope

### In Scope

- Creating a new endpoint `PUT /api/campaigns/[campaignId]/members/[memberId]/parties/[partyId]`.
- Validating campaign membership, party existence, and character ownership.
- Merging player-provided characters with the existing party members, updating `addedAt` and `leftAt`.

### Out of Scope

- Deprecating the `CampaignCharacterShare` abstraction (tracked elsewhere).
- Modifying UI components (unless explicitly required, assuming API focus for now).

## What Changes

- Addition of a new API route `app/api/campaigns/[id]/members/[memberId]/parties/[partyId]/route.ts`.
- Use of `loadCharacters` to validate character ownership before updating the party.

## Risks

- Risk: Accidental overwriting of other players' party membership data.
  - Impact: Data loss / poor user experience.
  - Mitigation: The update logic will only mutate the subset of characters belonging to the specific `memberId` and preserve the rest.

## Open Questions

- Question: None at this time. All questions resolved during exploration.
  - Needed from: N/A
  - Blocker for apply: no

## Non-Goals

- Refactoring the entire party data model.
- Restricting characters to a single party.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
