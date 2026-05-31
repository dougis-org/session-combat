# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/username-validation-and-registration` then immediately `git push -u origin feat/username-validation-and-registration`

## Execution

### Task 1 — Implement `lib/validation/username.ts`

- [x] Create `lib/validation/username.ts` exporting `validateUsername(value: unknown): ValidationResult`
- [x] Implement non-string / missing input guard (return `valid: false` with `field: "username"`)
- [x] Implement length check: min 4, max 20 characters
- [x] Implement charset check: regex `/^[a-zA-Z0-9_-]+$/`
- [x] Implement reserved word check: compare `value.toLowerCase()` against `["admin", "root", "system", "support", "moderator", "api", "null", "undefined"]`
- [x] Return `{ valid: true, errors: [] }` when all checks pass
- [x] Write unit tests in `tests/unit/lib/validation/username.test.ts` covering all scenarios in `specs/username-validation/spec.md`:
  - Valid username passes
  - Length boundary values: 3 chars rejected, 4 accepted, 20 accepted, 21 rejected
  - Disallowed chars: space, `@`, `.`
  - Allowed chars: hyphen, underscore
  - Each reserved word in lowercase
  - Each reserved word in mixed casing (`Admin`, `ADMIN`, etc.)
  - Non-string input: `null`, `undefined`, `42`, `{}`

### Task 2 — Update `app/api/auth/register/route.ts`

- [x] Read `username` from the request body alongside `email` and `password`
- [x] Add `username` to the "required fields" check — return `400` if absent
- [x] Call `validateUsername(username)` — return `400` with validation errors if invalid
- [x] Remove the existing pre-insert email `findOne` check for username (rely on DB index for username uniqueness; keep email `findOne` as-is)
- [x] Catch `MongoServerError` with `code === 11000` after `insertOne`:
  - Inspect `error.keyPattern` to determine whether `username` or `email` caused the conflict
  - If `username`: return `409 { error: "Username already taken" }`
  - If `email`: return `409 { error: "User with this email already exists" }` (same message as current behaviour)
- [x] Include `username` in the `newUser` document passed to `insertOne`
- [x] Include `username` in the `201` response body: `{ userId, email, username, message }`

### Task 3 — Update `app/api/auth/me/route.ts`

- [x] In the existing `GET` handler, read `username` from the `getUserById` result (it is already fetched for `isAdmin`)
- [x] Add `username` to the `NextResponse.json(...)` payload alongside existing fields

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit tests: `npm run test:unit` — all tests must pass
- [x] Run integration tests: `npm run test:integration` — all tests must pass
- [x] Run type check: `npx tsc --noEmit` — no errors
- [x] Run build: `npm run build` — succeeds
- [x] Run linter: `npm run lint` — no new violations
- [x] All completed tasks marked as complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — `npm run test:integration`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `feat/username-validation-and-registration` to `main`. PR body must include `Closes #301`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user

Ownership metadata:

- Implementer: claude
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on the default branch
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec deltas into `openspec/specs/`:
  - Add `openspec/specs/username-validation/spec.md`
  - Add `openspec/specs/username-registration/spec.md`
  - Update `openspec/specs/auth-me/spec.md` (or create if absent)
- [x] Archive the change: move `openspec/changes/username-validation-and-registration/` to `openspec/changes/archive/YYYY-MM-DD-username-validation-and-registration/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-username-validation-and-registration/` exists and `openspec/changes/username-validation-and-registration/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-username-validation-and-registration` then `git push -u origin doc/archive-YYYY-MM-DD-username-validation-and-registration`
- [x] Open a PR from the doc branch to `main` with title `docs: archive username-validation-and-registration (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feat/username-validation-and-registration doc/archive-YYYY-MM-DD-username-validation-and-registration`
