# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/prompt-builder-session-context` then immediately `git push -u origin feat/prompt-builder-session-context`

## Execution

### Task 1 — Audit existing tests for `fetchCampaignContext` and `buildSystemPrompt`

Before touching any implementation file, read the existing test files so the sessions mock can be added without breaking anything:

- [x] Read `tests/unit/utils/campaignContext.test.ts` — identify every test case; note which mock for `fetch` is used
- [x] Read `tests/unit/prompts/templates.test.ts` (or equivalent) — confirm `buildSystemPrompt` test coverage exists and note current assertions

### Task 2 — Extend `CampaignContext` type (`lib/types.ts`)

- [x] Add `recentSessions?: SessionLog[]` to the `CampaignContext` interface
- [x] Confirm `SessionLog` is already imported in scope (it is — no new import needed for the interface)
- [x] Run `npx tsc --noEmit` — must pass with zero new errors

### Task 3 — Extend `fetchCampaignContext` to fetch sessions (`lib/utils/campaignContext.ts`)

- [x] Add `SessionLog` to the import from `@/lib/types`
- [x] Add `fetchImpl(`/api/campaigns/${campaignId}/sessions?limit=3`)` to the `Promise.all` (fourth parallel fetch)
- [x] Wrap the sessions response handling in try/catch: on any error or non-OK response, set `recentSessions = []` and `console.error` the failure
- [x] Parse the sessions response JSON as `SessionLog[]` on success
- [x] Include `recentSessions` in the returned `CampaignContext` object
- [x] Run `npx tsc --noEmit` — must pass

### Task 4 — Extend `buildSystemPrompt` to render session block (`lib/prompts/templates.ts`)

- [x] Import `SessionLog` type at the top of the file (needed for the helper function signature)
- [x] After the existing `partySection` block, build a `sessionSection` string:
  - If `context.recentSessions` is absent or empty → `sessionSection = ''`
  - Otherwise, format each entry as: `- Session {N} ({date}): {title || "Untitled Session"}{milestoneSuffix}`
    - `milestoneSuffix` when `milestone: true` and `newLevel` present: ` — party reached Level {newLevel}.`
    - `milestoneSuffix` when `milestone: true` and no `newLevel`: ` — milestone reached.`
    - `milestoneSuffix` otherwise: `''`
  - Date format: `new Date(datePlayed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })` (e.g. `May 14, 2026`)
  - Heading line: `Recent sessions:`
- [x] Add `sessionSection` to the `.filter(Boolean).join('\n')` array (after `partySection`)
- [x] Run `npx tsc --noEmit` — must pass

### Task 5 — Update Prompt Builder loading label (`app/campaigns/[id]/prompts/page.tsx`)

- [x] Change the `LoadingState` label string from `"Loading campaign context..."` to `"Loading campaign and session history..."`
- [x] Run `npx tsc --noEmit` — must pass

### Task 6 — Update `fetchCampaignContext` tests

- [x] In the existing test file, add a sessions mock to the `fetch` mock for every test case: `GET /api/campaigns/${campaignId}/sessions?limit=3` → return `[]`
- [x] Add a new test: **sessions fetch returns data** — mock returns 2 sessions, assert `context.recentSessions` has length 2 and matches the mocked data
- [x] Add a new test: **sessions fetch fails (500)** — mock returns 500, assert `context.recentSessions` is `[]` and the function resolves (does not throw)
- [x] Add a new test: **sessions URL includes `?limit=3`** — assert the mocked fetch was called with the correct URL
- [x] Run `npm test -- --testPathPattern=campaignContext` — all tests must pass

### Task 7 — Add `buildSystemPrompt` tests for session block

- [x] In the existing templates test file (or a new `tests/unit/prompts/templates.test.ts` if it doesn't cover `buildSystemPrompt`):
  - **No sessions** — `recentSessions: []` → assert output does not contain `"Recent sessions:"`
  - **Undefined sessions** — `recentSessions` field absent → assert output does not contain `"Recent sessions:"`
  - **One session, no milestone** — assert output contains `"Recent sessions:"` and the session line with title and date
  - **One session, milestone with newLevel** — assert output contains `"party reached Level 11"`
  - **One session, milestone without newLevel** — assert output contains `"milestone reached"`
  - **Session with no title** — assert output contains `"Untitled Session"`
- [x] Run `npm test -- --testPathPattern=templates` — all tests must pass

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Review its report and apply fixes for duplication, complexity, and completeness before committing.

## Validation

- [x] `npx tsc --noEmit` — zero errors
- [x] `npm run lint` — zero new lint errors
- [x] `npm test` — all unit tests pass
- [x] `npm run test:integration` — all integration tests pass (sessions API routes already tested; confirm no regression)
- [x] Manual smoke test: open Prompt Builder for a campaign that has session logs → generate an NPC prompt → confirm "Recent sessions:" block appears in the generated prompt
- [x] Manual smoke test: open Prompt Builder for a campaign with zero session logs → generate prompt → confirm no session block in output
- [x] All tasks in Execution marked complete

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Unit tests** — `npm test` — all tests must pass
- **Integration tests** — `npm run test:integration` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- **Type check** — `npx tsc --noEmit` — zero errors

If **ANY** of the above fail, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run before the final commit
- [x] Commit all changes to `feat/prompt-builder-session-context` and push to remote
- [x] Open PR from `feat/prompt-builder-session-context` to `main`. PR body must include: **`Closes #188`**
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post comments
- [x] **Monitor PR comments** — poll autonomously; address each comment, commit fixes, follow Remote push validation steps, push to `feat/prompt-builder-session-context`, wait 180 seconds, repeat until no unresolved comments remain
- [x] **Monitor CI checks** — `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required check, follow Remote push validation steps, push, wait 180 seconds, repeat until all required checks pass
- [x] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user — never wait for a human to report the merge; never force-merge

Ownership metadata:
- Implementer: claude (agent)
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
- [x] Update repository documentation impacted by the change (none expected)
- [x] Sync approved spec deltas into `openspec/specs/` (global spec)
- [x] Archive the change: move `openspec/changes/prompt-builder-session-context/` to `openspec/changes/archive/2026-05-26-prompt-builder-session-context/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/2026-05-26-prompt-builder-session-context/` exists and `openspec/changes/prompt-builder-session-context/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-2026-05-26-prompt-builder-session-context` then `git push -u origin doc/archive-2026-05-26-prompt-builder-session-context`
- [x] Open a PR from `doc/archive-2026-05-26-prompt-builder-session-context` to `main` with title `docs: archive prompt-builder-session-context (2026-05-26)` — do NOT push directly to `main`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -d feat/prompt-builder-session-context doc/archive-2026-05-26-prompt-builder-session-context`
