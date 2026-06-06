# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-member-management-ui` then immediately `git push -u origin feat/campaign-member-management-ui`

## Execution

### task-1: Read anatomy.md and cerebrum.md

- [x] Read `.wolf/anatomy.md` to understand file locations before writing any code
- [x] Read `.wolf/cerebrum.md` Do-Not-Repeat section before writing any code

### task-2: Read existing reference files

- [x] Read `app/api/campaigns/[id]/members/route.ts` (existing POST handler — model GET alongside it)
- [x] Read `app/campaigns/[id]/sessions/page.tsx` (UI pattern to follow)
- [x] Read `lib/components/ui.tsx` (component palette)
- [x] Read `lib/storage.ts` — confirm signatures of `listMembersForCampaign`, `updateMemberStatus`, `getMember`
- [x] Read `lib/types.ts` — confirm `CampaignMember`, `MemberStatus`, `MemberRole`

### task-3: Add GET /api/campaigns/[id]/members

- [x] In `app/api/campaigns/[id]/members/route.ts`, add a `GET` export using `withAuthAndParams<{ id: string }>`
- [x] Guard: call `getMember(campaignId, auth.userId)` — return `403` if not an active member
- [x] Fetch: call `listMembersForCampaign(campaignId)`
- [x] Enrich: collect all `userId` values, query `db.collection('users').find({ _id: { $in: [...ObjectId] } }, { projection: { username: 1 } })`, merge usernames into response
- [x] Return `{ members: [{ id, userId, username, role, status }] }`
- [x] **Verify:** `npm run test:unit -- --testPathPattern="campaigns/\[id\]/members"` passes (write test first — see task-3 in tests.md)

### task-4: Add DELETE /api/campaigns/[id]/members/[userId]

- [x] Create `app/api/campaigns/[id]/members/[userId]/route.ts`
- [x] Export `DELETE` using `withAuthAndParams<{ id: string; userId: string }>`
- [x] Guard: caller must be active DM (`getMember` check, role `dm`, status `active`) — return `403` if not
- [x] Guard: caller cannot remove themselves — return `400` if `auth.userId === params.userId`
- [x] Fetch target: `getMember(campaignId, params.userId)` — return `404` if not found
- [x] Guard: target must have `status: "active"` or `status: "invited"` — return `404` otherwise
- [x] Action: `updateMemberStatus(campaignId, params.userId, 'removed', auth.userId)`
- [x] Return `200 { status: 'removed' }`
- [x] **Verify:** `npm run test:unit -- --testPathPattern="campaigns/\[id\]/members/\[userId\]"` passes

### task-5: Create app/campaigns/[id]/page.tsx

- [x] Create `app/campaigns/[id]/page.tsx` with `'use client'` directive
- [x] Import: `useParams`, `useState`, `useEffect`, `useCallback` from React/Next; `ProtectedRoute`, `ErrorBanner`, `LoadingState`, `textInputClass` from `lib/components`; `useAuth` from `lib/hooks/useAuth`
- [x] On mount: fetch `GET /api/campaigns/[id]` (campaign name) and `GET /api/campaigns/[id]/members`
- [x] Derive `isDM`: check if the current user's member entry has `role === 'dm'` and `status === 'active'`
- [x] Render member list — `MemberRow` component per member:
  - Username
  - Role badge: "DM" (blue) or "Player" (gray)
  - Status badge: "Active" (green), "Invited" (yellow/amber), "Removed" (gray), "Declined" (gray)
  - Remove button (DM only, hidden on own row, only for active/invited members)
- [x] Render `InviteSection` (DM only):
  - Text input bound to `searchQuery` state
  - Debounce (300ms) → `GET /api/users/search?q=<query>` when query ≥ 1 char
  - Results dropdown with "Invite" button per result
  - On invite: `POST /api/campaigns/[id]/members { userId }` → refresh member list → clear search
  - Inline error on 409
- [x] Remove handler: `DELETE /api/campaigns/[id]/members/[userId]` → refresh member list
- [x] Back link to `/campaigns`
- [x] Default export: `CampaignMembersPage` wrapped in `<ProtectedRoute>`

### task-6: Add Members link to campaigns/page.tsx

- [x] In `app/campaigns/page.tsx`, add a `<Link href={`/campaigns/${campaign.id}`}>Members</Link>` alongside the existing sessions/prompts/library links on each campaign card

### task-7: Update .wolf files

- [x] Append entries to `.wolf/memory.md` for each significant action
- [x] Update `.wolf/anatomy.md` with new files: `app/api/campaigns/[id]/members/route.ts` (updated), `app/api/campaigns/[id]/members/[userId]/route.ts` (new), `app/campaigns/[id]/page.tsx` (new)
- [x] Update `.wolf/cerebrum.md` with any learnings

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [ ] `npm run test:unit` — all unit tests pass
- [ ] `npm run test:integration` — all integration tests pass
- [ ] `npm run test:e2e` (if applicable) — all E2E tests pass
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — build succeeds
- [ ] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/campaign-member-management-ui` and push to remote
- [ ] Open PR from `feat/campaign-member-management-ui` to `main`. PR body MUST include `Closes #307`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; address, commit fixes, follow remote push validation, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, validate locally, push; wait 180 seconds; repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user; never force-merge

Ownership metadata:
- Implementer: claude (agent)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/campaign-member-management-ui/` to `openspec/changes/archive/YYYY-MM-DD-campaign-member-management-ui/` **in a single commit** (stage both copy and deletion together — never two separate commits)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-member-management-ui/` exists and `openspec/changes/campaign-member-management-ui/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-member-management-ui` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-member-management-ui`
- [ ] Open PR from doc branch to `main` with title `docs: archive campaign-member-management-ui (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until merged (same loop — address comments and CI, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/campaign-member-management-ui doc/archive-YYYY-MM-DD-campaign-member-management-ui`
