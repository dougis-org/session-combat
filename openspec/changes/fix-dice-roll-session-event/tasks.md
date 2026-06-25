# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [ ] **Step 2 — Create and publish working branch:** `git checkout -b fix/issue-443-session-event-dice-roll` then immediately `git push -u origin fix/issue-443-session-event-dice-roll`

## Execution

### Task 1 — Add `session` to `CampaignStreamEvent` (`lib/types.ts`)

- [ ] Add `| { type: "session"; campaignId: string; data: { activeSessionId: string | null } }` to the `CampaignStreamEvent` union in `lib/types.ts:40-44`
- [ ] Search for any exhaustive switch/if-chains on `CampaignStreamEvent` type and add a `session` case to each (check `lib/components/CampaignChat.tsx`, `lib/hooks/useCampaignStream.ts`)
- [ ] Run `npm run type-check` — no TypeScript errors

### Task 2 — Emit `session` event from sessions/active route (`app/api/campaigns/[id]/sessions/active/route.ts`)

- [ ] Import `emitFiltered` from `lib/server/transport` in the sessions/active route
- [ ] After `await storage.saveSessionLog(log)` in the POST handler, add:
  ```ts
  emitFiltered(campaignId, { type: 'session', campaignId, data: { activeSessionId: logId } }, () => true)
  ```
- [ ] After `await storage.setActiveCampaignSession(...)` in the DELETE handler, add:
  ```ts
  emitFiltered(campaignId, { type: 'session', campaignId, data: { activeSessionId: null } }, () => true)
  ```
- [ ] Verify: POST to sessions/active triggers the event; DELETE also triggers it
- [ ] Run `npm run type-check` — no errors

### Task 3 — Add `onSessionChange` prop to `CampaignChat` (`lib/components/CampaignChat.tsx`)

- [ ] Add `onSessionChange?: (activeSessionId: string | null) => void` to the `CampaignChat` props interface
- [ ] In `onStreamEvent`, add a branch for `e.type === 'session'`: call `onSessionChange?.(e.data.activeSessionId)`
- [ ] Run `npm run type-check` — no errors

### Task 4 — Wire `onSessionChange` in layout (`app/campaigns/[id]/layout.tsx`)

- [ ] Pass `onSessionChange={setActiveSessionId}` to the `<CampaignChat>` render in the layout
- [ ] Run `npm run type-check` — no errors

### Task 5 — Write/update tests

- [ ] **Unit — `CampaignStreamEvent` type:** Confirm TypeScript accepts the `session` variant shape (type-level test via `lib/types.ts` — covered by type-check)
- [ ] **Unit — `CampaignChat` `onSessionChange`:** Render `CampaignChat` with a spy `onSessionChange`; simulate a `session` stream event; assert spy called with correct value for start (`"abc"`) and end (`null`)
- [ ] **Unit — layout reactive update:** Render the layout; simulate SSE `session` event via mock stream; assert `activeSessionId` state updates and roll strip enables/disables accordingly
- [ ] **Integration — POST sessions/active emits event:** Mock `emitFiltered`; call POST handler; assert `emitFiltered` called with `{ type: 'session', data: { activeSessionId: <id> } }`
- [ ] **Integration — DELETE sessions/active emits event:** Mock `emitFiltered`; call DELETE handler; assert `emitFiltered` called with `{ type: 'session', data: { activeSessionId: null } }`
- [ ] All new and existing tests pass: `npm test`

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] `npm run type-check` — zero TypeScript errors
- [ ] `npm test` — all tests pass (new + existing)
- [ ] `npm run build` — build succeeds with no errors
- [ ] `npm run lint` — no lint errors
- [ ] All spec scenarios in `openspec/changes/fix-dice-roll-session-event/specs/session-event/spec.md` are covered by tests
- [ ] Roll strip correctly enables when a `session` event with a non-null `activeSessionId` arrives after page load
- [ ] Roll strip correctly disables when a `session` event with `activeSessionId: null` arrives
- [ ] Static case (session already active on page load) still works correctly

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — `npm test`; all tests must pass
- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, iterate and fix before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to `fix/issue-443-session-event-dice-roll` and push to remote
- [ ] Open PR from `fix/issue-443-session-event-dice-roll` to `main`. PR body must include `Closes #443`.
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if `CLOSED`, exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis
- Reviewer(s): —
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec delta: copy `openspec/changes/fix-dice-roll-session-event/specs/session-event/spec.md` → `openspec/specs/session-event/spec.md`; update relative links in the copied file so they point to the archive location (`../../changes/archive/YYYY-MM-DD-fix-dice-roll-session-event/design.md`, etc.)
- [ ] Archive the change: move `openspec/changes/fix-dice-roll-session-event/` to `openspec/changes/archive/YYYY-MM-DD-fix-dice-roll-session-event/` **in a single commit** (stage both the copy and the deletion)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-fix-dice-roll-session-event/` exists and `openspec/changes/fix-dice-roll-session-event/` is gone
- [ ] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-fix-dice-roll-session-event` then `git push -u origin doc/archive-YYYY-MM-DD-fix-dice-roll-session-event`
- [ ] Open PR from `doc/archive-YYYY-MM-DD-fix-dice-roll-session-event` to `main` with title `docs: archive fix-dice-roll-session-event (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [ ] Monitor the doc PR until it merges; address comments and CI failures on the doc branch
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D fix/issue-443-session-event-dice-roll doc/archive-YYYY-MM-DD-fix-dice-roll-session-event`
