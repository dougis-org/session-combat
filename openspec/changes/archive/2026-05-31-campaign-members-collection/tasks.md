# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-members-collection` then immediately `git push -u origin feat/campaign-members-collection`

## Execution

### 1. Types — `lib/types.ts`

- [x] Add `export const MEMBER_ROLES = ['dm', 'player'] as const`
- [x] Add `export type MemberRole = (typeof MEMBER_ROLES)[number]`
- [x] Add `export type MemberStatus = 'active' | 'pending' | 'declined'`
- [x] Add `export interface CampaignMember` with fields: `_id?`, `id`, `campaignId`, `userId`, `role: MemberRole`, `status: MemberStatus`, `invitedBy`, `invitedAt: Date`, `respondedAt?: Date`
- [x] Add `export interface CampaignMemberSummary` with fields: `id`, `name`

### 2. Errors — `lib/errors.ts` (new file)

- [x] Create `lib/errors.ts` exporting `DuplicateMemberError extends Error` with `name = 'DuplicateMemberError'` and a message including both `campaignId` and `userId`

### 3. DB index — `lib/db.ts`

- [x] Inside `initializeDatabase()`, add a try/catch block (mirroring the `users.username` pattern) that creates a unique compound index on `campaignMembers.{ campaignId: 1, userId: 1 }`
- [x] Log `"Created index on campaignMembers.{campaignId, userId}"` on success

### 4. Storage methods — `lib/storage.ts`

- [x] Import `CampaignMember`, `CampaignMemberSummary`, `MemberRole`, `MemberStatus` from `./types`
- [x] Import `DuplicateMemberError` from `./errors`
- [x] Implement `addMember(member: CampaignMember): Promise<void>`
  - Insert into `campaignMembers` collection
  - Catch MongoDB error code 11000 and throw `DuplicateMemberError`
- [x] Implement `updateMember(campaignId: string, userId: string, role?: MemberRole, status?: MemberStatus): Promise<void>`
  - Build `$set` patch from non-undefined params only
  - `updateOne({ campaignId, userId }, { $set: patch })` — no-op if no match
- [x] Implement `listMembersForCampaign(campaignId: string): Promise<CampaignMember[]>`
  - `find({ campaignId }).toArray()` with `normalizeStoredEntityId` mapping
- [x] Implement `listCampaignsForMember(userId: string): Promise<CampaignMemberSummary[]>`
  - Query `campaignMembers` for all records with `userId`
  - Extract `campaignId[]`; early-return `[]` if empty
  - Query `campaigns` for `{ id: { $in: campaignIds } }`, project `{ id: 1, name: 1 }`
  - Return `{ id, name }[]`

### 5. Route seeding — `app/api/campaigns/route.ts`

- [x] Import `storage` (already imported), `CampaignMember` from `@/lib/types`
- [x] After `await storage.saveCampaign(campaign)` in the POST handler, call `await storage.addMember({ id: crypto.randomUUID(), campaignId: campaign.id, userId: auth.userId, role: 'dm', status: 'active', invitedBy: auth.userId, invitedAt: new Date() })`
- [x] Wrap both writes in a try/catch: if `addMember` throws, call `await storage.deleteCampaign(campaign.id, auth.userId)` and rethrow (let outer handler return 500)

### 6. Unit tests — `tests/unit/storage/campaigns.members.test.ts` (new file)

Tests must use mocked DB (existing pattern in `tests/unit/storage/`).

- [x] `addMember` — happy path: mock insert resolves, no error thrown
- [x] `addMember` — duplicate: mock insert rejects with `{ code: 11000 }`, assert `DuplicateMemberError` thrown
- [x] `updateMember` — status only: assert `$set` contains only `status`, not `role`
- [x] `updateMember` — role only: assert `$set` contains only `role`, not `status`
- [x] `updateMember` — both: assert `$set` contains both
- [x] `updateMember` — no match: mock `updateOne` returns `matchedCount: 0`, assert no error
- [x] `listMembersForCampaign` — returns normalized results
- [x] `listMembersForCampaign` — empty: returns `[]`
- [x] `listCampaignsForMember` — happy path: two campaigns returned as `CampaignMemberSummary[]`
- [x] `listCampaignsForMember` — no memberships: returns `[]` without querying campaigns
- [x] Route POST seeding — mock `saveCampaign` + `addMember` succeed, assert 201 returned
- [x] Route POST seeding — mock `addMember` throws, assert `deleteCampaign` called and 500 returned

### 7. Integration tests — `tests/integration/campaigns.members.integration.test.ts` (new file)

Tests run against real MongoDB (existing pattern in `tests/integration/`). Use a dedicated test DB / cleanup in `afterEach`.

- [x] `addMember` — inserts and `listMembersForCampaign` returns it
- [x] `addMember` — duplicate throws `DuplicateMemberError`
- [x] `addMember` — same user, different campaign: both succeed
- [x] `updateMember` — status update persisted
- [x] `updateMember` — role update persisted
- [x] `updateMember` — non-existent member: no error, no record created
- [x] `listMembersForCampaign` — returns correct members for campaign
- [x] `listMembersForCampaign` — returns empty for unknown campaign
- [x] `listCampaignsForMember` — returns correct `{ id, name }` for each campaign
- [x] `listCampaignsForMember` — returns empty for user with no memberships
- [x] POST `/api/campaigns` — response is 201 and `listMembersForCampaign` shows one active DM record

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run test:integration` — all tests pass
- [x] `npm run build` — build succeeds with no errors
- [x] TypeScript type check passes (no `tsc` errors)
- [x] All completed tasks marked as complete
- [ ] All steps in Remote push validation complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all must pass
- **Integration tests** — `npm run test:integration`; all must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and fix before pushing

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/campaign-members-collection` and push to remote
- [ ] Open PR from `feat/campaign-members-collection` to `main`. PR body MUST include `Closes #303` and `Closes #293` (partial — epic remains open until all sub-issues close, but note contribution).
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, run remote push validation, push to `feat/campaign-members-collection`, wait 180 seconds, repeat until no unresolved threads remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing check, run remote push validation, push, wait 180 seconds, repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration: `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: claude (AI agent)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test:unit && npm run test:integration && npm run build` → push → re-run checks
- Security finding → remediate → commit → validate → push → re-scan
- Review comment → address → commit → validate → push → confirm thread resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks as complete
- [ ] Update `openspec/specs/` with campaign-members capability spec (sync from `specs/campaign-members.md`)
- [ ] Archive the change: move `openspec/changes/campaign-members-collection/` to `openspec/changes/archive/YYYY-MM-DD-campaign-members-collection/` in a single commit (copy + delete staged together)
- [ ] Confirm archive path exists and `openspec/changes/campaign-members-collection/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-members-collection` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-members-collection`
- [ ] Open PR from doc branch to `main` with title `docs: archive campaign-members-collection (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop — address comments, fix CI, push to doc branch, repeat)
- [ ] Prune merged branches: `git fetch --prune` and `git branch -d feat/campaign-members-collection doc/archive-YYYY-MM-DD-campaign-members-collection`
