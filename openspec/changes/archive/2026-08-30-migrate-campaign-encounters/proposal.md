## GitHub Issues

- #581

## Why

- Problem statement: Existing campaigns created from templates before Issue #575 was implemented did not receive base encounters. We need to retroactively populate these encounters for those campaigns.
- Why now: Issue #575 was recently implemented, giving templates base encounters. We must bridge the gap for existing campaigns so all DMs get the intended out-of-the-box experience.
- Business/user impact: DMs with older campaigns get the same rich, pre-populated starting content as new campaigns, reducing prep time.

## Problem Space

- Current behavior: Campaigns copied from a template before the template had encounters (or before the copy logic supported it) do not have base encounters.
- Desired behavior: A migration script iterates over all existing campaigns. If the campaign has a `templateId`, we instantiate any missing base encounters from the template and associate them with the campaign.
- Constraints: The migration must be safe to run multiple times (idempotent).
- Assumptions: We can use name-matching to avoid duplicating encounters. If a user already has an encounter with the exact same name as a template encounter, we skip creating it.
- Edge cases considered:
  - If a user renamed a base encounter, the name matcher will fail to find it, resulting in a duplicate of the original. This is acceptable for a one-time migration.
  - Template has no encounters: Handled gracefully (no action).
  - Campaign has no `templateId`: Handled gracefully (no action).

## Scope

### In Scope

- Creating a migration script (e.g. `lib/scripts/backfillCampaignEncounters.ts`).
- Implementing fuzzy name matching to prevent obvious duplication.
- Creating new `Encounter` records for missing base encounters and updating `campaign.encounterIds`.

### Out of Scope

- Modifying the `Encounter` schema to include a `templateEncounterId` or `originId` (Issue #575 did not do this, so we won't introduce it here).
- Real-time/UI-driven migration triggers (this is a backend database script).

## What Changes

- A new one-off script `lib/scripts/backfillCampaignEncounters.ts` is created and run.

## Risks

- Risk: A user renamed a base encounter, leading to a duplicate base encounter being added.
  - Impact: User has a duplicate encounter they have to manually delete.
  - Mitigation: Relying on name-matching prevents the vast majority of duplicates. Exact match is sufficient.

## Open Questions

- None at this time. All questions resolved in explore mode.

## Non-Goals

- Migrating custom campaigns that don't have a template.
- Modifying the campaign copy API (handled in #575).

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
