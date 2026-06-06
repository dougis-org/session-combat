# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b mock-withauth-in-unit-tests` then immediately `git push -u origin mock-withauth-in-unit-tests`

## Execution

- [x] **Sub-task 1 — Update route test helpers:**
  - Update `tests/unit/helpers/route.test.helpers.ts` to export `mockAuthState`.
  - Modify `itReturns401`, `itReturns500`, `itReturns401WithParams`, `itReturns404WithParams`, and `itReturns500WithParams` to mutate `mockAuthState.payload` inside `try/finally` blocks and remove their `mockedRequireAuth: jest.Mock` parameters.
  - *Verification command:* `npm run test:unit -- tests/unit/helpers/route.test.helpers.test.ts`
- [x] **Sub-task 2 — Update route unit test files:**
  - For each of the 28 affected test files, replace `jest.mock("@/lib/middleware")` with the state-based wrapper mock factory block:
    ```typescript
    jest.mock("@/lib/middleware", () => ({
      withAuth: jest.fn((handler) => async (req) => {
        const { NextResponse } = require("next/server");
        const { mockAuthState } = require("@/tests/unit/helpers/route.test.helpers");
        if (!mockAuthState.payload) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return handler(req, mockAuthState.payload);
      }),
      withAuthAndParams: jest.fn((handler) => async (req, { params }) => {
        const { NextResponse } = require("next/server");
        const { mockAuthState } = require("@/tests/unit/helpers/route.test.helpers");
        if (!mockAuthState.payload) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return handler(req, mockAuthState.payload, await params);
      }),
    }));
    ```
  - Remove all top-level imports of `requireAuth` and `const mockedRequireAuth = ...` from these files.
  - Update any assertion calls (e.g. `itReturns401(...)`) to no longer pass `mockedRequireAuth` as an argument.
  - *Verification command:* Run `npm run test:unit` to verify individual test suites pass as they are updated.
- [x] **Sub-task 3 — Update storage & utility test files:**
  - In `tests/unit/storage/campaigns.members.test.ts`, remove `requireAuth` import and use the standard mock wrapper factory block instead.
  - In `tests/unit/lib/api-helpers.test.ts`, remove `requireAuth` from imports, and mock it locally via module scope:
    ```typescript
    const mockRequireAuthFn = jest.fn();
    jest.mock("@/lib/middleware", () => ({ requireAuth: mockRequireAuthFn }));
    ```
    Configure the mock return value using `mockRequireAuthFn` directly instead of `mockedRequireAuth`.
  - *Verification command:* `npm run test:unit -- tests/unit/lib/api-helpers.test.ts tests/unit/storage/campaigns.members.test.ts`

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b mock-withauth-in-unit-tests` → `git push -u origin mock-withauth-in-unit-tests`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [ ] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite: `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite: `npm run test:integration`; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite: `npm run test:e2e`; all tests must pass
- **Build** — run the project's build script: `npm run build`; build must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #340" to close the issue.**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

The comment and CI resolution loops are iterative: address → validate locally → push → wait 180 seconds → re-check → poll for merge → repeat until the PR merges.

Ownership metadata:

- Implementer: Antigravity
- Reviewer(s): dougis-org team
- Required approvals: 1 approval

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec)
- [ ] Archive the change: move `openspec/changes/mock-withauth-in-unit-tests/` to `openspec/changes/archive/2026-06-05-mock-withauth-in-unit-tests/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-05-mock-withauth-in-unit-tests/` exists and `openspec/changes/mock-withauth-in-unit-tests/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-05-mock-withauth-in-unit-tests` then `git push -u origin doc/archive-2026-06-05-mock-withauth-in-unit-tests`
- [ ] Open a PR from `doc/archive-2026-06-05-mock-withauth-in-unit-tests` to `main` with title `docs: archive mock-withauth-in-unit-tests (2026-06-05)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d mock-withauth-in-unit-tests doc/archive-2026-06-05-mock-withauth-in-unit-tests`

Required cleanup after archive: `git fetch --prune` and `git branch -d mock-withauth-in-unit-tests doc/archive-2026-06-05-mock-withauth-in-unit-tests`
