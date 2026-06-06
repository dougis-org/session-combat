# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/accept-decline-api` then immediately `git push -u origin feat/accept-decline-api`

## Execution

### Task 1 — Make `User.username` required + add `PublicUser`

File: `lib/types.ts`

- [x] Change `username?: string` to `username: string` on the `User` interface
- [x] Add `PublicUser` interface: `export interface PublicUser { id: string; username: string; }`
- [x] Grep for all `User` object construction sites and add `username` where missing: `grep -rn "passwordHash\|tokenVersion" --include="*.ts" .`
- [x] Run `npm run build` to confirm no TypeScript errors

### Task 2 — Add storage methods: `getUserById`, `getUsersByIds`, `listInvitationsForUser`

File: `lib/storage.ts`

- [x] Add `getUserById(userId: string): Promise<PublicUser | null>`
  - Validate `userId` is a valid ObjectId (throw `InvalidUserIdError` from `lib/permissions.ts` if not)
  - Query `users` collection with `{ _id: { $eq: new ObjectId(userId) } }`, project `{ username: 1 }`
  - Return `{ id: userId, username: doc.username }` or `null`
- [x] Add `getUsersByIds(userIds: string[]): Promise<Record<string, string>>`
  - Return `{}` immediately for empty input
  - Filter to valid ObjectIds; query `users` collection with `{ _id: { $in: objectIds } }`, project `{ username: 1 }`
  - Return `{ [id.toString()]: doc.username }` map, omitting entries without username
- [x] Add `listInvitationsForUser(userId: string): Promise<CampaignMember[]>`
  - Query `campaignMembers` collection with `{ userId, status: "invited" }`
  - Normalize and return as `CampaignMember[]` (follow same pattern as `listMembersForCampaign`)
- [x] Verify TypeScript compiles: `npm run build`

### Task 3 — Add `PATCH /api/campaigns/[id]/members/me` route

File: `app/api/campaigns/[id]/members/me/route.ts` (new file)

- [x] Use `withAuthAndParams<{ id: string }>` middleware
- [x] Parse and validate body: `action` must be `"accept"` or `"decline"` → 400 if invalid
- [x] Call `storage.getMember(campaignId, auth.userId)` → 404 if null or `status: "removed"`
- [x] State machine:
  - `invited` + `accept` → call `updateMemberStatus(..., "active", ...)` → 200 `{ status: "active" }`
  - `invited` + `decline` → call `updateMemberStatus(..., "declined", ...)` → 200 `{ status: "declined" }`
  - `active` + `accept` → 200 `{ status: "active" }` (no DB write)
  - `declined` + `decline` → 200 `{ status: "declined" }` (no DB write)
  - `active` + `decline` → 409 `{ error: "You have already accepted this invitation" }`
  - `declined` + `accept` → 409 `{ error: "You have already declined this invitation" }`
- [x] Catch unexpected storage errors → 500 with `console.error`, no internals in response body
- [x] Verify TypeScript compiles: `npm run build`

### Task 4 — Add `GET /api/me/invitations` route

File: `app/api/me/invitations/route.ts` (new file — creates `me/` route area)

- [x] Use `withAuth` middleware
- [x] Call `storage.listInvitationsForUser(auth.userId)`
- [x] If empty, return `200 { invitations: [] }` immediately
- [x] Extract unique `campaignId` values; load campaign docs in parallel (query `campaigns` collection by `id`)
- [x] Extract unique inviter userIds from each member's last `action: "invited"` history entry
- [x] Call `storage.getUsersByIds(inviterUserIds)` for batch username lookup
- [x] Build response array: for each invitation, compose `{ id, campaignId, campaignName, invitedBy, invitedAt }` — use `"Unknown user"` if inviter username missing
- [x] Return `200 { invitations: [...] }`
- [x] Catch unexpected storage errors → 500 with `console.error`, no internals in response body
- [x] Verify TypeScript compiles: `npm run build`

### Task 5 — Unit tests: storage methods

Files:
- `tests/unit/storage/users.test.ts` (new)
- `tests/unit/storage/campaignMembers.test.ts` (add cases)

