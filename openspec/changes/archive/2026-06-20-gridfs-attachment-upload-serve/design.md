## Context

- Relevant architecture:
  - Next.js App Router API routes under `app/api/`
  - Native `mongodb` driver; no Mongoose. `connectToDatabase()` / `getDatabase()` in `lib/db.ts`
  - `withAuthAndParams` middleware for auth + typed route params
  - `assertCampaignAccess(campaignId, userId)` → `{ campaign, role } | NextResponse` in `lib/utils/campaign.ts`
  - `CampaignMessage` interface in `lib/types.ts`
  - Fly.io deployment — ephemeral local disk, MongoDB Atlas for persistence
- Dependencies: MongoDB GridFS (`GridFSBucket` from native `mongodb` driver — already a dependency)
- Interfaces/contracts touched:
  - `CampaignMessage` type (extended with `kind` and `attachmentId`)
  - New REST endpoints: `POST /api/campaigns/[id]/attachments`, `GET /api/campaigns/[id]/attachments/[attachmentId]`

## Goals / Non-Goals

### Goals

- DM can upload an image (≤5 MB, JPEG/PNG/WebP/GIF) and receive an `attachmentId`
- Any active campaign member can stream the image by `attachmentId`
- Non-members are rejected with 403
- Files with mismatched `campaignId` are rejected with 404
- Orphaned pending uploads >24h are lazily swept on the next DM upload to the same campaign
- `CampaignMessage` type extended to express `kind` and `attachmentId` for Phase 7b

### Non-Goals

- DM "push scene" UI (Phase 7b)
- Scheduled orphan sweep
- Image resizing, thumbnails, virus scanning
- Non-image file types

## Decisions

### Decision 1: Two-step upload (separate upload and message creation)

- Chosen: `POST /api/campaigns/[id]/attachments` returns `attachmentId`; caller separately POSTs to `/messages` with `kind: 'scene'` and `attachmentId`
- Alternatives considered: Single atomic endpoint that creates the GridFS file and `CampaignMessage` in one request
- Rationale: Keeps the upload endpoint focused and reusable; decouples file storage from message creation; simpler to test each step independently
- Trade-offs: Risk of orphaned files if Step 2 is never called — mitigated by lazy orphan sweep

### Decision 2: Lazy orphan sweep per campaign on upload

- Chosen: Before inserting a new GridFS file, delete all files in the same campaign's GridFS bucket where `metadata.status === 'pending'` and `metadata.uploadedAt < now - 24h`
- Alternatives considered: (a) Scheduled cron job; (b) No sweep at all; (c) Marking files as `referenced` when a message uses them and sweeping unreferenced
- Rationale: Zero infrastructure overhead; runs naturally with DM upload activity; 24h window gives enough time for interrupted sessions
- Trade-offs: Orphans accumulate until the next DM upload; campaigns with no subsequent uploads never sweep. Acceptable at current scale.

### Decision 3: `lib/gridfs.ts` helper module

- Chosen: New `lib/gridfs.ts` exposing `getAttachmentsBucket(db)`, `uploadAttachment(...)`, `openDownloadStream(...)`, `deleteOrphanedAttachments(...)`
- Alternatives considered: Inline GridFS logic directly in route handlers
- Rationale: Keeps route handlers thin; GridFS logic is testable in isolation; consistent with `lib/storage.ts` pattern
- Trade-offs: One more file to maintain

### Decision 4: MIME type validated from parsed `FormData`, not Content-Type header

- Chosen: Read `file.type` from the `File` object returned by `request.formData()` and validate against allowlist
- Alternatives considered: Parse `Content-Type` of the multipart part headers directly
- Rationale: `request.formData()` already parses parts; `file.type` is the MIME type reported by the browser; consistent with how Next.js App Router exposes uploaded files
- Trade-offs: Browser-reported MIME type can be spoofed; acceptable risk for an internal DM tool

### Decision 5: `campaignId` enforced on serve by matching GridFS file metadata

- Chosen: On GET, after fetching the GridFS file info, verify `metadata.campaignId === campaignId` from the URL
- Alternatives considered: Trust that `attachmentId` is globally unique (ObjectId) and skip campaign check
- Rationale: Prevents cross-campaign data leakage if an `attachmentId` is guessed or shared
- Trade-offs: One extra GridFS metadata lookup before streaming

### Decision 6: `attachmentId` trusted in POST /messages (no re-validation)

- Chosen: The messages route accepts `attachmentId` as a string and stores it without verifying it exists in GridFS
- Alternatives considered: Look up GridFS file by id before accepting the message
- Rationale: DM-only upload flow; the `attachmentId` comes from the upload response in the same session; extra lookup adds latency for marginal safety gain
- Trade-offs: A stale or fabricated `attachmentId` could be stored in a message; the GET endpoint will 404 when it tries to stream

## Proposal to Design Mapping

- Proposal element: DM-only upload
  - Design decision: D1 (two-step POST /attachments), D3 (role check via assertCampaignAccess → role === 'dm')
  - Validation approach: Integration test with player role → expect 403

