# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-active-session-lifecycle` then immediately `git push -u origin feat/campaign-active-session-lifecycle`

## Execution

### Task 1 — Add `activeSessionId` to `Campaign` type

- [x] In `lib/types.ts`, add `activeSessionId?: string` to the `Campaign` interface after `updatedAt` (line ~564).
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### Task 2 — Add `setActiveCampaignSession` to storage

- [x] In `lib/storage.ts`, add method `setActiveCampaignSession(campaignId: string, sessionId: string | null): Promise<void>`.
- [x] Implementation: `db.collection("campaigns").updateOne({ id: campaignId }, { $set: { activeSessionId: sessionId ?? null, updatedAt: new Date() } })`.
- [x] Ensure the method signature is added to the storage interface/type if one exists.
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### Task 3 — Verify `normalizeCampaign` pass-through

- [x] Confirm `normalizeCampaign` in `lib/storage.ts` (line ~54) passes `activeSessionId` through correctly when absent or null (spread-then-overwrite pattern; no code change expected).
- [x] Add a unit test confirming both cases (absent → absent, null → null).

### Task 4 — Create `app/api/campaigns/[id]/sessions/active/route.ts`

- [x] Create directory `app/api/campaigns/[id]/sessions/active/`.
- [x] Create `route.ts` with `POST` handler:
  - Call `assertCampaignAccess`; return result if it's a `NextResponse`.
  - Reject non-DM with 404.
  - If `campaign.activeSessionId` is set (non-null), return 409 `{ error: 'A session is already active' }`.
  - Build `SessionLog`: `id: crypto.randomUUID()`, `userId: campaign.userId`, `campaignId`, `sessionNumber: await storage.getNextSessionNumber(campaign.userId, campaignId)`, `datePlayed: new Date()`, `title: undefined`, `summary: undefined`, `events: []`, `milestone: false`, `createdAt: now`, `updatedAt: now`.
  - Call `storage.saveSessionLog(log)`.
  - Call `storage.setActiveCampaignSession(campaignId, log.id)`.
  - Return 201 with the new `SessionLog`.
- [x] Create `DELETE` handler in the same file:
  - Call `assertCampaignAccess`; return result if it's a `NextResponse`.
  - Reject non-DM with 404.
  - Read `force` query param: `const force = new URL(request.url).searchParams.get('force') === 'true'`.
  - If `!force` and `!campaign.activeSessionId`, return 404.
  - Capture `const closedSessionId = campaign.activeSessionId` (may be null for force path).
  - Call `storage.setActiveCampaignSession(campaignId, null)`.
  - Return 200 `{ sessionId: closedSessionId }`.
- [x] Verify TypeScript compiles: `npx tsc --noEmit`

### Task 5 — Write unit tests for storage method

- [x] In the relevant storage unit test file, add tests for `setActiveCampaignSession`:
  - Sets `activeSessionId` to the given string.
  - Sets `activeSessionId` to `null` when `null` is passed.
  - Updates `updatedAt`.
  - Uses `updateOne` (not full upsert).

### Task 6 — Write integration tests for the new endpoints

Following all acceptance criteria in `openspec/changes/campaign-active-session-lifecycle/specs/active-session-lifecycle/spec.md`:

- [x] POST success → 201, `SessionLog` returned, `GET` campaign shows `activeSessionId` matching.
- [x] POST with active session → 409 `{ error: 'A session is already active' }`.
- [x] DELETE success → 200 `{ sessionId }`, `GET` campaign shows `activeSessionId: null`.
- [x] DELETE with no active session → 404.
- [x] DELETE `?force=true` with stale session → 200, `activeSessionId: null`.
- [x] DELETE `?force=true` with no session → 200, `activeSessionId: null`.
- [x] After force-reset, POST succeeds (201, not 409).
- [x] SessionLog persists after DELETE: `GET /api/campaigns/:id/sessions` includes the closed session.
- [x] Non-DM POST → 404.
- [x] Non-DM DELETE → 404.
- [x] Unauthenticated POST → 401.
- [x] Unauthenticated DELETE → 401.
- [x] `normalizeCampaign` with absent `activeSessionId` → field absent in result.
- [x] `normalizeCampaign` with `null` `activeSessionId` → field is null in result.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npx tsc --noEmit` — no type errors
- [x] `npm run build` — build succeeds
- [x] All acceptance criteria scenarios from `specs/active-session-lifecycle/spec.md` covered by tests
- [x] All tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/campaign-active-session-lifecycle` and push to remote
- [ ] Open PR from `feat/campaign-active-session-lifecycle` to `main`. PR body must include `Closes #400`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: dougis
- Reviewer(s): agentic reviewers + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (no doc changes expected for this issue)
- [ ] Sync approved spec deltas into `openspec/specs/active-session-lifecycle/spec.md` (create if absent)
- [ ] Archive the change: move `openspec/changes/campaign-active-session-lifecycle/` to `openspec/changes/archive/YYYY-MM-DD-campaign-active-session-lifecycle/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-campaign-active-session-lifecycle/` exists and `openspec/changes/campaign-active-session-lifecycle/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-campaign-active-session-lifecycle` then `git push -u origin doc/archive-YYYY-MM-DD-campaign-active-session-lifecycle`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive campaign-active-session-lifecycle (YYYY-MM-DD)`. PR body: `Closes #400` (if not already closed by implementation PR).
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until it merges (same loop as implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/campaign-active-session-lifecycle doc/archive-YYYY-MM-DD-campaign-active-session-lifecycle`
