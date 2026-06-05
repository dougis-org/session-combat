# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/upload-route-test-coverage` then immediately `git push -u origin feat/upload-route-test-coverage`

## Execution

### Task 1 — Fix 207 field-name mismatch in `app/monsters/import/page.tsx`

Update the 207 handler (lines 45–58) to read the correct fields from the route response:
- `result.count` (not `result.successCount`)
- `result.total` (not `result.totalCount`)
- `result.errors` (array of `{ index, message }`, not `result.failures`)

Format `result.errors` into a human-readable string (e.g., join entries as `"[index N]: message"` separated by `"; "`).

**Verify:** Start dev server and manually upload a JSON file with one valid and one invalid monster to confirm the partial-success message shows real numbers and error detail.

---

### Task 2 — Write unit tests: `tests/unit/api/monsters/upload.route.test.ts`

Create the file. Follow the pattern from `tests/unit/api/content/route.test.ts`:

```
jest.mock("@/lib/middleware")
jest.mock("@/lib/storage", () => ({ storage: { saveMonsterTemplate: jest.fn() } }))
```

Use `MOCK_AUTH`, `makeRouteRequest`, `itReturns401`, `itReturns500` from `tests/unit/helpers/route.test.helpers.ts`.

Required test cases (one `describe` block per logical group):

**`describe("POST /api/monsters/upload — auth")`**
- `itReturns401(POST, makeReq, mockedRequireAuth)`

**`describe("POST /api/monsters/upload — request parsing")`**
- malformed JSON body → 400 (construct a `NextRequest` with a non-JSON body string)

**`describe("POST /api/monsters/upload — document validation")`**
- missing `monsters` key → 400
- `monsters` not an array → 400
- empty `monsters` array → 400
- monster missing `name` → 400
- monster missing `maxHp` → 400

**`describe("POST /api/monsters/upload — successful save")`**
- single valid monster, `saveMonsterTemplate` resolves → 201, `body.count === 1`, `body.imported.length === 1`
- two valid monsters, both resolve → 201, `body.count === 2`

**`describe("POST /api/monsters/upload — partial and total failure")`**
- two valid monsters, first resolves, second rejects → 207, `body.count === 1`, `body.errors` is non-empty array
- one valid monster, `saveMonsterTemplate` rejects → 500
- `itReturns500(POST, makeValidReq, () => mockedSave.mockRejectedValue(new Error("DB")), mockedRequireAuth)`

**Verify:** `npm run test:unit -- --testPathPattern upload.route`

---

### Task 3 — Add integration tests to `tests/integration/monsters.integration.test.ts`

Append a new `describe("POST /api/monsters/upload", ...)` block after the existing tests. Register a separate test user (`"monster-upload-test"` slug) in a nested `beforeAll` for upload isolation.

Required test cases:
- valid `{ monsters: [{ name: "Upload Beast", maxHp: 22 }] }` → 201, then `GET /api/monsters` returns a monster with `name === "Upload Beast"`
- POST without auth cookie → 401
- POST with body `{}` (missing `monsters` key) → 400

**Verify:** Run the integration test suite and confirm the new describe block passes.

---

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] `npm run test:unit -- --testPathPattern upload.route` — all unit tests pass
- [x] `npm run test:unit` — full unit suite still passes (no regressions)
- [ ] Integration test suite passes with new upload describe block
- [x] `npm run build` — build succeeds with no type errors
- [x] Coverage report for `app/api/monsters/upload/route.ts` shows ≥85% statements

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run integration test suite; all tests must pass
- **Build** — `npm run build`; must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/upload-route-test-coverage` and push to remote
- [x] Open PR from `feat/upload-route-test-coverage` to `main`. PR body must include `Closes #244`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (use `--squash`; NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation, push to same branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any required failing check, commit, follow remote push validation, push, wait 180 seconds, repeat
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user — never force-merge

Ownership metadata:
- Implementer: (agent)
- Reviewer(s): @dougis
- Required approvals: 1

Blocking resolution flow:
- CI failure → fix → commit → `npm run test:unit` + `npm run build` → push → re-run checks
- Review comment → address → commit → validate locally → push → confirm thread resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete
- [x] No documentation updates required for this change
- [x] Sync approved spec deltas into `openspec/specs/` if applicable
- [ ] Archive the change: move `openspec/changes/upload-route-test-coverage/` to `openspec/changes/archive/YYYY-MM-DD-upload-route-test-coverage/` in a **single atomic commit** (stage both the copy and the deletion together — never split into two commits)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-upload-route-test-coverage/` exists and `openspec/changes/upload-route-test-coverage/` is gone
- [ ] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-upload-route-test-coverage` then `git push -u origin doc/archive-YYYY-MM-DD-upload-route-test-coverage`
- [ ] Open a PR from the doc branch to `main` with title `docs: archive upload-route-test-coverage (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (same loop — address comments and CI, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/upload-route-test-coverage doc/archive-YYYY-MM-DD-upload-route-test-coverage`
