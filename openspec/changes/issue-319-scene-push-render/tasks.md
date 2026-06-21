# Tasks

## Preparation

- [x] **Step 0 — Merge prerequisite:** Confirm `feat/gridfs-attachment-upload-serve` is merged to `main` (verify `lib/types.ts` contains `MessageKind`, `CampaignMessage.kind`, and `CampaignMessage.attachmentId`). If not merged, merge or rebase it first before proceeding.
- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/issue-319-scene-push-render` then immediately `git push -u origin feat/issue-319-scene-push-render`

## Execution

### T1 — Extend POST /messages to accept scene kind

Files: `app/api/campaigns/[id]/messages/route.ts`

- [x] Accept optional `kind: MessageKind` and optional `attachmentId: string` from request body
- [x] When `kind === 'scene'`:
  - Verify caller `role === 'dm'` (via member record already fetched); return 403 if not
  - Allow `text` to be empty or absent (caption is optional for scenes)
  - Require at least one of `text` (non-empty) or `attachmentId` to be present; return 400 if both absent/empty
  - Persist `kind` and `attachmentId` on the stored `CampaignMessage` document
- [x] When `kind` is absent or `'chat'`: existing validation unchanged (text required and non-empty; no DM gate)
- [x] SSE emission unchanged — scene messages emitted as `{ type: 'message', data: CampaignMessage }` with `canSeeMessage` filter (group scope)

### T2 — Push Scene button in CampaignChat

Files: `lib/components/CampaignChat.tsx`

- [x] Determine DM status: use the `members` state already fetched by `CampaignChat` — find the entry matching `user?.id` and check `role === 'dm'`
- [x] Render a "Push Scene" button below (or above) the chat composer, visible only when `isDM === true`
- [x] Button click opens `SceneComposer` (inline, replaces/overlays the composer area — not a modal)
- [x] When `SceneComposer` calls its `onSuccess(message)` callback, append the new message to the local `messages` state (prevent duplicate via `seenIds`) and close the composer
- [x] When `SceneComposer` calls its `onCancel` callback, close the composer without state change

### T3 — SceneComposer component

File: `lib/components/SceneComposer.tsx` (new)

Props: `{ campaignId: string; onSuccess: (msg: CampaignMessage) => void; onCancel: () => void }`

- [x] File input (`accept="image/jpeg,image/png,image/webp,image/gif"`)
- [x] Client-side validation on file select: type must be JPEG/PNG/WebP/GIF; size ≤ 5 MB; show inline error and disable Send if invalid
- [x] Optional caption `<textarea>` (max 5000 chars to match server limit)
- [x] Send button disabled when: no file selected, or file is invalid, or a submit is in progress
- [x] Send disabled when no file AND no caption (both empty = nothing to send)
- [x] On Send:
  1. POST `FormData` with `file` to `/api/campaigns/${campaignId}/attachments` → extract `attachmentId`
  2. On upload failure: display error, do NOT proceed to step 2; remain open
  3. POST `{ kind: 'scene', attachmentId, text: caption.trim() }` to `/api/campaigns/${campaignId}/messages` with `visibility: { scope: 'group' }`
  4. On message failure: display error, remain open
  5. On success: call `onSuccess(message)`
- [x] Cancel button: call `onCancel()`
- [x] Tailwind styling consistent with existing `CampaignChat` compose area

### T4 — SceneFeedItem component

File: `lib/components/SceneFeedItem.tsx` (new)

Props: `{ message: CampaignMessage; campaignId: string }`

- [x] Distinct visual container (e.g., a muted border + label "Scene" or similar — follow existing Tailwind patterns)
- [x] If `message.attachmentId`: render `<img src="/api/campaigns/${campaignId}/attachments/${message.attachmentId}" alt={message.text ?? 'Scene image'} className="max-h-48 w-auto cursor-pointer rounded" />`; clicking opens the enlarge overlay
- [x] If `message.text`: render caption below the image (or alone if no image)
- [x] Enlarge overlay: a `<dialog ref={dialogRef}>` with Tailwind `fixed inset-0 bg-black/80 flex items-center justify-center z-50`; clicking the backdrop (the dialog element itself outside the image) closes it via `dialogRef.current?.close()`; Escape closes natively
- [x] Image broken-load fallback: `onError` sets a boolean state; render a placeholder div or alt text instead
- [x] Update `ChatFeed` in `lib/components/CampaignChat.tsx` to render `<SceneFeedItem>` when `msg.kind === 'scene'`, existing bubble otherwise

### T5 — Unit tests: messages route (scene cases)

File: `tests/unit/api/campaigns/[id]/messages.route.test.ts`

- [x] DM POSTs scene with image + caption → 201, stored doc has kind/attachmentId/text
- [x] DM POSTs scene with image only (no text) → 201
- [x] DM POSTs scene with caption only (no attachmentId) → 201
- [x] DM POSTs scene with neither → 400
- [x] Non-DM POSTs kind:'scene' → 403
- [x] POST with no kind (chat) and empty text → 400 (unchanged)
- [x] POST with no kind (chat) and valid text → 201 (unchanged, kind absent in response)

### T6 — Integration tests: messages endpoint (scene cases)

File: `tests/integration/campaigns/messages.integration.test.ts`

- [x] DM can POST scene message → 201; retrieved message has kind:'scene'
- [x] Non-DM POST scene → 403
- [x] Scene with no text + no attachmentId → 400
- [x] Existing chat POST cases still pass

### T7 — Component tests: SceneComposer

File: `tests/unit/components/SceneComposer.test.tsx` (new)

- [x] Send button disabled when no file selected
- [x] Error shown for oversized file (> 5 MB); Send disabled
- [x] Error shown for invalid file type; Send disabled
- [x] Valid file + caption: calls POST /attachments then POST /messages in order
- [x] Upload failure: shows error, no /messages call
- [x] Message failure: shows error after upload succeeds
- [x] Cancel calls onCancel without network requests
- [x] onSuccess called with returned message on full success

### T8 — Component tests: SceneFeedItem

File: `tests/unit/components/SceneFeedItem.test.tsx` (new)

- [x] Scene with image: renders `<img>` with correct src
- [x] Scene with caption: renders caption text
- [x] Scene image only: no caption element rendered
- [x] Scene caption only: no `<img>` rendered
- [x] Clicking image calls `dialogRef.current.showModal()` (mock HTMLDialogElement)
- [x] Backdrop click calls `dialogRef.current.close()`
- [x] Broken image: `onError` triggers placeholder render

### T9 — Component tests: CampaignChat Push Scene button

File: `tests/unit/components/CampaignChat.test.tsx` (extend existing or new)

- [x] DM user: "Push Scene" button renders
- [x] Non-DM user: "Push Scene" button not rendered
- [x] Clicking "Push Scene" renders SceneComposer
- [x] SceneComposer onCancel hides composer
- [x] SceneComposer onSuccess appends message to feed and hides composer

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run test` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — build succeeds
- [x] All tasks T1–T9 marked complete

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — `npm run build` — must succeed with no errors
- Skip integration tests

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/issue-319-scene-push-render` and push to remote
- [ ] Open PR from `feat/issue-319-scene-push-render` to `main`. PR body must include: `Closes #319`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED` exit and notify the user:
  1. **Build and tests** — run all steps in Remote push validation; fix failures, commit, push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, validate, push, wait 180 seconds
  3. **CI check failures** — after all comments resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failures, commit, validate, push, wait 180 seconds; restart loop from step 1

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic CI reviewers
- Required approvals: 1 (or as configured on repo)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main` (`git log --oneline -5`)
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync spec delta to global spec: copy `openspec/changes/issue-319-scene-push-render/specs/scene-push-render/spec.md` to `openspec/specs/scene-push-render/spec.md`; update relative links from `../../design.md` → `../../changes/archive/YYYY-MM-DD-issue-319-scene-push-render/design.md` and `../../tasks.md` → `../../changes/archive/YYYY-MM-DD-issue-319-scene-push-render/tasks.md`
- [ ] Archive the change: move `openspec/changes/issue-319-scene-push-render/` to `openspec/changes/archive/YYYY-MM-DD-issue-319-scene-push-render/` — stage both copy and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-issue-319-scene-push-render/` exists and `openspec/changes/issue-319-scene-push-render/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-issue-319-scene-push-render` then `git push -u origin doc/archive-YYYY-MM-DD-issue-319-scene-push-render`
- [ ] Open a PR with title `docs: archive issue-319-scene-push-render (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges; address any comments or CI failures
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/issue-319-scene-push-render doc/archive-YYYY-MM-DD-issue-319-scene-push-render`
