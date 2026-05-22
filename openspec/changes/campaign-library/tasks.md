# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b feature/campaign-library` then immediately `git push -u origin feature/campaign-library`

## Execution

### Task 1 — Add CampaignChapter and CampaignTemplate types; update Campaign type

File: `lib/types.ts`

- [ ] Add `CampaignChapter` interface: `id`, `title`, `order`, `description?`, `levelRange?`, `location?`
- [ ] Add `CampaignTemplate` interface: `id`, `userId`, `isGlobal`, `name`, `moduleName`, `description?`, `chapters: CampaignChapter[]`, `createdAt`, `updatedAt`
- [ ] Add `chapters: CampaignChapter[]` and `currentChapterId?: string` and `templateId?: string` to `Campaign`
- [ ] Remove `currentChapter: string` and `currentChapterOrder: number` from `Campaign`
- [ ] Grep entire codebase for `currentChapter` and `currentChapterOrder` and fix all remaining references: `grep -rn "currentChapter\|currentChapterOrder" --include="*.ts" --include="*.tsx" .`

Verification: `npx tsc --noEmit` — zero type errors.

---

### Task 2 — Add storage functions for global campaign templates

File: `lib/storage.ts`

- [ ] Add `loadGlobalCampaignTemplates(): Promise<CampaignTemplate[]>` — queries `campaignTemplates` collection where `userId === GLOBAL_USER_ID`
- [ ] Add `saveCampaignTemplate(template: CampaignTemplate): Promise<void>` — upsert by `id`
- [ ] Add `deleteCampaignTemplate(id: string): Promise<void>` — delete by `id`

Verification: `npx tsc --noEmit` — zero type errors.

---

### Task 3 — API: GET and POST /api/campaigns/global

File: `app/api/campaigns/global/route.ts`

- [ ] `GET` — call `storage.loadGlobalCampaignTemplates()`, return `200` JSON array (no auth required)
- [ ] `POST` — call `requireAdmin(request)` first; validate `name` is present; construct `CampaignTemplate` with `userId: GLOBAL_USER_ID`, `isGlobal: true`, new UUID; call `storage.saveCampaignTemplate()`; return `201`
- [ ] `PUT` — call `requireAdmin(request)` first; return `501 Not Implemented` with message `"Seed not yet implemented"`
- [ ] Handle DB errors with `500` responses and `console.error` logging

Verification: `npx tsc --noEmit`

---

### Task 4 — API: DELETE /api/campaigns/global/[id]

File: `app/api/campaigns/global/[id]/route.ts`

- [ ] `DELETE` — call `requireAdmin(request)` first; call `storage.deleteCampaignTemplate(id)`; return `200` on success, `404` if not found
- [ ] Handle DB errors with `500`

Verification: `npx tsc --noEmit`

---

### Task 5 — API: POST /api/campaigns/global/[id]/copy

File: `app/api/campaigns/global/[id]/copy/route.ts`

- [ ] Require session auth (use existing session pattern — return `401` if no session)
- [ ] Load template by id; return `404` if not found
- [ ] Deep-copy chapters array, generating a new UUID for each chapter
- [ ] Construct new `Campaign`: `userId` from session, `name` and `moduleName` from template, `chapters` (deep copy), `currentChapterId` = first chapter's id if chapters present, `templateId` = template id, `active: false`
- [ ] Save via existing `storage.saveCampaign()` (or equivalent); return `201` with the new campaign
- [ ] Handle DB errors with `500`

Verification: `npx tsc --noEmit`

---

### Task 6 — Update CampaignEditor

File: `app/campaigns/CampaignEditor.tsx`

- [ ] Remove `currentChapter` text input and `currentChapterOrder` number input
- [ ] Remove corresponding `useState` hooks for those fields
- [ ] Update `handleSave` to omit the removed fields
- [ ] Add a read-only chapter list display (for copied campaigns): if `campaign.chapters.length > 0`, render the list of chapter titles with the current chapter indicated
- [ ] Do not add chapter editing UI in this iteration (out of scope)

Verification: `npx tsc --noEmit`; page renders without errors in browser.

---

### Task 7 — Campaign Catalog section on dashboard

File: `app/campaigns/page.tsx`

- [ ] Add `useEffect` / fetch call to `GET /api/campaigns/global` to load templates on mount
- [ ] Add loading and error state for the catalog fetch
- [ ] Render "Campaign Catalog" section below user campaigns
- [ ] Each template card: name, moduleName, chapter count, Copy button
- [ ] Copy button handler: POST to `/api/campaigns/global/${template.id}/copy`; on success refresh user campaigns list; show loading state during request; show inline error on failure
- [ ] Empty state message when catalog is empty
- [ ] Catalog fetch failure does not crash the page (caught and shown as error state)

Verification: Manual browser test — catalog renders, Copy creates a new campaign in the list.

---

## Validation

- [ ] `npx tsc --noEmit` — zero type errors
- [ ] `npm run test` — all unit tests pass
- [ ] `npm run test:integration` — all integration tests pass (includes new tests from tests.md)
- [ ] `npm run build` — build succeeds with no errors
- [ ] Manual smoke test: campaign dashboard loads, catalog section visible, Copy button creates campaign
- [ ] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test` — all tests pass
- **Integration tests** — `npm run test:integration` — all tests pass
- **Build** — `npm run build` — succeeds with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Run pre-PR self-review before committing
- [ ] Commit all changes to `feature/campaign-library` and push to remote
- [ ] Open PR from `feature/campaign-library` to `main`
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each, commit fixes, run remote push validation, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose any failure, fix, validate locally, push; repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic review + repo owner
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (copy new spec directories from `openspec/changes/campaign-library/specs/` to `openspec/specs/`)
- [ ] Archive: move `openspec/changes/campaign-library/` to `openspec/changes/archive/YYYY-MM-DD-campaign-library/` — stage both new location and deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-library/` exists and `openspec/changes/campaign-library/` is gone
- [ ] Commit and push the archive commit to main
- [ ] `git fetch --prune` and `git branch -d feature/campaign-library`

Required cleanup after archive: `git fetch --prune` and `git branch -d feature/campaign-library`
