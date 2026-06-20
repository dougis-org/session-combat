## GitHub Issues

- #318

## Why

- Problem statement: Scene images (maps, handouts) uploaded during a campaign session are not persisted — there is no storage layer for binary attachments. DMs cannot push visual scene content to players.
- Why now: Issue 7a is the prerequisite for 7b (DM "push scene" UI) and has no upstream dependency beyond Phase 1. It can be built in parallel with Phase 5 messaging work.
- Business/user impact: Without this, the Phase 7 scene-content feature is blocked. With it, DMs can upload images that survive Fly machine restarts and players can retrieve them during a session.

## Problem Space

- Current behavior: `CampaignMessage` supports text only. There is no endpoint for uploading or serving binary files. No GridFS bucket exists.
- Desired behavior: A DM can POST an image file to `/api/campaigns/[id]/attachments`, receive an `attachmentId`, and later reference it in a `CampaignMessage` with `kind: 'scene'`. Any active campaign member can GET that attachment by id; non-members are rejected.
- Constraints:
  - Fly.io ephemeral disk — files must live in MongoDB GridFS, not the local filesystem.
  - Native `mongodb` driver already in use; no Mongoose.
  - Next.js App Router buffers `request.formData()` in memory — acceptable at 5 MB max.
  - Upload is DM-only; serve is any active member.
- Assumptions:
  - The `mongodb` driver's `GridFSBucket` API is sufficient; no additional packages needed.
  - `assertCampaignAccess` from `lib/utils/campaign.ts` is the correct access-check primitive.
  - Orphan files are acceptable to exist for up to 24 h before cleanup.
  - `attachmentId` passed into POST `/messages` is trusted (not re-validated against GridFS).
- Edge cases considered:
  - File exceeds 5 MB — rejected with 413.
  - Unsupported MIME type — rejected with 415.
  - Non-DM member attempts upload — rejected with 403.
  - Non-member attempts serve — rejected with 403.
  - `campaignId` in URL does not match file's stored `metadata.campaignId` — rejected with 404.
  - Abandoned upload (Step 1 done, Step 2 never called) — swept by lazy orphan cleanup on next upload.
  - `attachmentId` is not a valid ObjectId hex string — rejected with 400.

## Scope

### In Scope

- `POST /api/campaigns/[id]/attachments` — upload image to GridFS (DM only), lazy orphan sweep before insert
- `GET /api/campaigns/[id]/attachments/[attachmentId]` — stream image from GridFS (any active member), enforcing campaignId match
- `lib/gridfs.ts` — `getAttachmentsBucket()`, `uploadAttachment()`, `openDownloadStream()`, `deleteOrphanedAttachments()`
- Extend `CampaignMessage` in `lib/types.ts` with optional `kind?: 'chat' | 'scene'` and `attachmentId?: string`
- Validation: MIME type allowlist (image/jpeg, image/png, image/webp, image/gif), 5 MB max size
- Lazy orphan sweep: delete GridFS files for same `campaignId` where `status: 'pending'` and `uploadedAt < now - 24h`

### Out of Scope

- DM "push scene" UI (issue #319 / Phase 7b)
- Marking attachments as `referenced` when a message uses them (kept simple — orphan sweep covers cleanup)
- Scheduled/cron-based orphan sweep
- Per-scene visibility or access beyond campaign membership
- Video, audio, or non-image file types
- Image resizing or thumbnail generation

## What Changes

- `lib/types.ts` — add `MessageKind` type; extend `CampaignMessage` with `kind?` and `attachmentId?`
- `lib/gridfs.ts` — new file with GridFS helper functions
- `app/api/campaigns/[id]/attachments/route.ts` — new POST handler
- `app/api/campaigns/[id]/attachments/[attachmentId]/route.ts` — new GET handler

## Risks

- Risk: GridFS bucket creation on first use races in concurrent cold starts
  - Impact: Low — `GridFSBucket` constructor is synchronous and idempotent; no migration needed
  - Mitigation: Instantiate bucket inside request handler via `getAttachmentsBucket()`; reuse `getDatabase()` which already handles connection pooling
- Risk: 5 MB files buffered in memory by Next.js formData()
  - Impact: Low at expected load; could spike memory under concurrent DM uploads
  - Mitigation: 5 MB limit enforced before GridFS write; acceptable for current scale
- Risk: Orphaned files accumulate if DMs repeatedly abandon step 2
  - Impact: MongoDB storage growth
  - Mitigation: Lazy sweep on each upload cleans per-campaign orphans >24h old

## Open Questions

No unresolved ambiguity remains. All design decisions were resolved during exploration:
- Two-step upload confirmed (not single atomic)
- Lazy sweep per campaign confirmed (not scheduled cron)
- 5 MB max, JPEG/PNG/WebP/GIF confirmed
- DM-only upload, any active member serve confirmed
- `attachmentId` trusted in POST /messages (no re-validation against GridFS)
- `campaignId` enforced on serve endpoint

## Non-Goals

- Real-time image delivery (images are fetched on demand via GET, not pushed via SSE)
- Access revocation after upload
- Audit logging of file access
- Virus/malware scanning

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
