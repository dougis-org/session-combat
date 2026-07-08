## GitHub Issues

- #472
- #470 (Epic)
- #471 (dependency, merged)

## Why

- Problem statement: Players cannot directly choose which of their own characters join a given party within a campaign. The only self-service endpoint for this (`PUT /api/campaigns/{id}/members/{userId}/parties/{partyId}`, added in #471) is unreachable from the UI today because nothing renders it, and there is no way for a non-owner campaign member to even discover which parties exist in the campaign.
- Why now: #471 (the backend) is merged and unused. Completing #472 is the last functional piece blocking the party-centric sharing epic (#470) before `CampaignCharacterShare` can be deprecated in #473.
- Business/user impact: Removes the DM as a required intermediary for players joining a party's roster, matching the target UX described in the epic.

## Problem Space

- Current behavior:
  - `SharedCharactersPanel` exists but is not rendered anywhere in the app (dead code) and operates on the old `CampaignCharacterShare` model.
  - `useCampaignContext` fetches `/api/parties`, which is scoped to `storage.loadParties(auth.userId)` — parties the caller **owns**. A player who is an active campaign member but not the party's creator never sees that party, so they have no `partyId` to act on.
  - `PUT /api/campaigns/{id}/members/{userId}/parties/{partyId}` (merged, #471) already supports self-service updates: caller must be the target member or an active DM, and only characters the target member owns may be added.
- Desired behavior: Any active campaign member can see every party in that campaign and independently choose which of their own characters are active members of each one.
- Constraints:
  - Must not expose or let a player modify another player's characters within a party.
  - A campaign may contain multiple parties; a character may be an active member of more than one party in the same campaign at once — each party's membership is independent.
  - Must not change authorization or behavior of the existing PUT endpoint from #471.
- Assumptions:
  - Caller must be an active member (any role) of the campaign to list its parties.
  - The existing `PartyMember` history model (`addedAt`/`leftAt`) is sufficient and unchanged.
- Edge cases considered:
  - Campaign has zero parties yet (panel section shows empty/no-parties state).
  - Player has zero characters (panel shows a message, no crash).
  - Player is not an active member of the campaign (no parties returned, panel does not render or shows nothing to join).
  - Toggling a character while a previous toggle's PUT is in flight for the same party (must not race / clobber the in-flight request's payload).

## Scope

### In Scope

- New route `GET /api/campaigns/{id}/parties` returning all parties for that campaign (`storage.loadPartiesByCampaign`), gated on the caller being an active member of the campaign (any role).
- New UI section on the campaign page rendering one panel per party in the campaign, each showing a multi-select of the current player's own characters with checkboxes reflecting active (`!leftAt`) membership in that specific party.
- Wiring the new panel's toggle handler to `PUT /api/campaigns/{id}/members/{userId}/parties/{partyId}` (existing, #471), sending the full set of the player's currently-checked character IDs for that one party per request.

### Out of Scope

- Deleting or modifying `SharedCharactersPanel.tsx` or any `CampaignCharacterShare` code, routes, or types — tracked separately in #473.
- Changing `/api/parties` or the DM-facing `PartyEditor` on `/parties`.
- Restricting a character to a single party per campaign (multiple is explicitly allowed).
- Real-time/multi-tab sync of party membership changes (e.g. via SSE); a page refresh is sufficient for this change.

## What Changes

- Add `app/api/campaigns/[id]/parties/route.ts` with a `GET` handler.
- Add a new client component (e.g. `PartyMembershipPanel`) rendering one section per party, using the player's own character list and the new GET endpoint.
- Render the new panel on the campaign page (`app/campaigns/[id]/page.tsx`), additive alongside existing content.

## Risks

- Risk: New GET endpoint accidentally leaks parties or membership details belonging to non-members.
  - Impact: Privacy/data exposure across campaigns.
  - Mitigation: Reuse the campaign-membership check already used elsewhere (`storage.getMember(campaignId, callerId)` must be active) before calling `loadPartiesByCampaign`.
- Risk: Rapid toggling sends overlapping PUT requests for the same party, causing a stale response to overwrite a newer selection.
  - Impact: A character's join/leave action appears to silently revert.
  - Mitigation: Serialize or de-dupe in-flight requests per party (e.g. disable checkboxes for that party while a request is pending, mirroring `SharedCharactersPanel`'s existing `toggling` set pattern).

## Open Questions

- None blocking. Auth model for the new GET (any active campaign member, mirroring the "is this member active in the campaign" check rather than the PUT's "self or active DM" check) and UI shape (one panel per party, independent per-party state) were confirmed during exploration.

## Non-Goals

- Deprecating or removing `CampaignCharacterShare` (issue #473).
- Changing how parties are created, renamed, or deleted.
- Supporting DM-side bulk management of player characters from this new panel (that remains on `/parties`).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
