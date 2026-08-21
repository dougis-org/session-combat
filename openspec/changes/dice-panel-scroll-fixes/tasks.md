# Tasks

Issue-driven: yes — GitHub issue #514 ("Dice roll improvements").

## Preparation

- [x] **Step 1 — Sync default branch:** based on `main` (commit `ab6d0b8` at branch creation)
- [x] **Step 2 — Create and publish working branch:** working in git worktree `worktree-dice-panel-scroll-fixes` (branch `worktree-dice-panel-scroll-fixes`) — **not yet pushed to origin**

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list. Halt and prompt for installation if missing.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 514 --add-label "in-progress"`, then move the linked GitHub Project item to "In Progress" (discover project/field/option IDs via `gh project list --owner dougis-org --format json` and `gh project field-list --format json`; warn and skip if not found).

### 1. Icon sizes

- [x] 1.1 In `DiceTriggerButton`, change `<DiceD20Icon width={16} height={16} .../>` to `width={24} height={24}`.
- [x] 1.2 In `DicePoolPanel`'s per-die button, change `<Icon width={14} height={14} .../>` to `width={21} height={21}`.
- [x] 1.3 Update/verify any test asserting the old 16px/14px icon dimensions in `tests/unit/components/CampaignChat/CampaignChat.dicePool.test.tsx`.

### 2. Tooltips

- [x] 2.1 Add `title="Dice Rolls for main screen pop out"` to the trigger `<button>` in `DiceTriggerButton`.
- [x] 2.2 Add `title={`d${sides}`}` to each per-die add button in `DicePoolPanel` (matching its existing `aria-label={`Add d${sides}`}`).
- [x] 2.3 Add a test asserting the trigger button's `title` equals "Dice Rolls for main screen pop out".
- [x] 2.4 Add a test asserting each per-die button's `title` equals its die label (`d4`…`d20`).

### 3. Dice panel content-driven height

- [x] 3.1 Remove the `heightPx` prop from `DicePoolPanel`'s type and destructuring.
- [x] 3.2 Remove `style={{ height: heightPx }}` from the panel's root `<div>`; keep `w-64 flex-shrink-0 overflow-y-auto` (or equivalent) so it still caps width and has a scroll fallback if content ever exceeds the viewport.
- [x] 3.3 Remove the `heightPx={resolvedHeight}` prop from the `<DicePoolPanel>` call site (`CampaignChat.tsx:912`).
- [x] 3.4 Update/add a test asserting the panel's rendered height reflects its content, not `resolvedHeight`/the drawer's height, when the drawer is resized to a large custom height.

### 4. Auto-scroll on any dice roll

- [x] 4.1 Extract a `scrollToBottom()` helper (using `feedRef.current` and the existing `requestAnimationFrame` + `scrollTo({ top: scrollHeight, behavior: 'smooth' })` pattern) usable from both `handleRollPosted` and `onStreamEvent`'s `'roll'` branch.
- [x] 4.2 Call `scrollToBottom()` from `handleRollPosted` after `setFeed`, replacing the `pendingScrollRef.current = true` assignment.
- [x] 4.3 Call `scrollToBottom()` from `onStreamEvent`'s `'roll'` branch after `setFeed`, for every roll (not conditioned on who posted it).
- [x] 4.4 Remove the now-unused `pendingScrollRef` and its `useEffect` keyed on `[feed]`.
- [x] 4.5 Verify `onStreamEvent`'s `'message'` branch and the composer's optimistic message append do NOT call `scrollToBottom()` — auto-scroll stays scoped to dice rolls.
- [x] 4.6 Add/update tests: self-roll scrolls (POST-response path), other-player roll scrolls (SSE path), a duplicate roll id (SSE echo racing the POST response) still scrolls exactly once, and a new chat message does not trigger scroll.

- [x] Implement sub-tasks in small, testable increments
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — reused the existing `requestAnimationFrame` + `scrollTo` pattern already used by the infinite-scroll-up handler
- [x] Confirm acceptance criteria are covered — see `tests.md`

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings, re-run tests, then commit.

## Validation

- [x] Run unit/integration tests — `npx jest tests/unit/components/CampaignChat` (115/115 passing)
- [ ] Run E2E tests (if applicable)
- [x] Run type checks — `npx tsc --noEmit -p tsconfig.json` (clean)
- [ ] Run build
- [ ] Run security/code quality checks required by project standards (Verity gate — see open findings below)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]
- [ ] Manual browser smoke test: open the dice panel, confirm no dead space below its controls at various drawer heights; roll a die and confirm the feed scrolls; confirm icons read clearly at the new size; confirm hovering each dice control shows its tooltip.

### Open Verity gate findings (from prior automated pass)

- [x] CRITICAL: Modifier input (`CampaignChat.tsx:448`) has no numeric range/size bound — **pre-existing code, out of this change's declared non-goals** (design.md: "No change to `lib/utils/dice.ts`, the roll data model, or the API contract"). Resolved as: filed as a separate follow-up, [issue #516](https://github.com/dougis-org/session-combat/issues/516); not fixed in this change.
- [x] MEDIUM: `lib/components/CampaignChat.tsx` exceeds readability/size guidance — pre-existing file size, not grown materially by this change. Resolved as: filed as a separate follow-up, [issue #517](https://github.com/dougis-org/session-combat/issues/517); not fixed in this change.
- [x] MEDIUM: `CampaignChat.dicePool.test.tsx` exceeds readability/size guidance — same as above. Resolved as: filed as a separate follow-up, [issue #518](https://github.com/dougis-org/session-combat/issues/518); not fixed in this change.

## Remote push validation

Determine docs-only status via `git diff --name-only HEAD` against `main`. This change touches `.tsx`/`.test.tsx` files, so the **full path** applies:

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Regression / E2E tests pass
- [ ] Build succeeds

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `worktree-dice-panel-scroll-fixes` to `main`. PR body **must include `Closes #514`**.
- [ ] **Issue lifecycle: mark in-review** — `gh issue edit 514 --add-label "in-review" --remove-label "in-progress"`; move project item to "In Review".
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings until zero remain (report a stall after 3+ iterations with no progress)
- [ ] Enable auto-merge only after the review gate passes: `gh pr merge <PR-URL> --auto --merge` (never `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED`:
  1. Build/tests (Remote push validation) — fix, commit, push before anything else
  2. PR comments — resolve every unresolved review thread, commit, validate, push, wait 180s
  3. CI check failures — fix, commit, validate, push, wait 180s, restart from step 1

Ownership metadata:

- Implementer: (this session)
- Reviewer(s): TBD
- Required approvals: per repo branch protection

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none identified beyond this change's own artifacts)
- [ ] Sync approved spec deltas into `openspec/specs/roll-share-ui/spec.md`; fix relative links to point at the archive location
- [ ] Archive the change: move `openspec/changes/dice-panel-scroll-fixes/` to `openspec/changes/archive/2026-08-21-dice-panel-scroll-fixes/` in a single commit (copy + delete together)
- [ ] Confirm the archive path exists and the original change directory is gone
- [ ] Create a doc branch: `git checkout -b doc/archive-2026-08-21-dice-panel-scroll-fixes`, push it
- [ ] Open a PR from the doc branch to `main` titled `docs: archive dice-panel-scroll-fixes (2026-08-21)`
- [ ] Immediately enable auto-merge on the doc PR (never `--admin`)
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and delete `worktree-dice-panel-scroll-fixes` and the doc branch

Required cleanup after archive: `git fetch --prune` and `git branch -D worktree-dice-panel-scroll-fixes doc/archive-2026-08-21-dice-panel-scroll-fixes`
