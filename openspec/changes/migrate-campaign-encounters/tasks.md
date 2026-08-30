## 1. Migration Script

- [x] 1.1 Create `lib/scripts/backfillCampaignEncounters.ts` scaffolding that connects to the database, imports `storage`, and handles execution/logging.
- [x] 1.2 Write a query to fetch all `Campaign` records that have a truthy `templateId`.
- [x] 1.3 For each campaign, fetch the corresponding `CampaignTemplate`. If it has `encounters`, proceed.
- [x] 1.4 Fetch existing `Encounter` records belonging to the campaign using `storage.loadEncountersByIds(campaign.encounterIds, campaign.userId)`.
- [x] 1.5 Implement name-matching: filter the template's `encounters` to only those where an existing encounter with the exact same name does NOT exist in the campaign.
- [x] 1.6 Generate new `Encounter` records for the missing ones (with `randomUUID()`, the DM's `userId`, and `createdAt`/`updatedAt`), save them via `storage.saveEncounter()`, and append their IDs to `campaign.encounterIds`.
- [x] 1.7 Save the updated campaign via `storage.saveCampaign(campaign)`. Wrap steps 1.4-1.7 in a try/catch to log errors and continue if one campaign fails.
- [x] 1.8 Run the script against the local database to verify it works and prints summary stats (migrated X campaigns, added Y encounters, skipped Z).

## 2. Review and Finalize

- [x] 2.1 Add the migration script to `package.json` scripts if it should be part of standard deployment/seeding processes (e.g., `"migrate:encounters": "npx tsx lib/scripts/backfillCampaignEncounters.ts"`).
- [ ] 2.2 Submit a pull request and get it merged.