`users.test.ts`:
- [x] `getUserById` — found user returns `PublicUser`
- [x] `getUserById` — unknown userId returns `null`
- [x] `getUserById` — invalid ObjectId throws `InvalidUserIdError`
- [x] `getUsersByIds` — all users found → full map returned
- [x] `getUsersByIds` — some users missing → only found users in result
- [x] `getUsersByIds` — empty array → `{}`

`campaignMembers.test.ts`:
- [x] `listInvitationsForUser` — returns only `"invited"` memberships
- [x] `listInvitationsForUser` — returns `[]` when no pending invitations

### Task 6 — Unit tests: PATCH `/api/campaigns/[id]/members/me`

File: `tests/unit/api/campaigns/[id]/members/me.test.ts` (new)

- [x] `invited` + `accept` → 200 `{ status: "active" }`, `updateMemberStatus` called with `"active"`
- [x] `invited` + `decline` → 200 `{ status: "declined" }`, `updateMemberStatus` called with `"declined"`
- [x] `active` + `accept` → 200 `{ status: "active" }`, `updateMemberStatus` NOT called
- [x] `declined` + `decline` → 200 `{ status: "declined" }`, `updateMemberStatus` NOT called
- [x] `active` + `decline` → 409 `"You have already accepted this invitation"`
- [x] `declined` + `accept` → 409 `"You have already declined this invitation"`
- [x] No membership → 404 `"No invitation found"`
- [x] `removed` status → 404 `"No invitation found"`
- [x] Missing `action` field → 400
- [x] Invalid `action` value → 400
- [x] Unauthenticated → 401
- [x] Storage error → 500 with no internal details

### Task 7 — Unit tests: GET `/api/me/invitations`

File: `tests/unit/api/me/invitations.test.ts` (new)

- [x] Pending invitations returned with correct shape (`id`, `campaignId`, `campaignName`, `invitedBy`, `invitedAt`)
- [x] Empty array returned when no pending invitations
- [x] Re-invited member: `invitedBy` and `invitedAt` use the last `action: "invited"` history entry
- [x] Missing inviter username → `"Unknown user"` fallback
- [x] Single `getUsersByIds` call regardless of invitation count (no N+1)
- [x] Unauthenticated → 401
- [x] Storage error → 500 with no internal details

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill on all modified files. The primary agent must automatically address all findings before committing.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — no TypeScript errors, clean build
- [ ] Manually verify PATCH state machine against spec scenarios
- [ ] All tasks above marked complete

## Remote push validation

All must pass before opening or updating the PR:

- **Unit tests:** `npm run test:unit` — all pass
- **Build:** `npm run build` — no errors

If any fail, fix and iterate before pushing.

## PR and Merge

- [ ] Ensure `openspec-review-code` sub-agent was run and all findings addressed before final commit
- [ ] Commit all changes to `feat/accept-decline-api` and push
- [ ] Open PR to `main`. PR body must include `Closes #306`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (never `--admin`)
- [ ] Wait 180 seconds for CI and agentic reviewers
- [ ] **Monitor PR comments** — address each, commit fixes, validate locally, push, wait 180s, repeat until none unresolved
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failures, push, wait 180s, repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:
- Implementer: assigned agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → `npm run test:unit && npm run build` → push → re-check
- Review comment → address → commit → validate → push → confirm thread resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all tasks complete
- [ ] Sync approved spec deltas: copy `openspec/changes/accept-decline-api/specs/accept-decline-api/spec.md` to `openspec/specs/accept-decline-api/spec.md`
- [ ] Archive change: move `openspec/changes/accept-decline-api/` to `openspec/changes/archive/YYYY-MM-DD-accept-decline-api/` — stage copy + deletion in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-accept-decline-api/` exists and `openspec/changes/accept-decline-api/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-accept-decline-api` then push
- [ ] Open PR: title `docs: archive accept-decline-api (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop as implementation PR)
- [ ] Prune: `git fetch --prune` and `git branch -d feat/accept-decline-api doc/archive-YYYY-MM-DD-accept-decline-api`
