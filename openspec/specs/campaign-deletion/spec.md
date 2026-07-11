## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-07-11-cascade-delete-campaign-children/design.md) document, not a replacement.

### Requirement: ADDED Cascade delete of Party rows on campaign deletion

The system SHALL delete all `Party` documents whose `campaignId` matches the deleted campaign's `id` when `storage.deleteCampaign` is called.

#### Scenario: Campaign with multiple parties is deleted

- **Given** a campaign has two `Party` documents with `campaignId` equal to the campaign's `id`, and a third `Party` document belongs to a different campaign
- **When** `storage.deleteCampaign` is called for that campaign
- **Then** both parties belonging to the deleted campaign are removed, and the unrelated party belonging to the other campaign remains untouched

#### Scenario: Campaign with no parties is deleted

- **Given** a campaign has zero `Party` documents referencing it
- **When** `storage.deleteCampaign` is called for that campaign
- **Then** the call resolves without throwing and no `Party` documents are affected

### Requirement: ADDED Cascade delete of CampaignMember rows on campaign deletion

The system SHALL delete all `CampaignMember` documents whose `campaignId` matches the deleted campaign's `id`, regardless of which `userId` each membership belongs to, when `storage.deleteCampaign` is called.

#### Scenario: Campaign with multiple members across different users is deleted

- **Given** a campaign has `CampaignMember` documents for two different `userId`s (a DM and a player) with `campaignId` equal to the campaign's `id`
- **When** the DM calls `storage.deleteCampaign` for that campaign
- **Then** both members' `CampaignMember` documents are removed, including the player's, even though the player is not the caller of delete

### Requirement: ADDED Cascade delete of SessionLog, CampaignRoll, CampaignCharacterShare, SavedContent, and CampaignMessage rows on campaign deletion

The system SHALL delete all `SessionLog`, `CampaignRoll`, `CampaignCharacterShare`, `SavedContent`, and `CampaignMessage` documents whose `campaignId` matches the deleted campaign's `id` when `storage.deleteCampaign` is called.

#### Scenario: Campaign with session history, rolls, character shares, saved content, and messages is deleted

- **Given** a campaign has at least one `SessionLog`, one `CampaignRoll`, one `CampaignCharacterShare`, one `SavedContent`, and one `CampaignMessage` document referencing its `campaignId`
- **When** `storage.deleteCampaign` is called for that campaign
- **Then** all five documents are removed

#### Scenario: Existing rollback callers are unaffected

- **Given** `storage.deleteCampaign` is invoked as a rollback helper immediately after campaign creation, before any `Party` or `CampaignMember` rows exist yet
- **When** the rollback call executes
- **Then** the cascade deletes find nothing and complete as a no-op, and the campaign document itself is still removed as before

## MODIFIED Requirements

### Requirement: MODIFIED Campaign deletion removes the Campaign document

The system SHALL delete the `Campaign` document only after the cascade deletes of its dependent collections have completed, rather than deleting the `Campaign` document as the sole effect of `storage.deleteCampaign`.

#### Scenario: Campaign document is removed last, after cascade

- **Given** a campaign with dependent rows in one or more of the seven campaign-scoped collections
- **When** `storage.deleteCampaign` is called
- **Then** the cascade `deleteMany` calls are issued before the `campaigns.deleteOne` call, so that if the process fails before reaching the final delete, the `Campaign` document still exists and the operation remains retryable

## Traceability

- Proposal element: "Cascade-delete parties, campaignMembers, sessionLogs, campaignRolls, campaignCharacterShares, savedContent, campaignMessages on campaign delete" -> Requirement: ADDED Cascade delete of Party rows; ADDED Cascade delete of CampaignMember rows; ADDED Cascade delete of SessionLog/CampaignRoll/CampaignCharacterShare/SavedContent/CampaignMessage rows
- Design decision: Decision 1 (parallel deleteMany cascade) -> Requirement: MODIFIED Campaign deletion removes the Campaign document
- Design decision: Decision 2 (children-first ordering) -> Requirement: MODIFIED Campaign deletion removes the Campaign document (retryability scenario)
- Design decision: Decision 3 (per-collection filter scoping) -> Requirement: ADDED Cascade delete of CampaignMember rows (cross-user scenario)
- Requirement: ADDED Cascade delete of Party rows -> Task(s): implement cascade in `storage.deleteCampaign`; add/extend unit tests in `tests/unit/storage/campaigns.test.ts`
- Requirement: ADDED Cascade delete of CampaignMember rows -> Task(s): implement cascade in `storage.deleteCampaign`; add/extend unit tests
- Requirement: ADDED Cascade delete of SessionLog/CampaignRoll/CampaignCharacterShare/SavedContent/CampaignMessage rows -> Task(s): implement cascade in `storage.deleteCampaign`; add/extend unit tests
- Requirement: MODIFIED Campaign deletion removes the Campaign document -> Task(s): implement cascade ordering (children before campaigns.deleteOne)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Retryability after partial failure

- **Given** a hypothetical crash occurs after the cascade `deleteMany` calls complete but before `campaigns.deleteOne` runs
- **When** `storage.deleteCampaign` is invoked again for the same campaign
- **Then** the retry succeeds: the already-empty collections are no-ops and the `Campaign` document is removed, leaving no orphaned data

See functional scenario: "Campaign document is removed last, after cascade" for the ordering guarantee this relies on.

### Requirement: Security

Access control for campaign deletion (DM-only, via `assertCampaignAccess` in the route handler) is unchanged by this feature and is not re-specified here. See existing route-level authorization behavior in `app/api/campaigns/[id]/route.ts`, which is out of scope for this change.
