# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/gridfs-attachment-upload-serve` then immediately `git push -u origin feat/gridfs-attachment-upload-serve`

## Execution

### T0 — Extend `CampaignMessage` type (`lib/types.ts`)

- [x] Add `export type MessageKind = 'chat' | 'scene';`
- [x] Add optional fields `kind?: MessageKind` and `attachmentId?: string` to `CampaignMessage`
- [x] Run `npm run test:unit` — all existing tests must pass (additive change only)
- [x] Run TypeScript check: `npx tsc --noEmit`

### T1 — Create `lib/gridfs.ts` helper module

- [x] Implement `getAttachmentsBucket(db: Db): GridFSBucket` — returns `new GridFSBucket(db, { bucketName: 'attachments' })`
- [x] Implement `uploadAttachment(bucket, file: File, campaignId: string): Promise<string>` — streams file to GridFS with metadata `{ campaignId, status: 'pending', uploadedAt: new Date(), contentType: file.type }`, returns hex ObjectId string
- [x] Implement `openDownloadStream(bucket, attachmentId: string): Promise<{ stream: GridFSBucketReadStream; contentType: string; campaignId: string }>` — opens download stream, reads file metadata, returns stream + stored contentType + metadata.campaignId; throws on not found or invalid id
- [x] Implement `deleteOrphanedAttachments(bucket, campaignId: string, thresholdMs?: number): Promise<void>` — deletes GridFS files where `metadata.campaignId === campaignId`, `metadata.status === 'pending'`, and `metadata.uploadedAt < now - thresholdMs (default 24h)`; errors are caught and logged (best-effort)
- [x] Write unit tests at `tests/unit/lib/gridfs.test.ts` covering each function with mocked GridFSBucket
- [x] Run `npm run test:unit` — all tests pass

### T2 — Create `app/api/campaigns/[id]/attachments/route.ts` (POST — upload)

- [x] Create directory `app/api/campaigns/[id]/attachments/`
- [x] Use `withAuthAndParams<{ id: string }>` pattern matching existing routes
- [x] Call `assertCampaignAccess` — check `role === 'dm'`, return 403 otherwise
- [x] Parse `request.formData()`, extract `file` field — return 400 if missing
- [x] Validate MIME type against allowlist `['image/jpeg', 'image/png', 'image/webp', 'image/gif']` — return 415 if invalid
- [x] Validate file size ≤ 5,242,880 bytes (5 MB) — return 413 if exceeded
- [x] Call `deleteOrphanedAttachments` (fire-and-await, swallow errors)
- [x] Call `uploadAttachment` — return 201 `{ attachmentId }`
- [x] Write integration tests at `tests/integration/api/campaigns/[id]/attachments/route.test.ts` covering all scenarios in `specs/gridfs-upload/spec.md`
- [x] Run `npm run test:unit` and `npm run test:integration` — all pass

### T3 — Create `app/api/campaigns/[id]/attachments/[attachmentId]/route.ts` (GET — serve)

- [x] Create directory `app/api/campaigns/[id]/attachments/[attachmentId]/`
- [x] Use `withAuthAndParams<{ id: string; attachmentId: string }>` pattern
- [x] Call `assertCampaignAccess` — any active member (DM or player); return 403 if not member
- [x] Validate `attachmentId` is a valid hex ObjectId — return 400 if not
- [x] Call `openDownloadStream` — return 404 if not found
- [x] Verify `metadata.campaignId === campaignId` from URL — return 404 if mismatch
- [x] Return streaming `Response` with `Content-Type` from stored metadata
- [x] Write integration tests at `tests/integration/api/campaigns/[id]/attachments/[attachmentId]/route.test.ts` covering all scenarios in `specs/gridfs-serve/spec.md`
- [x] Run `npm run test:unit` and `npm run test:integration` — all pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all pass
- [x] `npm run test:integration` — all pass
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] All scenarios in `specs/gridfs-upload/spec.md`, `specs/gridfs-serve/spec.md`, `specs/gridfs-orphan/spec.md`, and `specs/campaign-message-type/spec.md` are covered by tests

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build`; build must succeed with no errors
- Skip integration tests — not required when no code changed

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/gridfs-attachment-upload-serve` and push to remote
- [ ] Open PR from `feat/gridfs-attachment-upload-serve` to `main`. PR body MUST include `Closes #318`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge; use `--squash` per repo ruleset)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/gridfs-attachment-upload-serve/specs/gridfs-upload/spec.md` → `openspec/specs/gridfs-upload/spec.md`
  - Copy `openspec/changes/gridfs-attachment-upload-serve/specs/gridfs-serve/spec.md` → `openspec/specs/gridfs-serve/spec.md`
  - Copy `openspec/changes/gridfs-attachment-upload-serve/specs/gridfs-orphan/spec.md` → `openspec/specs/gridfs-orphan/spec.md`
  - Copy `openspec/changes/gridfs-attachment-upload-serve/specs/campaign-message-type/spec.md` → `openspec/specs/campaign-message-type/spec.md`
  - Update relative links in each copied spec: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-gridfs-attachment-upload-serve/design.md` and `../../tasks.md` with `../../changes/archive/YYYY-MM-DD-gridfs-attachment-upload-serve/tasks.md`
- [ ] Archive the change: move `openspec/changes/gridfs-attachment-upload-serve/` to `openspec/changes/archive/YYYY-MM-DD-gridfs-attachment-upload-serve/` **in a single atomic commit** (stage both the new location and the deletion of the old location together)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-gridfs-attachment-upload-serve/` exists and `openspec/changes/gridfs-attachment-upload-serve/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-gridfs-attachment-upload-serve` then `git push -u origin doc/archive-gridfs-attachment-upload-serve`
- [ ] Open a PR from `doc/archive-gridfs-attachment-upload-serve` to `main` with title `docs: archive gridfs-attachment-upload-serve (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until it merges; address any comments or CI failures
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/gridfs-attachment-upload-serve doc/archive-gridfs-attachment-upload-serve`
