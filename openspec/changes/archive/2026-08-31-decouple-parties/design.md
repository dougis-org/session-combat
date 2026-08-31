## Context

- Relevant architecture: `storage.ts` data access layer, Next.js API routes (`app/api/campaigns`), MongoDB database schema.
- Dependencies: `mongodb` driver.
- Interfaces/contracts touched: `Campaign` interface (adding `partyIds?: string[]`), `Party` interface (deprecating `campaignId?: string`).

## Goals / Non-Goals

### Goals

- Allow a `Party` to exist independently of a `Campaign`.
- Allow a `Campaign` to track multiple parties via a `partyIds` array.
- Ensure deleting a `Campaign` does not delete any `Party`.

### Non-Goals

- Refactoring the UI for cross-campaign party management.
- Creating a migration script to backfill data (we will use a lazy read/migration approach on load).

## Decisions

### Decision 1: Relationship Model (Campaign-hosted Parties)

- Chosen: Add `partyIds: string[]` to the `Campaign` document.
- Alternatives considered: Add `campaignIds: string[]` to the `Party` document, or create a many-to-many join collection.
- Rationale: A campaign conceptually "hosts" parties, making it the natural place to store references. It makes campaign deletion perfectly isolated—deleting the campaign document simply drops the references, leaving the Party documents completely untouched.
- Trade-offs: Finding all campaigns for a specific party requires querying across all campaigns, but this is a rare operation compared to loading a campaign and its parties.

### Decision 2: Lazy Data Migration

- Chosen: In `storage.loadPartiesByCampaign`, if the campaign has no `partyIds`, fallback to querying `db.parties.find({ campaignId })` and optionally update the campaign with those IDs.
- Alternatives considered: Write a one-off database migration script.
- Rationale: A lazy migration is safer, requires zero downtime, and automatically fixes old data as it is accessed.
- Trade-offs: Slight performance hit the very first time an old campaign is loaded.

## Proposal to Design Mapping

- Proposal element: Stop cascading party deletions when a campaign is deleted.
  - Design decision: Decision 1 (Relationship Model). Update `storage.deleteCampaign` to stop calling `db.parties.deleteMany`.
  - Validation approach: Integration test verifying that deleting a campaign leaves the party in the database.

- Proposal element: Fetch parties using `Campaign.partyIds`.
  - Design decision: Decision 2 (Lazy Data Migration). Update `loadPartiesByCampaign`.
  - Validation approach: Unit test verifying that parties are loaded via `id` in `partyIds`, and fallback works for legacy data.

## Functional Requirements Mapping

- Requirement: Campaign stores an array of party IDs.
  - Design element: `Campaign` interface `partyIds?: string[]`.
  - Acceptance criteria reference: Specs - Campaign schema update.
  - Testability notes: Type checking and API serialization tests.

- Requirement: Deleting a campaign does not delete parties.
  - Design element: `storage.deleteCampaign` logic change.
  - Acceptance criteria reference: Specs - Storage deletion.
  - Testability notes: Integration test for `deleteCampaign`.

## Non-Functional Requirements Mapping

- Requirement category: performance
  - Requirement: Loading campaigns and parties should remain fast.
  - Design element: Index on `id` in `parties` (already exists). `partyIds` array is small.
  - Acceptance criteria reference: Specs - Performance.
  - Testability notes: No N+1 query introduced; use `$in` query for fetching multiple parties.

## Risks / Trade-offs

- Risk/trade-off: Legacy data might not be fully migrated if a campaign is never loaded before the legacy code is entirely removed.
  - Impact: Low, since active campaigns will be loaded.
  - Mitigation: Keep the lazy migration logic indefinitely or run a background script later.

## Rollback / Mitigation

- Rollback trigger: Data corruption or failure to load parties in active campaigns.
- Rollback steps: Revert the code change. The database will still contain `campaignId` on the parties since we are not deleting it during the lazy migration.
- Data migration considerations: Do not `unset` the legacy `campaignId` on parties right away. Just populate `partyIds` on Campaigns.
- Verification after rollback: Verify parties load correctly via legacy `campaignId`.

## Operational Blocking Policy

- If CI checks fail: Fix the tests. Do not merge.
- If security checks fail: Address immediately.
- If required reviews are blocked/stale: Ping code owners after 24 hours.
- Escalation path and timeout: N/A for this project scale.

## Open Questions

- None.
