# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b extract-http-backoff-utils` then immediately `git push -u origin extract-http-backoff-utils`

## Execution

### Task 1 — Create `lib/import/http-utils.ts`

- [x] Create `lib/import/http-utils.ts` with:
  - `const MAX_BACKOFF_MS = 10_000` (file-scoped, not exported)
  - `export function calculateBackoffMs(attempt: number, retryAfterHeader?: string | null): number`
    - If `retryAfterHeader` is provided: `Math.min(parseInt(retryAfterHeader, 10) * 1000, MAX_BACKOFF_MS)`
    - Otherwise: `Math.min(1000 * Math.pow(2, attempt), MAX_BACKOFF_MS)`
  - `export async function handleRateLimitResponse(response: Response, attempt: number, retries: number): Promise<boolean>`
    - Reads `response.headers.get("Retry-After")`
    - Calls `calculateBackoffMs(attempt, retryAfter)`
    - If `attempt < retries`: sleeps for `backoffMs`, returns `true`
    - Otherwise: returns `false` immediately (no sleep)
- [x] Verify: `tsc --noEmit` passes

### Task 2 — Write unit tests for `http-utils.ts` (write tests before refactoring the adapter)

- [x] Create `tests/unit/import/http-utils.test.ts`
- [x] Test `calculateBackoffMs`:
  - attempt=0 → 1000
  - attempt=1 → 2000
  - attempt=2 → 4000
  - attempt=3 → 8000
  - attempt=4 → 10000 (cap)
  - attempt=5 → 10000 (still capped)
  - retryAfterHeader="5" → 5000
  - retryAfterHeader="30" → 10000 (cap)
  - retryAfterHeader="0" → 0
- [x] Test `handleRateLimitResponse`:
  - attempt=0, retries=3, no Retry-After → resolves `true`, sleep called with 1000
  - attempt=1, retries=3, Retry-After="3" → resolves `true`, sleep called with 3000
  - attempt=3, retries=3 → resolves `false`, no sleep called
- [x] Verify: `npm test -- tests/unit/import/http-utils.test.ts` passes

### Task 3 — Refactor `lib/import/open5eAdapter.ts`

- [x] Import `calculateBackoffMs` and `handleRateLimitResponse` from `./http-utils`
- [x] In `fetchWithBackoff`:
  - Remove both inline `Math.min(1000 * Math.pow(2, attempt), 10000)` expressions
  - Replace 429 branch with:
    ```ts
    if (response.status === 429) {
      if (await handleRateLimitResponse(response, attempt, retries)) continue;
      return response;
    }
    ```
  - Replace catch-path backoff with:
    ```ts
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, calculateBackoffMs(attempt)));
    }
    ```
- [x] Confirm no literal `10000` or `10_000` remains in `open5eAdapter.ts`
- [x] Verify: `tsc --noEmit` passes

### Task 4 — Run existing open5eAdapter tests

- [x] Run `npm test -- tests/unit/import/open5eAdapter` (or equivalent)
- [x] All existing tests must pass without modification

## Validation

- [x] Run full unit test suite: `npm test`
- [x] Run type check: `tsc --noEmit` (zero errors)
- [x] Run build: `npm run build` (succeeds)
- [x] Confirm no literal `10000` / `10_000` in `lib/import/open5eAdapter.ts`
- [x] Confirm `lib/import/http-utils.ts` exists and exports `calculateBackoffMs` and `handleRateLimitResponse`
- [x] All tasks above marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test`; all tests must pass
- **Type check** — `tsc --noEmit`; zero errors
- **Build** — `npm run build`; must succeed with no errors
- If **ANY** of the above fail, iterate and address the failure before pushing

## PR and Merge

- [ ] Commit all changes to `extract-http-backoff-utils` and push to remote
- [ ] Open PR from `extract-http-backoff-utils` to `main`; reference `closes #158` in the PR body
- [ ] Wait 120 seconds for agentic reviewers to post comments
- [ ] **Monitor PR comments** — address each comment, commit fixes, follow Remote push validation steps, push; repeat until no unresolved comments remain
- [ ] Enable auto-merge once no blocking review comments remain
- [ ] **Monitor CI checks** — diagnose failures, fix, commit, follow Remote push validation steps, push; repeat until all checks pass
- [ ] Wait for PR to merge — never force-merge; if a human force-merges, proceed to Post-Merge

Ownership metadata:

- Implementer: doug
- Reviewer(s): agentic reviewers + maintainer
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on main
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] No doc updates required (pure refactor, no public API change)
- [ ] Sync approved spec deltas: copy `openspec/changes/extract-http-backoff-utils/specs/http-utils/spec.md` to `openspec/specs/http-utils/spec.md`
- [ ] Archive the change: move `openspec/changes/extract-http-backoff-utils/` to `openspec/changes/archive/YYYY-MM-DD-extract-http-backoff-utils/` — stage both the new location and the deletion of the old location in a **single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-extract-http-backoff-utils/` exists and `openspec/changes/extract-http-backoff-utils/` is gone
- [ ] Commit and push the archive commit to main
- [ ] Prune merged branch: `git fetch --prune` and `git branch -d extract-http-backoff-utils`
