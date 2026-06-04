# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feature/centralize-admin-helper` then immediately `git push -u origin feature/centralize-admin-helper`

## Execution

### BDD/TDD Phase: Test Drafts
- [x] **Step 3 — Draft tests and imports**: Update [tests/integration/permissions.test.ts](file:///home/doug/dev3/session-combat/tests/integration/permissions.test.ts) and [tests/integration/campaign-global-api.integration.test.ts](file:///home/doug/dev3/session-combat/tests/integration/campaign-global-api.integration.test.ts) to import `makeUserAdmin` and remove their inline MongoClient connections.
- [x] **Step 4 — Run tests to verify failure**: Run integration tests to verify they fail due to `makeUserAdmin` being undefined/missing:
  `npm run test:integration tests/integration/permissions.test.ts tests/integration/campaign-global-api.integration.test.ts`

### Implementation Phase
- [x] **Step 5 — Create helper function**: Implement `makeUserAdmin(userId: string, mongoUri?: string, mongoDb?: string): Promise<void>` in [tests/integration/helpers/users.ts](file:///home/doug/dev3/session-combat/tests/integration/helpers/users.ts) to handle MongoDB connection, updating `isAdmin: true`, and client teardown.
- [x] **Step 6 — Verify integration tests pass**: Run the integration tests again to ensure they now pass successfully with the helper implemented.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically address all findings from the sub-agent's report, applying fixes for complexity, duplication, and quality issues before committing.

## Validation

- [x] Run integration tests: `npm run test:integration`
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors
- If **ANY** of the above fail, you **MUST** iterate and address the failure.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **The PR body MUST explicitly state "Closes #223".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved to allow the process to progress. Follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll for check status autonomously using `gh pr checks <PR-URL> --json isRequired,state`; when any **required (blocking)** CI check fails, diagnose and fix the failure, commit fixes, follow all steps in [Remote push validation] then push to the same working branch; wait 180 seconds then repeat until all required checks pass
- [ ] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never wait for a human to report the merge**; **never force-merge**

Ownership metadata:

- Implementer: Antigravity AI
- Reviewer(s): Human Reviewer
- Required approvals: 1

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
- [ ] Archive the change: move `openspec/changes/centralize-admin-helper/` to `openspec/changes/archive/2026-06-04-centralize-admin-helper/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/2026-06-04-centralize-admin-helper/` exists and `openspec/changes/centralize-admin-helper/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-06-04-centralize-admin-helper` then `git push -u origin doc/archive-2026-06-04-centralize-admin-helper`
- [ ] Open a PR from `doc/archive-2026-06-04-centralize-admin-helper` to `main` with title `docs: archive centralize-admin-helper (2026-06-04)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feature/centralize-admin-helper doc/archive-2026-06-04-centralize-admin-helper`

Required cleanup after archive: `git fetch --prune` and `git branch -d feature/centralize-admin-helper doc/archive-2026-06-04-centralize-admin-helper`