- Proposal element: Any active member can fetch
  - Design decision: D5 (campaignId enforced), assertCampaignAccess on GET
  - Validation approach: Integration test with active member → expect 200 stream; non-member → 403

- Proposal element: Lazy orphan sweep
  - Design decision: D2
  - Validation approach: Unit test `deleteOrphanedAttachments()` with mocked GridFS; integration test verifying old pending file deleted after new upload

- Proposal element: 5 MB limit, MIME allowlist
  - Design decision: D4
  - Validation approach: Integration tests with oversized file → 413; wrong MIME → 415

- Proposal element: Bytes survive Fly restart
  - Design decision: GridFSBucket writes to MongoDB Atlas (not local disk); verified by acceptance test

## Functional Requirements Mapping

- Requirement: DM uploads image → receives `attachmentId`
  - Design element: POST /api/campaigns/[id]/attachments, `uploadAttachment()` in lib/gridfs.ts
  - Acceptance criteria reference: specs/gridfs-upload/spec.md
  - Testability notes: Integration test; mock GridFS for unit tests

- Requirement: Active member fetches image by id
  - Design element: GET /api/campaigns/[id]/attachments/[attachmentId], `openDownloadStream()`
  - Acceptance criteria reference: specs/gridfs-serve/spec.md
  - Testability notes: Integration test streaming response

- Requirement: Non-member rejected
  - Design element: `assertCampaignAccess` in both handlers
  - Acceptance criteria reference: specs/gridfs-upload/spec.md, specs/gridfs-serve/spec.md
  - Testability notes: Integration test with unauthenticated or non-member user

- Requirement: Oversized/invalid files rejected
  - Design element: Size and MIME checks before GridFS write in POST handler
  - Acceptance criteria reference: specs/gridfs-upload/spec.md
  - Testability notes: Unit test validation logic; integration test with bad file

- Requirement: Orphan never permanent
  - Design element: `deleteOrphanedAttachments()` called in POST handler before upload
  - Acceptance criteria reference: specs/gridfs-orphan/spec.md
  - Testability notes: Unit test with time-shifted mock; integration test verifying deletion

- Requirement: `CampaignMessage` can reference attachment
  - Design element: `kind?` and `attachmentId?` fields on `CampaignMessage` interface
  - Acceptance criteria reference: specs/campaign-message-type/spec.md
  - Testability notes: TypeScript compilation; existing message tests must remain passing

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Files survive Fly machine restart
  - Design element: GridFSBucket backed by MongoDB Atlas
  - Acceptance criteria reference: specs/gridfs-serve/spec.md (acceptance test)
  - Testability notes: Confirmed by architecture (no local disk); not unit-testable

- Requirement category: security
  - Requirement: Cross-campaign isolation
  - Design element: D5 — `metadata.campaignId` checked on serve
  - Acceptance criteria reference: specs/gridfs-serve/spec.md
  - Testability notes: Integration test with mismatched campaignId → 404

- Requirement category: performance
  - Requirement: 5 MB max keeps memory spike bounded
  - Design element: D4 — size check before upload; formData() buffers in memory
  - Acceptance criteria reference: specs/gridfs-upload/spec.md
  - Testability notes: Integration test with 5 MB + 1 byte file

## Risks / Trade-offs

- Risk/trade-off: Browser-spoofed MIME type bypasses file type validation
  - Impact: Low — DM-only upload; internal tool
  - Mitigation: Accept risk; add magic-byte validation in a future hardening pass if needed

- Risk/trade-off: Campaigns with no subsequent DM uploads never trigger orphan sweep
  - Impact: Low storage growth
  - Mitigation: Acceptable at current scale; scheduled sweep can be added later

- Risk/trade-off: `formData()` buffers entire file in memory
  - Impact: Memory spike on concurrent uploads
  - Mitigation: 5 MB limit; DM-only reduces concurrency risk

## Rollback / Mitigation

- Rollback trigger: Serve endpoint streams corrupt data, upload silently loses bytes, or orphan sweep incorrectly deletes referenced files
- Rollback steps: Revert `lib/gridfs.ts` and both route files; revert `lib/types.ts` changes (additive only — safe to remove `kind?` and `attachmentId?`)
- Data migration considerations: GridFS `attachments` bucket can be dropped if needed; no relational FK constraints
- Verification after rollback: Run `npm run test:unit` and `npm run test:integration`; confirm no GridFS bucket in `db.listCollections()`

## Operational Blocking Policy

- If CI checks fail: Do not merge. Fix the root cause; do not use `--no-verify` or force push.
- If security checks fail: Treat as a blocker; investigate before proceeding.
- If required reviews are blocked/stale: Ping the reviewer after 24h; escalate to another reviewer after 48h.
- Escalation path and timeout: If no review after 48h, escalate to project maintainer.

## Open Questions

No open questions. All design decisions were resolved during exploration prior to proposal creation.
