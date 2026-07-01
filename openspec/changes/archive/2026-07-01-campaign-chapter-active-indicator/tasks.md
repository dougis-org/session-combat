# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/campaign-chapter-active-indicator` then immediately `git push -u origin feat/campaign-chapter-active-indicator`

## Execution

### Task 1 — Update CampaignEditor JSX

File: `app/campaigns/CampaignEditor.tsx`

- [x] **1a — Replace `<select>` with display-only block:** Remove the `<select data-testid="current-chapter-select">` and its wrapper. Add a display `<div data-testid="current-chapter-display">` that resolves the active chapter title from `chapters` + `currentChapterId`. Show `"Ch. N: <title>"` when active, or `"-- No active chapter --"` (dimmed, italic: `text-gray-500 italic`) when unset. Keep the block hidden when `chapters.length === 0` (same condition as the former select).

- [x] **1b — Add ACTIVE indicator to active chapter row:** In the chapter row map, after the title `<input>`, add a conditional `<button data-testid={`active-chapter-indicator-${ch.id}`} ...>ACTIVE</button>` when `ch.id === currentChapterId`. Note: shipped as a `<button>` (not `<span>`) so that clicking it clears the active chapter, restoring parity with the old empty-option select.

- [x] **1c — Add 🚩 activate button to inactive rows:** In the chapter row map, after the title `<input>` (and after the conditional ACTIVE pill), add a conditional `<button type="button" data-testid={`activate-chapter-${ch.id}`} title="Mark as current chapter" onClick={() => setCurrentChapterId(ch.id)} disabled={saving} className="px-2 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none text-xs rounded text-gray-300 transition-all cursor-pointer">🚩</button>` when `ch.id !== currentChapterId`.

- [x] **1d — Verify row element order:** Confirm each row renders in order: chapter number label → title input → [ACTIVE pill OR 🚩 button] → ▲ button → ▼ button → Remove button.

### Task 2 — Update unit tests

File: `tests/unit/components/CampaignEditor.test.tsx`

- [x] **2a — Remove `current-chapter-select` tests:** Delete or update any test that queries `data-testid="current-chapter-select"` or tests the dropdown interaction.

- [x] **2b — Add display block tests:**
  - Assert `current-chapter-display` shows the active chapter title when `currentChapterId` is set
  - Assert `current-chapter-display` shows "-- No active chapter --" when `currentChapterId` is unset
  - Assert `current-chapter-display` is absent when no chapters exist

- [x] **2c — Add ACTIVE pill tests:**
  - Assert `active-chapter-indicator-{id}` is present only on the active chapter's row
  - Assert no `active-chapter-indicator-*` element exists when `currentChapterId` is unset

- [x] **2d — Add activate button tests:**
  - Assert `activate-chapter-{id}` is present on all inactive rows, absent on the active row
  - Assert clicking `activate-chapter-{id}` updates `current-chapter-display` and moves the ACTIVE pill
  - Assert activate buttons are disabled when `saving` is true

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] `npm run test:unit` — all tests pass
- [x] `npm run build` — build succeeds with no errors
- [x] `npm run typecheck` (or `tsc --noEmit`) — no type errors (pre-existing errors only, none from this change)
- [x] Manually verify: open campaign editor with chapters, confirm display block, ACTIVE pill, and 🚩 button render correctly; click 🚩 on an inactive chapter and confirm active state transfers
- [x] All execution tasks marked complete

## Remote push validation

**Full path** (non-`.md` files changed):

- **Unit tests** — `npm run test:unit` — all tests must pass
- **Build** — `npm run build` — must succeed with no errors
- Skip E2E for this change — it is a UI-only JSX refactor with no API changes

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/campaign-chapter-active-indicator` and push to remote
- [x] Open PR from `feat/campaign-chapter-active-indicator` to `main`. PR body must include: **"Closes #446"** — PR #464
- [x] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [x] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

Ownership metadata:

- Implementer: agent
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → `npm run test:unit && npm run build` → push → re-run checks
- Review comment → address → commit → `npm run test:unit && npm run build` → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Sync approved spec delta to global spec: copy to `openspec/specs/chapter-active-indicator/spec.md` with updated archive links
- [x] Archive the change: moved to `openspec/changes/archive/2026-07-01-campaign-chapter-active-indicator/`
- [x] Confirm archive exists and `openspec/changes/campaign-chapter-active-indicator/` is gone
- [x] **Create a doc branch** `doc/archive-2026-07-01-campaign-chapter-active-indicator` and push
- [x] Open PR #465 from doc branch to `main`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR
- [x] Monitor the doc PR until it merges
- [x] Prune merged local branches
