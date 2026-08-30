## Why

The `lib/scripts/seedCampaignTemplates.ts` script currently skips campaign templates if they already exist in the database. This means that if existing campaigns are updated (e.g., adding new encounters or modifying data), those updates aren't synced to the database. We need to update this logic to support overwriting or upserting templates. However, this shouldn't be unconditional to avoid accidentally wiping out live data—so we need a one-time update mechanism (like a `--force` flag) and clear directions on how to sync as new campaigns or encounters get added.

## What Changes

- Update `lib/scripts/seedCampaignTemplates.ts` to use `updateOne` with `$set` and `{ upsert: true }` instead of skipping when an existing template is found, but only when a specific flag (like `--force`) is provided.
- Ensure that without the force flag, the script continues to skip existing templates to maintain safety.
- Document the process of updating the seeds as new campaigns or encounters are added, explaining how to use the new flag.

## Capabilities

### New Capabilities
- `template-seed-logic`: Defines the behavior for inserting or updating campaign templates to the database safely, and documents the one-time update workflow.

### Modified Capabilities

## Impact

- Modifies `lib/scripts/seedCampaignTemplates.ts`.
- Updates documentation to include instructions for updating seeds.
- Modifies `package.json` to potentially add a `seed:force` script for convenience.
