---
name: tests
description: Tests for the gridfs-attachment-upload-serve change
---

# Tests

## Overview

All work follows strict TDD: write a failing test first, implement the minimum code to pass it, then refactor.

Test files:
- Unit: `tests/unit/lib/gridfs.test.ts`
- Integration (upload): `tests/integration/api/campaigns/[id]/attachments/route.test.ts`
- Integration (serve): `tests/integration/api/campaigns/[id]/attachments/[attachmentId]/route.test.ts`

---

## T0 — `CampaignMessage` type extension (`lib/types.ts`)

Spec: `openspec/changes/gridfs-attachment-upload-serve/specs/campaign-message-type/spec.md`

- [ ] **T0-1** TypeScript compiles with `kind` and `attachmentId` absent — existing `CampaignMessage` objects remain valid (`npx tsc --noEmit`)
- [ ] **T0-2** TypeScript accepts `{ kind: 'scene', attachmentId: 'abc123' }` on a `CampaignMessage` without error
- [ ] **T0-3** `npm run test:unit` — all pre-existing unit tests pass after the additive type change

---

## T1 — `lib/gridfs.ts` helper module

Spec: `openspec/changes/gridfs-attachment-upload-serve/specs/gridfs-upload/spec.md`, `specs/gridfs-orphan/spec.md`

File: `tests/unit/lib/gridfs.test.ts`

### `getAttachmentsBucket`

- [ ] **T1-1** Returns a `GridFSBucket` instance with `bucketName: 'attachments'`

### `uploadAttachment`

- [ ] **T1-2** Calls `bucket.openUploadStream` with filename, metadata `{ campaignId, status: 'pending', uploadedAt, contentType }` and pipes file bytes
- [ ] **T1-3** Returns a hex string ObjectId on success

### `openDownloadStream`

- [ ] **T1-4** Calls `bucket.find` with the parsed ObjectId and returns `{ stream, contentType, campaignId }` from file metadata
- [ ] **T1-5** Throws (or rejects) when `attachmentId` is not a valid hex ObjectId
- [ ] **T1-6** Throws (or rejects) when no file is found for the given id

### `deleteOrphanedAttachments`

- [ ] **T1-7** Calls `bucket.find` filtering by `metadata.campaignId`, `metadata.status: 'pending'`, and `metadata.uploadedAt < threshold` and deletes each matching file
- [ ] **T1-8** Does NOT delete a pending file whose `uploadedAt` is within the 24h threshold
- [ ] **T1-9** Does NOT delete files belonging to a different `campaignId`
- [ ] **T1-10** Swallows and logs errors (does not throw) when GridFS operations fail

---

## T2 — `POST /api/campaigns/[id]/attachments`

Spec: `openspec/changes/gridfs-attachment-upload-serve/specs/gridfs-upload/spec.md`

File: `tests/integration/api/campaigns/[id]/attachments/route.test.ts`

- [ ] **T2-1** DM uploads valid JPEG (≤5 MB) → `201 { attachmentId: <string> }`
- [ ] **T2-2** DM uploads valid PNG → `201 { attachmentId: <string> }`
- [ ] **T2-3** DM uploads valid WebP → `201 { attachmentId: <string> }`
- [ ] **T2-4** DM uploads valid GIF → `201 { attachmentId: <string> }`
- [ ] **T2-5** File size exactly 5,242,880 bytes (5 MB) → `201` (boundary: accepted)
- [ ] **T2-6** File size 5,242,881 bytes (5 MB + 1) → `413 { error: 'File exceeds 5 MB limit' }`
- [ ] **T2-7** MIME type `application/pdf` → `415 { error: 'Unsupported file type' }`
- [ ] **T2-8** MIME type `text/plain` → `415 { error: 'Unsupported file type' }`
- [ ] **T2-9** No `file` field in formData → `400 { error: 'file is required' }`
- [ ] **T2-10** Player role (not DM) → `403 Forbidden`
- [ ] **T2-11** Non-member → `403 Forbidden`
- [ ] **T2-12** Unauthenticated → `401 Unauthorized`
- [ ] **T2-13** Campaign does not exist → `404 Not Found`
- [ ] **T2-14** Orphaned pending file (>24h) for same campaign is deleted before insert (verify via GridFS find after upload)
- [ ] **T2-15** Recent pending file (<24h) for same campaign is NOT deleted

---

## T3 — `GET /api/campaigns/[id]/attachments/[attachmentId]`

Spec: `openspec/changes/gridfs-attachment-upload-serve/specs/gridfs-serve/spec.md`

File: `tests/integration/api/campaigns/[id]/attachments/[attachmentId]/route.test.ts`

- [ ] **T3-1** Active member fetches existing attachment → `200` with binary body and correct `Content-Type: image/jpeg`
- [ ] **T3-2** DM fetches existing attachment → `200` with binary body
- [ ] **T3-3** Active member fetches PNG → `200` with `Content-Type: image/png`
- [ ] **T3-4** Non-member → `403 Forbidden`
- [ ] **T3-5** Unauthenticated → `401 Unauthorized`
- [ ] **T3-6** Valid `attachmentId` but `metadata.campaignId` belongs to a different campaign → `404 Not Found` (not 403 — existence not revealed)
- [ ] **T3-7** `attachmentId` does not exist in GridFS → `404 Not Found`
- [ ] **T3-8** `attachmentId` is not a valid ObjectId hex string (e.g. `"not-an-id"`) → `400 { error: 'Invalid attachmentId' }`
