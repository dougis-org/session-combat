## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Lazy orphan sweep — delete abandoned pending uploads before each new upload

The system SHALL, before inserting a new GridFS file for a given campaign, delete all GridFS files in that campaign where `metadata.status === 'pending'` and `metadata.uploadedAt` is older than 24 hours, so that abandoned uploads never accumulate permanently.

#### Scenario: Orphaned file is swept on next DM upload

- **Given** a GridFS file exists for campaign `campaignId` with `metadata.status: "pending"` and `metadata.uploadedAt` more than 24 hours ago
- **And** no `CampaignMessage` with `attachmentId` referencing this file exists
- **When** a DM uploads a new image to `/api/campaigns/[id]/attachments`
- **Then** the orphaned GridFS file is deleted before the new file is inserted
- **And** the new upload succeeds with `201 Created`

#### Scenario: Recent pending file is not swept

- **Given** a GridFS file exists for campaign `campaignId` with `metadata.status: "pending"` and `metadata.uploadedAt` less than 24 hours ago
- **When** a DM uploads a new image to the same campaign
- **Then** the recent pending file is NOT deleted
- **And** the new upload succeeds with `201 Created`

#### Scenario: Pending files from other campaigns are not swept

- **Given** a GridFS file exists for campaign `campaignId-B` with `metadata.status: "pending"` and `metadata.uploadedAt` more than 24 hours ago
- **When** a DM uploads a new image to campaign `campaignId-A`
- **Then** the file for `campaignId-B` is NOT deleted

#### Scenario: No orphaned files exist — upload proceeds normally

- **Given** no pending GridFS files older than 24 hours exist for campaign `campaignId`
- **When** a DM uploads a new image to `/api/campaigns/[id]/attachments`
- **Then** the upload succeeds with `201 Created` and no GridFS files are deleted

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "abandoned upload never leaves a permanently orphaned file" → Requirement: ADDED Lazy orphan sweep
- Design decision D2 (lazy sweep per campaign on upload) → all scenarios above
- Requirement → Task: T1 (`deleteOrphanedAttachments()` in lib/gridfs.ts), T2 (called in POST /attachments before insert)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Sweep failure does not block the upload

- **Given** `deleteOrphanedAttachments()` encounters an error (e.g., transient MongoDB timeout)
- **When** a DM uploads a new image
- **Then** the sweep error is logged but the upload proceeds and returns `201 Created`

> Note: orphan sweep is best-effort. A sweep failure should not fail the user's upload request.
