## GitHub Issues

- #474
- #470 (epic: Party-Centric Character Sharing)

## Why

- Problem statement: `POST /api/campaigns` creates a `Campaign` and a `CampaignMember` (the creating DM), but no `Party`. There is no default place to share characters into a freshly created campaign.
- Why now: Epic #470 is migrating character sharing from the campaign-level `CampaignCharacterShare` abstraction to party-level sharing. Every campaign needs at least one `Party` for that model to work; without this change, every new campaign is born without one.
- Business/user impact: DMs currently have to remember to manually create a party after creating a campaign before they can share characters into it. This closes that gap for newly created campaigns.

## Problem Space

- Current behavior: `POST /api/campaigns` (`app/api/campaigns/route.ts`) saves the `Campaign`, then creates a `CampaignMember` for the DM. If member creation fails, the campaign is rolled back (deleted). No `Party` is created.
- Desired behavior: `POST /api/campaigns` additionally creates a default `Party` named "Main Party", linked to the new campaign via `campaignId`, owned by the creating user. If any step in the creation saga fails, all prior steps are rolled back so no partial campaign/party/member state is left behind.
- Constraints:
  - Must reuse the existing `Party` model and `storage.saveParty` / `storage.deleteParty` (already implemented for `app/api/parties/route.ts`); no new Party concept.
  - Must not change the `POST /api/campaigns` response contract — response body remains the `Campaign` object only, matching current client expectations (`CampaignEditor.tsx`, existing tests).
  - Must follow the existing saga/rollback pattern in the route (build entity → save → on later failure, roll back what was already saved), per prior "match existing pattern exactly" precedent used for the campaign-copy route.
- Assumptions:
  - "Main Party" is a fixed, hardcoded string — not derived from campaign name or localized.
  - The default party starts with an empty `members` array (no characters exist yet at campaign-creation time).
  - Party ordering: created after the `Campaign` save, before the `CampaignMember` save (party before member).
- Edge cases considered:
  - Party save fails after campaign save succeeds → roll back (delete) the campaign.
  - Member save fails after campaign + party both succeeded → roll back (delete) the party, then the campaign.
  - Pre-existing campaigns (created before this ships) will not retroactively get a default party — tracked separately in #479.
  - Campaign deletion does not currently cascade to delete associated `Party`/`CampaignMember` rows; this change adds one more piece of state that can be orphaned this way — tracked separately in #480.

## Scope

### In Scope

- Modify `POST /api/campaigns` (`app/api/campaigns/route.ts`) to create a default "Main Party" for every newly created campaign.
- Extend the existing rollback logic to unwind the party (and campaign) if a later step fails.
- Unit/integration test coverage for the new creation and rollback paths.

### Out of Scope

- Backfilling a default party for campaigns created before this change ships (tracked in #479).
- Cascading deletion of `Party`/`CampaignMember` records when a campaign is deleted (tracked in #480).
- Any change to `POST /api/campaigns` response shape or to `GET`/other campaign endpoints.
- Any change to `app/api/parties/route.ts` or manual party creation/editing flows.
- Configurable or campaign-name-derived party naming.

## What Changes

- `app/api/campaigns/route.ts`: `POST` handler creates a `Party` (name: "Main Party", `campaignId` set to the new campaign's id, `userId` set to the creating user, empty `members`) immediately after saving the campaign and before creating the `CampaignMember`. Failure at any step rolls back all previously-completed steps in reverse order.

## Risks

- Risk: Extending the rollback chain incorrectly could leave orphaned `Party` or `Campaign` rows on partial failure.
  - Impact: Data inconsistency; orphaned records visible to the user or consuming other flows (e.g. sharing UI referencing a campaign that no longer exists).
  - Mitigation: Explicit, ordered rollback (reverse of creation order) with each rollback step independently try/caught and logged, matching the existing member-rollback pattern in the current code.
- Risk: Silent party creation (no contract change) could surprise a DM who expects to name their own initial party.
  - Impact: Low — "Main Party" can be renamed via existing party-editing UI/API after creation.
  - Mitigation: None needed; explicitly accepted per scope decision.

## Open Questions

None — all decisions needed to implement this change were resolved during exploration (see #474 discussion): rollback ordering (party before member, reverse-order rollback), no API contract change, fixed "Main Party" name, and backfill/cascade-delete concerns deferred to #479/#480.

## Non-Goals

- Retroactively creating parties for existing campaigns.
- Cleaning up orphaned records on campaign deletion.
- Supporting multiple default parties or per-campaign party templates.
- Any change to how characters are added to a party.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
