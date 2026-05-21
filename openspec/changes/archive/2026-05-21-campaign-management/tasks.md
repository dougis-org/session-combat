# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/campaign-management` then immediately `git push -u origin feature/campaign-management`

## Execution

### 1. Data model

- [x] Add `Campaign` interface to `lib/types.ts`:
  - Fields: `_id?: string`, `id: string`, `userId: string`, `name: string`, `moduleName: string`, `currentChapter: string`, `currentChapterOrder: number`, `active: boolean`, `createdAt: Date`, `updatedAt: Date`
- [x] Add `campaignId?: string` to the `Party` interface in `lib/types.ts`
- [x] Add `campaigns: Campaign[]` to `SessionData` in `lib/types.ts`
- [x] Verify: `npx tsc --noEmit`

### 2. Storage layer

- [x] Add to `lib/storage.ts`:
  - `loadCampaigns(userId: string): Promise<Campaign[]>`
  - `saveCampaign(campaign: Campaign): Promise<void>`
  - `deleteCampaign(id: string, userId: string): Promise<void>`
  - `loadCampaignById(id: string, userId: string): Promise<Campaign | null>`
- [x] Ensure all functions follow the existing pattern: `getDatabase()`, `collection("campaigns")`, filter by `userId`
- [x] Verify: `npx tsc --noEmit`

### 3. API routes

- [x] Create `app/api/campaigns/route.ts`:
  - `GET` — `requireAuth`, return `storage.loadCampaigns(userId)` as JSON
  - `POST` — `requireAuth`, validate `name`, build Campaign object with `crypto.randomUUID()`, call `storage.saveCampaign`, return 201
- [x] Create `app/api/campaigns/[id]/route.ts`:
  - `GET` — `requireAuth`, `storage.loadCampaignById(id, userId)`, return 404 if not found
  - `PATCH` — `requireAuth`, validate id ownership, update allowed fields, `storage.saveCampaign`, return updated campaign
  - `DELETE` — `requireAuth`, `storage.deleteCampaign(id, userId)`, return 200/204
- [x] Verify: `npx tsc --noEmit`

### 4. Campaign Dashboard page

- [x] Create `app/campaigns/page.tsx`:
  - Fetch all campaigns from `GET /api/campaigns`
  - Render empty state with "New Campaign" CTA when no campaigns exist
  - Display campaign list: name, moduleName, currentChapter, active badge
  - Inline create form: name (required), moduleName, currentChapter, currentChapterOrder (number, default 0), active (checkbox)
  - Inline edit: click to edit any campaign field, save with PATCH
  - Delete with confirmation prompt
- [x] Update `app/layout.tsx`:
  - Add "Campaigns" as the **first** nav link, pointing to `/campaigns`
  - Update the default/root route to point to `/campaigns` (add redirect or update the root page)
- [x] Verify the app builds: `npm run build`

### 5. Parties UI — campaign selector

- [x] Add campaign selector (dropdown) to the party create/edit form in `app/parties/page.tsx` (or equivalent):
  - Fetches `GET /api/campaigns` to populate options
  - "None" as the default / no-campaign option
  - On save, includes `campaignId` in the POST/PATCH body if a campaign is selected
- [x] Handle graceful display when a party's `campaignId` references a deleted/missing campaign — show "No Campaign"
- [x] Verify: `npx tsc --noEmit`

### 6. Integration tests

- [x] Add integration tests for `GET /api/campaigns` (list, empty, user isolation)
- [x] Add integration tests for `POST /api/campaigns` (create with full fields, name-only defaults, missing name → 400)
- [x] Add integration tests for `GET /api/campaigns/[id]` (found, not found, wrong user → 404)
- [x] Add integration tests for `PATCH /api/campaigns/[id]` (partial update, active flag not enforced unique)
- [x] Add integration tests for `DELETE /api/campaigns/[id]` (delete, verify 404 after)
- [x] Add integration test: unauthenticated request to any campaign endpoint → 401
- [x] Add integration test: create party with `campaignId`, verify stored and returned
- [x] Verify: `npm run test:integration`

### 7. Unit tests

- [x] Add unit tests for `storage.loadCampaigns`, `storage.saveCampaign`, `storage.deleteCampaign`, `storage.loadCampaignById`
- [x] Verify: `npm run test:unit`

## Validation

- [x] `npm run test:unit` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] `npm run lint` — no lint errors
- [x] Manually verify: navigate to `/` → lands on Campaign Dashboard
- [x] Manually verify: "Campaigns" is first nav link
- [x] Manually verify: create a campaign, create a party with that campaign, both appear correctly
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Run the required pre-PR self-review from `.agent/skills/openspec-apply-change/SKILL.md` before committing
- [x] Commit all changes to `feature/campaign-management` and push to remote
- [x] Open PR from `feature/campaign-management` to `main`
- [x] Wait 120 seconds for agentic reviewers to post comments
- [x] **Monitor PR comments** — address each comment, commit fixes, follow Remote push validation, push; repeat until no unresolved comments remain
- [x] Enable auto-merge once all blocking review comments are resolved
- [x] **Monitor CI checks** — diagnose failures, fix, follow Remote push validation, push; repeat until all checks pass
- [x] Wait for the PR to merge — never force-merge; if a human force-merges, proceed to Post-Merge

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers + human review
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update `openspec/specs/` with approved spec deltas from `specs/campaign-crud/spec.md`, `specs/campaign-dashboard/spec.md`, `specs/campaign-party-association/spec.md`
- [x] Archive the change: move `openspec/changes/campaign-management/` to `openspec/changes/archive/YYYY-MM-DD-campaign-management/` — stage both the copy and the deletion in a **single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-management/` exists and `openspec/changes/campaign-management/` is gone
- [x] Commit and push the archive commit to `main`
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feature/campaign-management`
