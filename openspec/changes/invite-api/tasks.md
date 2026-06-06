# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/invite-api` then immediately `git push -u origin feat/invite-api`

## Execution

### 1. Update `MemberStatus`, add `MemberHistoryEntry`, update `CampaignMember` — `lib/types.ts`

- [x] Change `MemberStatus` to `"active" | "invited" | "declined" | "removed"` (remove `"pending"`, add `"removed"`)
- [x] Add `export interface MemberHistoryEntry { action: MemberStatus; by: string; at: Date; }`
- [x] Remove `invitedBy: string`, `invitedAt: Date`, `respondedAt?: Date` from `CampaignMember`
- [x] Add `history: MemberHistoryEntry[]` to `CampaignMember`
- [x] Verify: `npm run type-check` passes

### 2. Replace `updateMember` with `updateMemberStatus` — `lib/storage.ts`

- [x] Remove `updateMember` method
- [x] Add `updateMemberStatus(campaignId: string, userId: string, status: MemberStatus, actorId: string): Promise<void>`
  - Single `updateOne` with `{ $set: { status }, $push: { history: { action: status, by: actorId, at: new Date() } } }`
- [x] Update import if needed (no new imports required)
- [x] Verify: `npm run type-check` passes

### 3. Update DM owner seed — `app/api/campaigns/route.ts`

- [x] At the `addMember` call (line ~51), remove `invitedBy` and `invitedAt` fields
- [x] Add `history: [{ action: 'active' as const, by: auth.userId, at: new Date() }]`
- [x] Verify: `npm run type-check` passes

### 4. Update existing `addMember` unit tests

- [x] In `tests/unit/storage/campaignMembers.test.ts` (and `tests/unit/storage/campaigns.members.test.ts` if separate), replace `invitedBy`/`invitedAt` fields with `history: [{ action: 'active', by: <userId>, at: new Date() }]`
- [x] Verify: `npm run test:unit -- --testPathPattern=campaignMembers` passes

### 5. Add `updateMemberStatus` unit tests — `tests/unit/storage/campaignMembers.test.ts`

- [x] Test: status field updated to new value
- [x] Test: history entry appended with correct `action`, `by`, `at`
- [x] Test: previous history entries preserved
- [x] Test: member not found — no error thrown, no document modified
- [x] Verify: `npm run test:unit -- --testPathPattern=campaignMembers` passes

### 6. Add `POST /api/campaigns/[id]/members` route — `app/api/campaigns/[id]/members/route.ts`

- [x] Create file `app/api/campaigns/[id]/members/route.ts`
- [x] Implement `POST` handler with `withAuth`
- [x] Parse and validate request body: `userId` must be a non-empty string; return `400` if missing/invalid
- [x] Guard: self-invite check — `userId === auth.userId` → `400`
- [x] Guard: DM check — `getMember(campaignId, auth.userId)` must return a member with `role: 'dm'` and `status: 'active'`; else `403`
- [x] Upsert logic:
  - Call `getMember(campaignId, userId)` for target
  - No existing member → `addMember({ id: crypto.randomUUID(), campaignId, userId, role: 'player', status: 'invited', history: [{ action: 'invited', by: auth.userId, at: new Date() }] })` → `201 { id, status: 'invited' }`
  - Existing with `status: 'declined'` or `'removed'` → `updateMemberStatus(campaignId, userId, 'invited', auth.userId)` → `201 { id: existingMember.id, status: 'invited' }`
  - Existing with `status: 'active'` or `'invited'` → `409`
- [x] `DuplicateMemberError` from `addMember` → `409` (race condition safety net)
- [x] Unexpected errors → `500` (log server-side, no internals leaked)
- [x] Verify: `npm run type-check` passes

### 7. Add route unit tests — `tests/unit/api/campaigns/[id]/members/route.unit.test.ts`

- [x] Setup: mock `storage.getMember`, `storage.addMember`, `storage.updateMemberStatus`, `withAuth`
- [x] Test: successful new invite → `201 { id, status: 'invited' }`, `addMember` called with correct shape
- [x] Test: re-invite declined member → `201`, `updateMemberStatus` called with `'invited'`
- [x] Test: re-invite removed member → `201`, `updateMemberStatus` called with `'invited'`
- [x] Test: target already active → `409`
- [x] Test: target already invited → `409`
- [x] Test: self-invite → `400`
- [x] Test: missing `userId` in body → `400`
- [x] Test: caller is not a member → `403`
- [x] Test: caller is a player (not DM) → `403`
- [x] Test: unauthenticated → `401`
- [x] Test: `addMember` throws `DuplicateMemberError` → `409`
- [x] Test: storage throws unexpected error → `500`
- [x] Verify: `npm run test:unit -- --testPathPattern=members/route` passes

## Pre-Commit Code Review

- [x] **Before every commit**, spawn the `openspec-review-code` sub-agent. Automatically address all findings (complexity, duplication, quality) before committing.

## Validation

- [x] `npm run type-check` — no errors
- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — build succeeds
- [x] All execution tasks checked off
- [x] All steps in Remote push validation passed

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Type check** — `npm run type-check` — no errors
- **Build** — `npm run build` — must succeed with no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [ ] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes to `feat/invite-api` and push to remote
- [ ] Open PR from `feat/invite-api` to `main`. PR body must include `Closes #305`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow Remote push validation, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, follow Remote push validation, push; wait 180 seconds; repeat until all required checks pass
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user — never wait for a human to report the merge; never force-merge

Ownership metadata:

- Implementer: claude
- Reviewer(s): agentic review + human
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → Remote push validation → push → re-run checks
- Security finding → remediate → commit → Remote push validation → push → re-scan
- Review comment → address → commit → Remote push validation → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/invite-api/spec.md`
- [ ] Archive the change: move `openspec/changes/invite-api/` to `openspec/changes/archive/YYYY-MM-DD-invite-api/` **staging both new location and deletion in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-invite-api/` exists and `openspec/changes/invite-api/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-invite-api` then `git push -u origin doc/archive-YYYY-MM-DD-invite-api`
- [ ] Open PR with title `docs: archive invite-api (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune: `git fetch --prune` and `git branch -d feat/invite-api doc/archive-YYYY-MM-DD-invite-api`
