## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-20-gridfs-attachment-upload-serve/design.md) document, not a replacement.

### Requirement: ADDED GET /api/campaigns/[id]/attachments/[attachmentId] — stream image from GridFS

The system SHALL stream the raw image bytes from GridFS to any authenticated active campaign member, setting `Content-Type` to the file's stored MIME type, and reject all others.

#### Scenario: Active member fetches a valid attachment

- **Given** an authenticated user who is an active member of campaign `campaignId`
- **And** a GridFS file exists with id `attachmentId` and `metadata.campaignId === campaignId`
- **When** they GET `/api/campaigns/[id]/attachments/[attachmentId]`
- **Then** the response is `200 OK` with the image bytes streamed and `Content-Type` matching the stored MIME type (e.g., `image/jpeg`)

#### Scenario: DM fetches a valid attachment

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **And** a GridFS file exists with id `attachmentId` and `metadata.campaignId === campaignId`
- **When** they GET `/api/campaigns/[id]/attachments/[attachmentId]`
- **Then** the response is `200 OK` with the image bytes streamed

#### Scenario: Non-member attempts fetch

- **Given** an authenticated user who is not a member of campaign `campaignId`
- **When** they GET `/api/campaigns/[id]/attachments/[attachmentId]`
- **Then** the response is `403 Forbidden`

#### Scenario: Unauthenticated fetch

- **Given** a request with no auth credentials
- **When** they GET `/api/campaigns/[id]/attachments/[attachmentId]`
- **Then** the response is `401 Unauthorized`

#### Scenario: Attachment belongs to a different campaign

- **Given** an authenticated active member of campaign `campaignId-A`
- **And** a GridFS file exists with id `attachmentId` and `metadata.campaignId === campaignId-B`
- **When** they GET `/api/campaigns/campaignId-A/attachments/[attachmentId]`
- **Then** the response is `404 Not Found`

#### Scenario: Attachment does not exist

- **Given** an authenticated active member of campaign `campaignId`
- **When** they GET `/api/campaigns/[id]/attachments/nonexistent-id`
- **Then** the response is `404 Not Found`

#### Scenario: Invalid attachmentId format

- **Given** an authenticated active member of campaign `campaignId`
- **When** they GET `/api/campaigns/[id]/attachments/not-a-valid-objectid`
- **Then** the response is `400 Bad Request` with `{ "error": "Invalid attachmentId" }`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "any active member can fetch" → Scenario: Active member fetches a valid attachment
- Proposal element "non-members cannot" → Scenario: Non-member attempts fetch
- Proposal element "bytes survive Fly restart" → NFAC Reliability scenario (gridfs-upload/spec.md)
- Design decision D5 (campaignId enforced on serve) → Scenario: Attachment belongs to a different campaign
- Requirement → Task: T3 (GET /attachments/[attachmentId] route), T1 (lib/gridfs.ts openDownloadStream)

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Non-member attempts fetch", "Unauthenticated fetch", "Attachment belongs to a different campaign". These cover all access-control properties.

#### Scenario: `attachmentId` from another campaign does not leak file existence

- **Given** an authenticated active member of campaign `campaignId-A`
- **And** a valid GridFS file exists belonging to `campaignId-B`
- **When** they request the file via campaign A's URL
- **Then** the response is `404 Not Found` (not `403`) — the file's existence is not revealed
