# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/member-aware-campaign-access` then immediately `git push -u origin feat/member-aware-campaign-access`

## Execution

### 1. Add `getMember` to storage

- [ ] In `lib/storage.ts`, add `getMember(campaignId: string, userId: string): Promise<CampaignMember | null>`
  - Query `campaignMembers` collection with `{ campaignId, userId }`
  - Normalize and strip `_id` before returning
  - Return `null` on not-found; rethrow on unexpected error
- [ ] Write unit test: member exists → returns CampaignMember; not found → returns null

### 2. Add `loadCampaignByIdAny` to storage

- [ ] In `lib/storage.ts`, add `loadCampaignByIdAny(id: string): Promise<Campaign | null>`
  - Query `campaigns` collection with `{ id }` only (no `userId` filter)
  - Apply `normalizeStoredEntityId` + `normalizeCampaign`
  - Return `null` on not-found; rethrow on unexpected error
- [ ] Write unit test: campaign exists → returns Campaign; not found → returns null

### 3. Add `assertCampaignAccess` utility

- [ ] In `lib/utils/campaign.ts`, add:
  ```ts
  export async function assertCampaignAccess(
    campaignId: string,
    userId: string,
  ): Promise<{ campaign: Campaign; role: MemberRole } | NextResponse>
  ```
  - Call `storage.getMember(campaignId, userId)`
  - If null or `status !== 'active'` → return `NextResponse.json({ error: 'Campaign not found' }, { status: 404 })`
  - Call `storage.loadCampaignByIdAny(campaignId)`
  - If null → return `NextResponse.json({ error: 'Campaign not found' }, { status: 404 })`
  - Return `{ campaign, role: member.role }`
- [ ] Add imports: `Campaign`, `MemberRole` from `@/lib/types`; `storage` from `@/lib/storage`; `NextResponse` from `next/server`
- [ ] Write unit tests covering all branches:
  - Active DM member → returns `{ campaign, role: 'dm' }`
  - Active player member → returns `{ campaign, role: 'player' }`
  - No member record → returns 404 NextResponse
  - Pending member → returns 404 NextResponse
  - Declined member → returns 404 NextResponse
  - Active member but campaign missing → returns 404 NextResponse

### 4. Refactor `app/api/campaigns/[id]/route.ts`

- [ ] Remove `findCampaign` helper
- [ ] GET: replace `findCampaign(id, auth.userId)` with `assertCampaignAccess(id, auth.userId)`; destructure `{ campaign }` from result
- [ ] PATCH: replace `findCampaign` with `assertCampaignAccess`; after access check add:
  ```ts
  if (role !== 'dm') return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  ```
- [ ] DELETE: same pattern as PATCH — `assertCampaignAccess` + `role !== 'dm'` → 404
- [ ] Add import for `assertCampaignAccess` from `@/lib/utils/campaign`; remove `Campaign` import if no longer needed directly
- [ ] Write/update route handler tests:
  - GET as player → 200 with campaign
  - GET as non-member → 404
  - PATCH as DM → 200
  - PATCH as player → 404
  - DELETE as DM → 200
  - DELETE as player → 404

### 5. Refactor `app/api/campaigns/[id]/sessions/route.ts`

- [ ] GET: replace `storage.loadCampaignById(campaignId, auth.userId)` guard with `assertCampaignAccess(campaignId, auth.userId)`; destructure `{ campaign }` (campaign not used in GET body, guard is the purpose)
- [ ] POST: same replacement; add `role !== 'dm'` → 404 check after access check
- [ ] Add import for `assertCampaignAccess`; remove direct `storage` import if storage is no longer called at the route level (it still is for `loadSessionLogs`/`saveSessionLog`, so keep it)
- [ ] Write/update route handler tests:
  - GET as player → 200 with session logs
  - GET as non-member → 404
  - POST as DM → 201
  - POST as player → 404

### 6. Refactor `app/api/campaigns/[id]/sessions/[sessionId]/route.ts`

- [ ] PATCH: add `assertCampaignAccess(campaignId, auth.userId)` at top of handler; add `role !== 'dm'` → 404 check; only then proceed to `storage.updateSessionLog`
- [ ] Add import for `assertCampaignAccess`
- [ ] Write/update route handler tests:
  - PATCH as DM → 200 (or 404 if sessionId not found — pre-existing behavior)
  - PATCH as player → 404
  - PATCH as non-member → 404

### 7. Refactor `app/api/campaigns/[id]/combat-events/route.ts`

- [ ] GET: add `assertCampaignAccess(id, auth.userId)` gate at top of handler; if denied return early; proceed to existing DB query (which already filters `userId: auth.userId`)
- [ ] Add import for `assertCampaignAccess`
- [ ] Write/update route handler tests:
  - GET as active player → 200 (their own events)
  - GET as non-member → 404

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [ ] `npm run test:unit` — all tests pass
- [ ] `npm run build` — no type errors, build succeeds
- [ ] All acceptance scenarios in `specs/campaign-access.md` covered by tests
- [ ] Confirm `assertCampaignAccess` is the only caller of `loadCampaignByIdAny` (grep check)
- [ ] All completed tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `feat/member-aware-campaign-access` to `main`. PR body must include: `Closes #304`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly resolve threads. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any required (blocking) CI check fails, diagnose and fix, commit fixes, follow all steps in [Remote push validation] then push; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: claude
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test:unit && npm run build` → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main: `git log --oneline -5`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No documentation updates needed (API behavior change only; no public-facing docs affected)
- [ ] Sync approved spec deltas: copy `openspec/changes/member-aware-campaign-access/specs/campaign-access.md` to `openspec/specs/campaign-access/spec.md` (create directory if needed)
- [ ] Archive the change: move `openspec/changes/member-aware-campaign-access/` to `openspec/changes/archive/YYYY-MM-DD-member-aware-campaign-access/` and stage both the copy and deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-member-aware-campaign-access/` exists and `openspec/changes/member-aware-campaign-access/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-member-aware-campaign-access` then `git push -u origin doc/archive-YYYY-MM-DD-member-aware-campaign-access`
- [ ] Open a PR from that branch to `main` with title `docs: archive member-aware-campaign-access (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until it merges (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/member-aware-campaign-access doc/archive-YYYY-MM-DD-member-aware-campaign-access`
