# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/client-use-campaign-stream-hook` then immediately `git push -u origin feat/client-use-campaign-stream-hook`

## Execution

- [x] **T-1 — Add `CampaignStreamEvent` type to `lib/types.ts`**
  - Add a discriminated union: `{ type: 'heartbeat'; campaignId: string; data: { ts: number } } | { type: 'change'; campaignId: string; data: Record<string, unknown> }`
  - BDD/TDD: write failing test that imports and uses the type; confirm type-check fails before the type exists; add the type; confirm it passes.

- [x] **T-2 — Implement `useCampaignStream` hook in `lib/hooks/useCampaignStream.ts`**
  - Hook signature: `useCampaignStream(campaignId: string, onEvent: (e: CampaignStreamEvent) => void): { status: Status }`
  - `Status = 'connecting' | 'open' | 'error'`
  - Use `useRef` for `onEvent` (Decision 1), `globalThis.EventSource` (Decision 2), explicit backoff on `CLOSED` (Decision 3), `encodeURIComponent` on campaignId (Decision 4).
  - BDD/TDD: write failing tests (T1-T4) first; implement to green; refactor for clarity.

- [x] **T-3 — Write unit tests in `tests/unit/hooks/useCampaignStream.test.ts`**
  - T1: connection lifecycle (4 scenarios + URL encoding variant)
  - T2: event dispatch (5 scenarios including stale closure)
  - T3: reconnect/backoff (6 scenarios covering CLOSED, CONNECTING, cap, reset)
  - T4: teardown (3 scenarios: unmount open, unmount during pending reconnect, unmount before open)
  - All 19 tests must pass before marking complete.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit tests: `npx jest tests/unit/hooks/useCampaignStream.test.ts` — all 19 pass
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run build: `npm run build`
- [x] All completed tasks marked as complete

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

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`. **PR body MUST include `Closes #312`.**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: AI agent
- Reviewer(s): project maintainer
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
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-<name>/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [ ] Archive the change: move `openspec/changes/client-use-campaign-stream-hook/` to `openspec/changes/archive/YYYY-MM-DD-client-use-campaign-stream-hook/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-client-use-campaign-stream-hook/` exists and `openspec/changes/client-use-campaign-stream-hook/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-client-use-campaign-stream-hook` then `git push -u origin doc/archive-YYYY-MM-DD-client-use-campaign-stream-hook`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-client-use-campaign-stream-hook` to `main` with title `docs: archive client-use-campaign-stream-hook (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D feat/client-use-campaign-stream-hook doc/archive-YYYY-MM-DD-client-use-campaign-stream-hook`

Required cleanup after archive: `git fetch --prune` and `git branch -D feat/client-use-campaign-stream-hook doc/archive-YYYY-MM-DD-client-use-campaign-stream-hook`
