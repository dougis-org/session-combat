## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED POST /api/campaigns/[id]/attachments — upload image to GridFS

The system SHALL accept a multipart/form-data POST from an authenticated DM, validate the file, store it in MongoDB GridFS, and return an `attachmentId`.

#### Scenario: DM uploads a valid JPEG

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST `multipart/form-data` with a valid JPEG file (≤5 MB) to `/api/campaigns/[id]/attachments`
- **Then** the response is `201 Created` with body `{ "attachmentId": "<hex-string>" }` and the file is stored in GridFS with `metadata.campaignId`, `metadata.status: "pending"`, and `metadata.uploadedAt`

#### Scenario: DM uploads a valid PNG

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST a valid PNG file (≤5 MB)
- **Then** the response is `201 Created` with a valid `attachmentId`

#### Scenario: DM uploads a valid WebP

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST a valid WebP file (≤5 MB)
- **Then** the response is `201 Created` with a valid `attachmentId`

#### Scenario: DM uploads a valid GIF

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST a valid GIF file (≤5 MB)
- **Then** the response is `201 Created` with a valid `attachmentId`

#### Scenario: File exceeds 5 MB limit

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST a file larger than 5 MB (5,242,881 bytes)
- **Then** the response is `413 Content Too Large` with `{ "error": "File exceeds 5 MB limit" }` and no GridFS file is created

#### Scenario: Unsupported MIME type

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST a file with MIME type `application/pdf`
- **Then** the response is `415 Unsupported Media Type` with `{ "error": "Unsupported file type" }` and no GridFS file is created

#### Scenario: No file in request

- **Given** an authenticated user with role `dm` in campaign `campaignId`
- **When** they POST multipart/form-data with no `file` field
- **Then** the response is `400 Bad Request` with `{ "error": "file is required" }`

#### Scenario: Player attempts upload

- **Given** an authenticated user with role `player` (not `dm`) in campaign `campaignId`
- **When** they POST a valid image file to `/api/campaigns/[id]/attachments`
- **Then** the response is `403 Forbidden`

#### Scenario: Non-member attempts upload

- **Given** an authenticated user who is not a member of campaign `campaignId`
- **When** they POST a valid image file to `/api/campaigns/[id]/attachments`
- **Then** the response is `403 Forbidden`

#### Scenario: Unauthenticated request

- **Given** a request with no auth credentials
- **When** they POST to `/api/campaigns/[id]/attachments`
- **Then** the response is `401 Unauthorized`

#### Scenario: Campaign does not exist

- **Given** an authenticated user
- **When** they POST to `/api/campaigns/nonexistent-id/attachments`
- **Then** the response is `404 Not Found`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "DM-only upload" → Requirement: ADDED POST /api/campaigns/[id]/attachments
- Proposal element "5 MB max, JPEG/PNG/WebP/GIF" → Scenarios: file exceeds limit, unsupported MIME type
- Design decision D1 (two-step upload) → this endpoint returns `attachmentId` only
- Design decision D2 (lazy orphan sweep) → sweep fires before GridFS insert (see specs/gridfs-orphan/spec.md)
- Design decision D4 (MIME from formData file.type) → unsupported MIME scenario
- Requirement → Task: T1 (lib/gridfs.ts), T2 (POST /attachments route)

## Non-Functional Acceptance Criteria

### Requirement: Security

See functional scenarios: "Player attempts upload", "Non-member attempts upload", "Unauthenticated request". No additional NFAC security scenarios.

### Requirement: Reliability

#### Scenario: File bytes are persisted in MongoDB (not local disk)

- **Given** a successful upload
- **When** the Fly machine is restarted (ephemeral disk cleared)
- **Then** the file remains retrievable via `GET /api/campaigns/[id]/attachments/[attachmentId]`

> Note: verified by architecture (GridFS → MongoDB Atlas); not unit-testable. Confirmed by integration test if run against a real database.
