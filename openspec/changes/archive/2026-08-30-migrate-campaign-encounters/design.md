## Context

Following the implementation of Issue #575 (campaign-encounter-templates), `CampaignTemplate` records now include an `encounters` array containing default encounters. However, existing `Campaign` records that were already copied from these templates did not receive these encounters. We need to write a migration script to backfill these base encounters to the existing campaigns.

## Goals / Non-Goals

**Goals:**
- Provide a database migration script that iterates through all existing campaigns with a `templateId`.
- Identify missing template encounters in these campaigns.
- Create new `Encounter` records for these missing encounters and link them to the campaign via `encounterIds`.
- Ensure the script is idempotent using name-matching to avoid creating obvious duplicate encounters.

**Non-Goals:**
- Modifying the core `Encounter` schema to add tracking fields like `templateEncounterId`.
- Creating a UI for running this migration. It will be run directly via `ts-node` or `tsx` against the database.
- Modifying the existing template copy API logic (that is already handled by #575).

## Decisions

### Decision 1: Using Name-Matching for Idempotency
- **Rationale**: Since `Encounter` records created from templates do not carry over any `templateEncounterId` or `originId` (a decision made in #575 to keep them completely standalone), we cannot trace an encounter back to its template origin strictly by ID. Name-matching is a pragmatic alternative.
- **Alternatives considered**: 
  1. Add a `templateEncounterId` to `Encounter`. This would require a schema change and updating the copy API again.
  2. Only migrate if `encounterIds` is completely empty. This would skip early adopters who manually added custom encounters to their old campaigns.
- **Why chosen**: Name-matching catches the vast majority of duplication without requiring schema changes. We will use a case-sensitive exact match for simplicity.

### Decision 2: Implementation as a standalone script
- **Rationale**: This is a one-time operation to bridge the gap between old campaigns and the new template feature.
- **Why chosen**: It aligns with existing practices (e.g., `lib/scripts/backfillDefaultParties.ts`).

## Risks / Trade-offs

- **[Risk] User renamed a base encounter** -> **Mitigation**: The script will fail to find the exact name match and will insert a duplicate of the original. This is acceptable for a one-time migration and the user can delete the duplicate.
- **[Risk] Partial failure during migration** -> **Mitigation**: The script will wrap the encounter creation and campaign update in a try/catch block, processing campaigns individually. If one fails, it logs the error and continues to the next campaign.
