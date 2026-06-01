# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/user-search-endpoint` then immediately `git push -u origin feat/user-search-endpoint`

## Execution

### 1. Create route file scaffold

- [x] Create `app/api/users/search/route.ts` with `withAuth` wrapper and empty GET handler
- [x] Verify TypeScript compiles: `npm run build`

### 2. Add input validation

- [x] Validate `q` param: present, length 1–50 chars; return 400 otherwise
- [x] Write unit tests in `tests/unit/api/users/search/route.unit.test.ts` covering:
  - Missing `q` → 400
  - Empty `q` → 400
  - `q.length > 50` → 400
  - `q.length === 50` (boundary) → passes validation

### 3. Add rate limiting

- [x] Call `checkRateLimit(\`search:user:${auth.userId}\`, 20, 60_000)` at route entry; catch `RateLimitError` and return 429
- [x] Add unit test: mock `checkRateLimit` throwing `RateLimitError` → assert 429 response

### 4. Implement regex-escaped prefix DB query

- [x] Escape `q` for regex metacharacters: `/[.*+?^${}()|[\]\\]/g` → `\\$&`
- [x] Build MongoDB query: `{ username: { $regex: new RegExp('^' + escapedQ) }, _id: { $ne: new ObjectId(auth.userId) } }` with collation for case-insensitivity
- [x] Use projection `{ username: 1 }`, limit 15
- [x] Map results to `{ id: string; username: string }` (convert `_id` to string)
- [x] Return `{ results }` with status 200
- [x] Add unit test: assert regex escaping of metacharacter input produces correct escaped pattern

### 5. Write integration test

- [x] Create `tests/integration/users-search.integration.test.ts`
- [x] Seed test users with known usernames
- [x] Assert: prefix match returns correct users
- [x] Assert: caller is not in results
- [x] Assert: no PII fields (email, passwordHash, etc.) in response
- [x] Assert: unauthenticated request → 401
- [x] Assert: no matches → `{ results: [] }`
- [x] Assert: result count capped at 15 when more matches exist

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm run test:unit` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass
- [x] `npm run build` — build succeeds with no type errors
- [x] Manually verify no PII fields appear in response shape
- [x] All execution tasks marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/user-search-endpoint` and push to remote
- [x] Open PR from `feat/user-search-endpoint` to `main`. PR body must include `Closes #302`
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow Remote push validation, push to `feat/user-search-endpoint`; wait 180 seconds; repeat until no unresolved threads remain
- [x] **Monitor CI checks** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing checks, commit, follow Remote push validation, push; wait 180 seconds; repeat until all required checks pass
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user; never wait for a human to report the merge

Ownership metadata:

- Implementer: (agent)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally (`npm run test:unit && npm run test:integration && npm run build`) → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify `app/api/users/search/route.ts` appears on `main`
- [x] Mark all remaining tasks as complete
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/user-search-endpoint/` to `openspec/changes/archive/YYYY-MM-DD-user-search-endpoint/` — stage both the copy and the deletion in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-user-search-endpoint/` exists and `openspec/changes/user-search-endpoint/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-user-search-endpoint` then `git push -u origin doc/archive-YYYY-MM-DD-user-search-endpoint`
- [ ] Open PR from doc branch to `main` with title `docs: archive user-search-endpoint (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/user-search-endpoint doc/archive-YYYY-MM-DD-user-search-endpoint`
