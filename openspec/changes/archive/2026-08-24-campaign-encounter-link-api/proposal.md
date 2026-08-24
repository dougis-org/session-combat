## GitHub Issues

- #536 — body and metadata verified via `gh issue view 536 --repo dougis-org/session-combat` (the GitHub MCP tool's `issue_read` call failed with an invalid-session error during exploration; the CLI call succeeded and is the source of truth for the issue text quoted below). #535 (dependency, closed/merged) verified the same way.

## Why

- Problem statement: `Encounter` records have no relationship to `Campaign`. `CombatSetupView`'s "From Library" picker always fetches and shows every encounter the user owns, unfiltered by campaign. As encounters accumulate across campaigns, the picker becomes unusable for DMs trying to find the right one for the campaign they're running combat from.
- Why now: `Campaign.encounterIds?: string[]` already exists on the model (#535, merged to main) but nothing reads or writes it yet. This issue is the API surface that every downstream UI piece (campaign encounters-management screen, scoped combat-setup picker) will read/write through — it unblocks the rest of the campaign-aware combat start feature (design spec: `docs/superpowers/specs/2026-08-23-campaign-encounter-linking-design.md`, PR #534).
- Business/user impact: DMs can reuse encounters across sessions within a campaign without scrolling through their entire encounter library; combat setup scoped to a campaign only shows relevant encounters.

## Problem Space

- Current behavior: `Campaign.encounterIds` exists and defaults to `[]` via `normalizeCampaign()`, but no route reads or mutates it. `GET /api/encounters` returns all of a user's encounters with no campaign filter. `POST /api/encounters` has no `campaignId` parameter.
- Desired behavior:
  - `GET /api/campaigns/[id]/encounters` resolves `campaign.encounterIds` to full `Encounter[]`, readable by any active campaign member (DM or player) — this is what the campaign-scoped combat setup picker calls, and combat setup must work for every member, not just the DM.
  - `POST /api/campaigns/[id]/encounters` links an existing encounter to the campaign (`$addToSet`), restricted to the DM.
  - `DELETE /api/campaigns/[id]/encounters/[encounterId]` unlinks (`$pull`), restricted to the DM, and never deletes the underlying `Encounter` document.
  - `POST /api/encounters` accepts an optional `campaignId`; when present and the requester is that campaign's DM, the encounter is created and linked in one round trip.
- Constraints:
  - Encounters in this codebase are owned by a single `userId` (the creator) with no sharing model of their own (unlike characters, which have `campaignCharacterShares`). Only the campaign's DM creates/owns the encounters that get linked to their own campaign — this issue does not introduce cross-user encounter sharing.
  - The Mongo storage layer (`lib/storage.ts`) uses the native driver directly, no transactions in use anywhere in the codebase today.
  - Existing route convention (`app/api/campaigns/[id]/route.ts`, `app/api/encounters/[id]/route.ts`) returns 404 uniformly for "not found" and "not authorized" — no route in this codebase returns 403.
- Assumptions:
  - The campaign's DM is the owner (`userId`) of every encounter linked to that campaign, since only the DM can create the link.
  - `assertCampaignAccess()` (`lib/utils/campaign.ts`) remains the single source of truth for campaign membership/role checks.
- Edge cases considered:
  - Linking the same encounter twice must be idempotent (`$addToSet` handles this at the Mongo level).
  - Linking an encounter that exists but belongs to a different user must 404 (not reveal existence).
  - Unlinking an encounter that isn't currently linked is a no-op success (`$pull` is idempotent), not an error.
  - `POST /api/encounters` with `campaignId` where the requester isn't that campaign's DM must fail the whole request (400/404) — do not silently create an unlinked encounter when the caller explicitly asked for a campaign link they're not authorized to make.
  - `POST /api/encounters` with `campaignId` where creation succeeds but the link step fails (e.g. transient DB error) must NOT roll back / delete the created encounter — return an error describing the link failure, but the encounter row is already committed and remains reachable via `GET /api/encounters`.

## Scope

### In Scope

- `GET /api/campaigns/[id]/encounters` (new route file)
- `POST /api/campaigns/[id]/encounters` (same route file)
- `DELETE /api/campaigns/[id]/encounters/[encounterId]` (new route file)
- Extending `POST /api/encounters` to accept optional `campaignId`
- Any new `lib/storage.ts` method(s) needed to resolve encounters by id list (`$in`) — no such helper exists today; `loadEncounters(userId)` loads a user's full list only
- Unit/integration tests for all of the above

### Out of Scope

- Any UI changes (encounters-management screen, combat-setup picker filtering, campaign list buttons, ad hoc combat banner) — those are separate issues in the same design spec
- Bidirectional reverse lookup ("which campaigns use this encounter") from the global `/encounters` screen
- Pagination/filtering on the global encounters list
- Any change to `ActiveCombatView` or in-combat mechanics
- Cross-user encounter sharing (e.g. a player's encounter being linkable to a campaign they don't DM) — not requested, not part of this data model

## What Changes

- New route: `app/api/campaigns/[id]/encounters/route.ts` — `GET` (any active member) and `POST` (DM only)
- New route: `app/api/campaigns/[id]/encounters/[encounterId]/route.ts` — `DELETE` (DM only)
- Modified route: `app/api/encounters/route.ts` — `POST` accepts optional `campaignId`, validates DM role on that campaign before creating+linking
- New/modified storage method(s) in `lib/storage.ts` to resolve `Encounter[]` by `id: { $in: encounterIds }` scoped to the campaign owner's `userId`, and to perform the `$addToSet`/`$pull` mutations on `campaign.encounterIds`

## Risks

- Risk: Issue #536's literal text describes the `GET` route filtering by `auth.userId`, which would return an empty list for any campaign member who isn't the encounter owner (i.e. every player, and even the DM if request context differs). This proposal deliberately deviates from that literal text.
  - Impact: If unnoticed, the combat-setup picker would appear empty for players even when the DM has linked encounters, defeating the feature's purpose.
  - Mitigation: `GET` authorization is enforced via `assertCampaignAccess()` (any active member), and the resolved encounter list is *not* additionally filtered by requester `userId` — only by campaign membership and `encounterIds` membership. This is called out explicitly in Open Questions and design.md for confirmation.
- Risk: No DB transactions exist in this codebase; the "create encounter + link" flow in `POST /api/encounters` has a window where creation succeeds and linking fails.
  - Impact: An encounter could be created but not linked, surprising a DM who expected atomicity.
  - Mitigation: Explicitly accepted per Problem Space — orphaned-but-preserved beats data loss. The response will clearly indicate partial success (encounter created, link failed) so the client can retry linking.
- Risk: 404-only convention hides the distinction between "encounter doesn't exist" and "encounter exists but isn't yours" from API consumers, which could make client-side error messaging generic.
  - Impact: Low — matches existing UX for all other routes in the app; no route currently disambiguates this.
  - Mitigation: None needed; this is an intentional consistency choice, not a gap.

## Open Questions

- Question: Should `POST /api/encounters` with a `campaignId` the requester doesn't DM return 400 or 404?
  - Needed from: repo owner (doug)
  - Blocker for apply: no — default to 404 per the codebase-wide "don't reveal authorization state" convention (treated the same as a bad/foreign campaign id) unless corrected in design review.
- Question: Should the `POST`/`DELETE` link routes validate that `encounterId` in the request body/path is a well-formed UUID before querying, or is a plain not-found 404 on a malformed id acceptable?
  - Needed from: repo owner (doug)
  - Blocker for apply: no — default to no format pre-validation (consistent with `app/api/encounters/[id]/route.ts`, which does a plain `.find()` with no id format check) unless corrected in design review.

## Non-Goals

- Introducing a general-purpose sharing/permissions model for encounters
- Adding Mongo transactions to the storage layer
- Changing the 404-only error convention anywhere in the codebase

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
