## GitHub Issues

- #575
- #578 (follow-up for Global Encounters library)
- #581 (follow-up for existing campaigns ingestion)

## Why

- Problem statement: The campaign catalog currently only provides structural information (chapters) but no actual encounters. DMs must build all encounters manually even when using a predefined campaign template.
- Why now: Campaigns recently gained the ability to tie encounters to them directly (`encounterIds`). We can now leverage this to provide rich, pre-populated content when a DM adopts a campaign template.
- Business/user impact: DMs get a fully fleshed-out starting point, drastically reducing prep time and improving the onboarding experience for new campaigns.

## Problem Space

- Current behavior: `CampaignTemplate` only contains metadata and `chapters: CampaignChapter[]`. When a user copies a template to their own campaign, they get the chapters but no encounters.
- Desired behavior: `CampaignTemplate` can store "default" encounters. When a template is copied, the system instantiates these encounters as full database records for the user and links their IDs to the newly created `Campaign`.
- Constraints: The generated encounters must be distinct records owned by the user (so they can edit them without affecting the template or other users).
- Assumptions: Encounters attached to a campaign template are specific to that campaign, not global entities (Global Encounters will be handled in #578).
- Edge cases considered:
  - Failure during campaign copy: If the encounter creation fails, the entire transaction should roll back so the user isn't left with a broken or half-populated campaign.
  - Template has no encounters: The system gracefully handles empty encounter arrays and behaves exactly as it does today.

## Scope

### In Scope

- Updating `CampaignTemplate` type to include an `encounters` array containing `EncounterTemplate` definitions.
- Updating `lib/scripts/seedCampaignTemplates.ts` to add at least one default encounter to an existing template.
- Updating the campaign copy API (`app/api/campaigns/global/[id]/copy/route.ts`) to read `template.encounters`, generate real `Encounter` objects for the user, and populate the new `Campaign.encounterIds`.
- Ensuring proper rollback on failure during the copy process.

### Out of Scope

- Migrating existing campaigns that were already copied from templates (handled in #581).
- Building a standalone "Global Encounters" library (handled in #578).
- Associating encounters directly with specific `CampaignChapter`s rather than the campaign as a whole.

## What Changes

- `lib/types.ts`: Define `EncounterTemplate` and add `encounters?: EncounterTemplate[]` to `CampaignTemplate`.
- `app/api/campaigns/global/[id]/copy/route.ts`: Map over `template.encounters`, insert them via `storage.saveEncounter(...)`, and collect their IDs.
- `lib/scripts/seedCampaignTemplates.ts`: Inject sample encounter data into one of the seeded templates (e.g. Dragon of Icespire Peak or Tyranny of Dragons).

## Risks

- Risk: Encounter insertion fails during the template copy loop, leaving the `Campaign` document partially created.
  - Impact: User gets a broken state or orphaned database entries.
  - Mitigation: Ensure we run the encounter creation inside the same try/catch block as the member insertion, and rollback the created `Campaign` if anything fails.

## Open Questions

- Question: Should we explicitly associate `EncounterTemplate`s with `chapterId`s?
  - Needed from: User
  - Blocker for apply: no (can be added later, but would be good to know)

## Non-Goals

- Completely revamping the Campaign Editor UI.
- Allowing user-created campaigns to be turned *into* Campaign Templates (only Global Templates are addressed).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
