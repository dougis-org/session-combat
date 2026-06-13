# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/308-player-invitations-inbox` then immediately `git push -u origin feat/308-player-invitations-inbox`

## Execution

### Task 1 — Create `lib/components/Toast.tsx`

- [x] Create `lib/components/Toast.tsx` exporting:
  - `useToast()` hook returning `{ toast, showToast }` where `toast` is `{ message: string; type: 'success' | 'error' } | null`
  - `showToast(message: string, type: 'success' | 'error')` sets toast state and schedules auto-clear after 3000ms
  - `<Toast toast={toast} />` component renders `null` when `toast` is null; otherwise renders a `fixed bottom-6 right-6` pill with green (success) or red (error) background
- [x] Verify: component renders and auto-dismisses in isolation (covered by unit tests in Task 4)

### Task 2 — Update `lib/components/NavBar.tsx`

- [x] Add `useEffect` that fetches `GET /api/me/invitations` when `isAuthenticated && !loading`; store count in local state (default 0)
- [x] Wrap fetch in try/catch — failure silently leaves count at 0 (no badge)
- [x] When count > 0, render `<Link href="/invitations" className="...">Invitations ({count})</Link>` with a yellow count pill
- [x] When count === 0 or unauthenticated, render nothing for the invitations link
- [x] Style: use `text-yellow-400` for the badge to distinguish from standard nav links

### Task 3 — Create `app/invitations/page.tsx`

- [x] Create `app/invitations/page.tsx` with default export wrapping `InvitationsContent` in `<ProtectedRoute>`
- [x] `InvitationsContent` fetches `GET /api/me/invitations` on mount; shows `<LoadingState>` while loading, `<ErrorBanner>` on error
- [x] On success, render a list of invite rows. Each row shows:
  - Campaign name (bold)
  - "Invited by: {invitedBy}"
  - Relative time string from `invitedAt` (e.g., "2 days ago") — use a small inline `relativeTime(date: string): string` helper
  - "Accept" button (green) and "Decline" button (gray/red outline)
- [x] Empty state: centred "No pending invitations" message (styled as `text-gray-400`)
- [x] Accept handler: calls `PATCH /api/campaigns/{campaignId}/members/me` with `{ action: "accept" }`, removes invite from list on success, calls `showToast(\`Joined "\${campaignName}"!\`, 'success')`, sets `ErrorBanner` on failure
- [x] Decline handler: calls `PATCH /api/campaigns/{campaignId}/members/me` with `{ action: "decline" }`, removes invite from list on success, calls `showToast(\`Declined "\${campaignName}"\`, 'success')`, sets `ErrorBanner` on failure
- [x] Mount `<Toast toast={toast} />` at bottom of component
- [x] After any respond action succeeds, re-fetch `GET /api/me/invitations` to reconcile list

### Task 4 — Write unit tests for `Toast` component

File: `tests/unit/components/Toast.test.tsx`

- [x] Test: `showToast` renders the toast with correct message and success styling
- [x] Test: `showToast` renders error variant with error styling
- [x] Test: toast auto-dismisses after 3000ms (use `jest.useFakeTimers()`)
- [x] Test: no toast rendered initially

### Task 5 — Write unit tests for `InvitationsPage`

File: `tests/unit/components/InvitationsPage.test.tsx`

- [x] Test: renders invite rows with campaign name, invitedBy, relative time
- [x] Test: renders empty state when invitations list is empty
- [x] Test: renders loading state while fetch is pending
- [x] Test: renders error banner when fetch fails
- [x] Test: Accept click calls PATCH with `{ action: "accept" }`, removes invite from list, shows success toast
- [x] Test: Decline click calls PATCH with `{ action: "decline" }`, removes invite from list, shows success toast
- [x] Test: Accept failure renders error banner and keeps invite in list
- [x] Test: Decline failure renders error banner and keeps invite in list

### Task 6 — Write / update unit tests for `NavBar`

File: `tests/unit/components/NavBar.test.tsx` (create if not exists)

- [x] Test: renders "Invitations (2)" link when fetch returns 2 invitations
- [x] Test: does not render invitations link when fetch returns empty list
- [x] Test: does not render invitations link when unauthenticated
- [x] Test: does not render invitations link when fetch throws error

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit -- --testPathPattern="Toast|InvitationsPage|NavBar"` — all new and updated tests pass
- [x] `npm run test:unit` — full test suite passes with no regressions
- [x] `npm run build` — build succeeds with no type errors
- [x] `npm run lint` — no lint errors
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Lint** — `npm run lint` — must pass

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `feat/308-player-invitations-inbox` and push to remote
- [ ] Open PR from `feat/308-player-invitations-inbox` to `main`. PR body must include `Closes #308`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, validate locally, push; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll with `gh pr checks <PR-URL> --json isRequired,state`; fix any required failures, validate locally, push; wait 180 seconds; repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify user

Ownership metadata:

- Implementer: @dougis
- Reviewer(s): automated (CI + agentic review)
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec delta to `openspec/specs/invitations-inbox/spec.md` (create directory if needed; update relative references in spec to point to `../../changes/archive/YYYY-MM-DD-player-invitations-inbox/design.md` and `../../changes/archive/YYYY-MM-DD-player-invitations-inbox/tasks.md`)
- [x] Archive the change: move `openspec/changes/player-invitations-inbox/` to `openspec/changes/archive/YYYY-MM-DD-player-invitations-inbox/` — stage both the new location and the deletion of the old in **a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-player-invitations-inbox/` exists and `openspec/changes/player-invitations-inbox/` is gone
- [x] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-player-invitations-inbox` then `git push -u origin doc/archive-YYYY-MM-DD-player-invitations-inbox`
- [x] Open PR from doc branch to `main` with title `docs: archive player-invitations-inbox (YYYY-MM-DD)` — do NOT push directly to `main`
- [x] **IMMEDIATELY** enable auto-merge on doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor doc PR until merged (same loop as implementation PR)
- [x] Prune merged local branches: `git fetch --prune` && `git branch -d feat/308-player-invitations-inbox doc/archive-YYYY-MM-DD-player-invitations-inbox`
