# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/issue-312-use-campaign-stream` then immediately `git push -u origin feat/issue-312-use-campaign-stream`

## Execution

### T1 — Implement `lib/hooks/useCampaignStream.ts`

- [x] Create `lib/hooks/useCampaignStream.ts` with `"use client"` directive
- [x] Define `Status` type: `'connecting' | 'open' | 'closed' | 'error'`
- [x] Import `CampaignStreamEvent` from `@/lib/types`
- [x] Implement hook signature: `useCampaignStream(campaignId: string, onEvent: (e: CampaignStreamEvent) => void): { status: Status }`
- [x] Store `onEvent` in a `useRef` updated each render (Decision 3) — prevents stale closures without causing reconnect
- [x] In `useEffect` (deps: `[campaignId]`):
  - Create `new EventSource(\`/api/campaigns/${campaignId}/stream\`)`
  - Set `status` to `'connecting'` on creation
  - Assign `es.onopen` → set status `'open'`, reset backoff delay to 1 000 ms
  - Register `es.addEventListener('heartbeat', handler)` — parse `e.data` as JSON, call `onEventRef.current`
  - Register `es.addEventListener('change', handler)` — parse `e.data` as JSON, call `onEventRef.current`
  - Assign `es.onerror` → if `es.readyState === EventSource.CLOSED`: set status `'error'`, close current instance, schedule reconnect via `setTimeout` with current backoff delay, double delay capped at 30 000 ms
  - Return cleanup: set `torn = true`, call `es.close()`, clear pending `setTimeout` ref
- [x] Export `useCampaignStream` as named export

### T2 — Implement `tests/unit/hooks/useCampaignStream.test.ts`

Tests must be written **before** or **alongside** the implementation (BDD/TDD).

- [x] Create `tests/unit/hooks/useCampaignStream.test.ts`
- [x] Set up `MockEventSource` class in test file (or `__mocks__`) — tracks constructor args, exposes `triggerOpen()`, `triggerError(readyState)`, `triggerEvent(type, data)`, `close()` spy; assign to `globalThis.EventSource` in `beforeEach`
- [x] Test: initial `status` is `'connecting'`
- [x] Test: `status` becomes `'open'` after `onopen`
- [x] Test: `EventSource` constructed with correct URL
- [x] Test: `addEventListener('heartbeat', ...)` called (not `onmessage`)
- [x] Test: `addEventListener('change', ...)` called
- [x] Test: `onEvent` called with parsed heartbeat payload
- [x] Test: `onEvent` called with parsed change payload
- [x] Test: updated `onEvent` ref receives event (no reconnect)
- [x] Test: `campaignId` change → previous `EventSource` closed, new one created with new URL
- [x] Test: `onerror` + `CLOSED` → status `'error'`, reconnect scheduled after 1 000 ms (fake timers)
- [x] Test: second failure → delay doubles to 2 000 ms
- [x] Test: delay capped at 30 000 ms after many failures
- [x] Test: successful reconnect resets delay to 1 000 ms
- [x] Test: `onerror` + `CONNECTING` (not CLOSED) → no reconnect scheduled
- [x] Test: unmount → `es.close()` called
- [x] Test: unmount during reconnect timer → no new `EventSource` constructed, no setState warning

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm test -- --testPathPattern=useCampaignStream` passes (all scenarios covered)
- [x] `npm run typecheck` passes with no new errors
- [x] `npm run build` succeeds
- [x] `npm test` (full suite) passes — no regressions in existing tests
- [x] Confirm `lib/hooks/useCampaignStream.ts` is the **only** new or modified file (besides test file)

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- if **ANY** of the above fail, you **MUST** iterate and address the failure

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/issue-312-use-campaign-stream` and push to remote
- [x] Open PR from `feat/issue-312-use-campaign-stream` to `main`. PR body **must** include `Closes #312`.
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Monitor PR comments** — poll for new comments autonomously; when comments appear, address them, commit fixes, and explicitly ensure threads are resolved. Follow all steps in Remote push validation then push to the same working branch; wait 180 seconds then repeat until no unresolved comments remain
- [x] **Monitor CI checks** — poll using `gh pr checks <PR-URL> --json isRequired,state`; when any required check fails, diagnose and fix, commit fixes, follow Remote push validation, push, wait 180 seconds, repeat until all required checks pass
- [x] **Poll for merge** — after each iteration run `gh pr view <PR-URL> --json state`; when `state` is `MERGED` proceed to Post-Merge; if `CLOSED` exit and notify the user — **never force-merge**

Ownership metadata:

- Implementer: dougis
- Reviewer(s): automated (agentic reviewers) + dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify `lib/hooks/useCampaignStream.ts` appears on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync spec delta: copy `openspec/changes/issue-312-use-campaign-stream/specs/use-campaign-stream/spec.md` to `openspec/specs/use-campaign-stream/spec.md` (update relative paths to point to archive location)
- [x] Archive the change: move `openspec/changes/issue-312-use-campaign-stream/` to `openspec/changes/archive/YYYY-MM-DD-issue-312-use-campaign-stream/` — stage the copy and deletion in a **single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-issue-312-use-campaign-stream/` exists and `openspec/changes/issue-312-use-campaign-stream/` is gone
- [x] **Create doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-issue-312-use-campaign-stream` then `git push -u origin doc/archive-YYYY-MM-DD-issue-312-use-campaign-stream`
- [x] Open PR from doc branch to `main` with title `docs: archive issue-312-use-campaign-stream (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge`
- [x] Monitor the doc PR until merged (address any comments/CI failures, push to same doc branch, repeat)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -d feat/issue-312-use-campaign-stream doc/archive-YYYY-MM-DD-issue-312-use-campaign-stream`
