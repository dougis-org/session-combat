## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-11-backfill-default-party/design.md) document, not a replacement.

### Requirement: ADDED backfillDefaultParties finds campaigns with no associated party

The system SHALL identify every `Campaign` document that has zero `Party` documents where `party.campaignId` equals the campaign's `id`.

#### Scenario: Campaign with no party is identified

- **Given** a `campaigns` collection containing a campaign with `id: "camp-1"` and no `Party` document has `campaignId: "camp-1"`
- **When** the backfill script's candidate query runs
- **Then** `camp-1` is included in the set of campaigns to backfill

#### Scenario: Campaign with an existing party is excluded

- **Given** a `campaigns` collection containing a campaign with `id: "camp-2"` and a `Party` document exists with `campaignId: "camp-2"`
- **When** the backfill script's candidate query runs
- **Then** `camp-2` is not included in the set of campaigns to backfill, and no new `Party` document is created for it

### Requirement: ADDED backfillDefaultParties creates a default Main Party matching the #474 auto-create shape

The system SHALL create, for each campaign identified as missing a party, exactly one `Party` document with `name: "Main Party"`, `description: ""`, `members: []`, `campaignId` set to the campaign's `id`, and `userId` set to the campaign's `userId`.

#### Scenario: Default party created for a party-less campaign

- **Given** a campaign with `id: "camp-1"`, `userId: "user-1"`, and no associated `Party`
- **When** the backfill script runs
- **Then** exactly one new `Party` document is created with `campaignId: "camp-1"`, `userId: "user-1"`, `name: "Main Party"`, `description: ""`, and `members: []`

#### Scenario: Backfilled party is indistinguishable in shape from a #474-created party

- **Given** a `Party` document created by `POST /api/campaigns` (per `app/api/campaigns/route.ts`) and a `Party` document created by the backfill script
- **When** both documents' field sets are compared (excluding `id`, `createdAt`, `updatedAt`, and `campaignId` values, which are naturally instance-specific)
- **Then** both have identical shape: `name: "Main Party"`, `description: ""`, `members: []`, and a `userId` matching their respective campaign's owner

### Requirement: ADDED backfillDefaultParties is idempotent across repeated runs

The system SHALL produce no additional `Party` documents when run again after a campaign has already been backfilled or already had a party.

#### Scenario: Double-run idempotency

- **Given** a campaign that was missing a party and was backfilled by a first run of the script
- **When** the script is run a second time
- **Then** no new `Party` document is created for that campaign, and the run's summary count reflects zero additional backfills for it

### Requirement: ADDED backfillDefaultParties does not modify Campaign documents

The system SHALL only insert new `Party` documents; it SHALL NOT modify any field on any `Campaign` document.

#### Scenario: Campaign document is untouched after backfill

- **Given** a campaign with a known `updatedAt` timestamp and no associated party
- **When** the backfill script runs and creates a `Party` for it
- **Then** the campaign's own document (including its `updatedAt` timestamp and all other fields) is unchanged

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "script finds campaigns with no party" -> Requirement: backfillDefaultParties finds campaigns with no associated party
- Proposal element "creates a default Main Party per identified campaign, owned by that campaign's userId" -> Requirement: backfillDefaultParties creates a default Main Party matching the #474 auto-create shape
- Proposal element "must not touch campaigns that already have at least one party" -> Requirement: backfillDefaultParties finds campaigns with no associated party (exclusion scenario)
- Proposal element "must reuse the exact Party shape from app/api/campaigns/route.ts" -> Requirement: backfillDefaultParties creates a default Main Party matching the #474 auto-create shape
- Proposal element "safe to re-run (idempotent)" -> Requirement: backfillDefaultParties is idempotent across repeated runs
- Proposal element "must not alter Campaign documents" -> Requirement: backfillDefaultParties does not modify Campaign documents
- Design Decision 1 (aggregation query) -> Requirement: backfillDefaultParties finds campaigns with no associated party
- Design Decision 2 (exact Party shape) -> Requirement: backfillDefaultParties creates a default Main Party matching the #474 auto-create shape
- Requirements -> Tasks: implementation of the query, the Party construction, and manual verification of idempotency (see tasks.md)

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: Script logs per-campaign results and a final summary

- **Given** the backfill script processes a mix of campaigns (some backfilled, some skipped)
- **When** the run completes
- **Then** the console output includes one line per backfilled campaign identifying it (name and/or id) and a final summary line reporting total backfilled and total skipped counts

### Requirement: Reliability

#### Scenario: A single failed insert does not abort the entire run

- **Given** the backfill script is processing multiple party-less campaigns and one `Party` insert fails (e.g. transient database error)
- **When** that failure occurs
- **Then** the script logs the failure for that specific campaign, continues processing the remaining campaigns, and reports the failure in its final summary rather than crashing without output
