# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b refactor/decompose-campaign-chat-tests` then immediately `git push -u origin refactor/decompose-campaign-chat-tests`

## Execution

- [x] **Task 1 — Setup new directory:** Create the `tests/unit/components/CampaignChat/` directory.
- [x] **Task 2 — Create shared helper:** Create [`tests/unit/components/CampaignChat/helpers.ts`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/helpers.ts) with common mocks, `sharedTestState`, and utility functions (`openDock`, `fireMsg`, `withMembers`, etc.).
- [x] **Task 3 — Migrate drawer tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx), configure hoisted mocks using `require('./helpers')`, copy tests TC-01 to TC-13. Verify by running `npx jest tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx`.
- [x] **Task 4 — Migrate SSE stream tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.sse.test.tsx), copy T2 and T11 tests, and verify they pass.
- [x] **Task 5 — Migrate history tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.history.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.history.test.tsx), copy T4 tests, and verify they pass.
- [x] **Task 6 — Migrate unread badge tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.unread.test.tsx), copy T5 tests, and verify they pass.
- [x] **Task 7 — Migrate members tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.members.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.members.test.tsx), copy T3 tests, and verify they pass.
- [x] **Task 8 — Migrate composer tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.composer.test.tsx), copy T6, T7, and T8 tests, and verify they pass.
- [x] **Task 9 — Migrate visibility rendering tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.visibility.test.tsx), copy T9 tests, and verify they pass.
- [x] **Task 10 — Migrate scene integration tests (TDD):** Create [`tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat/CampaignChat.scene.test.tsx), copy T10 tests, and verify they pass.
- [x] **Task 11 — Deletion of original test file:** Remove [`tests/unit/components/CampaignChat.test.tsx`](file:///home/doug/dev3/session-combat/tests/unit/components/CampaignChat.test.tsx).

*Note: In the TDD workflow for this refactoring, we must write the skeleton files and confirm that the test runner executes them (even if they fail or pass) before completing migration of the test cases.*

Suggested start-of-work commands: `git checkout main` → `git pull --ff-only` → `git checkout -b refactor/decompose-campaign-chat-tests` → `git push -u origin refactor/decompose-campaign-chat-tests`

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit`
- [ ] Run E2E tests: `npm run test:e2e` (optional or as required by CI)
- [x] Run type checks: `npm run typecheck`
- [x] Run build: `npm run build`
- [x] Run linting checks: `npm run lint`
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from working branch to `main`. **Since this change is issue-driven, the PR body MUST explicitly state "Closes #452".**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Antigravity
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
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-decompose-campaign-chat-tests/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [ ] Archive the change: move `openspec/changes/decompose-campaign-chat-tests/` to `openspec/changes/archive/YYYY-MM-DD-decompose-campaign-chat-tests/` **and stage both the new location and the removal of the original in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-decompose-campaign-chat-tests/` exists and `openspec/changes/decompose-campaign-chat-tests/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-decompose-campaign-chat-tests` then `git push -u origin doc/archive-YYYY-MM-DD-decompose-campaign-chat-tests`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-decompose-campaign-chat-tests` to `main` with title `docs: archive decompose-campaign-chat-tests (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D refactor/decompose-campaign-chat-tests doc/archive-YYYY-MM-DD-decompose-campaign-chat-tests`

Required cleanup after archive: `git fetch --prune` and `git branch -D refactor/decompose-campaign-chat-tests doc/archive-YYYY-MM-DD-decompose-campaign-chat-tests`
