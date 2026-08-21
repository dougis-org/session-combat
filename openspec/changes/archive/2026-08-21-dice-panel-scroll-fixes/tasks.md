# Tasks

Issue-driven: yes — GitHub issue #514 ("Dice roll improvements").

## Preparation

- [x] **Step 1 — Sync default branch:** based on `main` (commit `ab6d0b8` at branch creation)
- [x] **Step 2 — Create and publish working branch:** working in git worktree `worktree-dice-panel-scroll-fixes` (branch `worktree-dice-panel-scroll-fixes`) — **not yet pushed to origin**

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — confirmed present in the available skills list.

## Execution

- [x] **Issue lifecycle: mark in-progress** — labeled `in-progress` and moved the linked GitHub Project item to "In Progress".

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

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings, re-run tests, then commit. — Ran; zero findings on the scoped diff. See PR #519.

## Validation

- [x] Run unit/integration tests — `npx jest tests/unit/components/CampaignChat` (115/115 passing locally); CI `unit-tests`/`integration-tests` jobs also passed on PR #519
- [x] Run E2E tests (if applicable) — CI `regression-tests` job passed on PR #519
- [x] Run type checks — `npx tsc --noEmit -p tsconfig.json` (clean)
- [x] Run build — CI `build` job passed on PR #519
- [x] Run security/code quality checks required by project standards — Verity pre-commit/pre-push gates passed; Codacy Static Code Analysis and Codacy Diff Coverage passed. `check-codacy-coverage` (a workflow step that polls Codacy for a `Codacy Coverage Variation` check) timed out waiting on that external check and was retried once via `gh run rerun --failed`; it timed out again on the retry. **The PR was merged with this one check still failing, via a manual override by the repo owner** (not via this schema's `gh pr merge --auto --merge` review-gate flow) — see PR and Merge section below.
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation] — satisfied via CI on PR #519 (see checks above)
- [ ] Manual browser smoke test: open the dice panel, confirm no dead space below its controls at various drawer heights; roll a die and confirm the feed scrolls; confirm icons read clearly at the new size; confirm hovering each dice control shows its tooltip. **Not performed** — no authenticated dev environment with an active campaign/session was available in the working sandbox. Automated test coverage (unit/integration/regression, all passing) is the substitute evidence.

### Open Verity gate findings (from prior automated pass)

- [x] CRITICAL: Modifier input (`CampaignChat.tsx:448`) has no numeric range/size bound — **pre-existing code, out of this change's declared non-goals** (design.md: "No change to `lib/utils/dice.ts`, the roll data model, or the API contract"). Resolved as: filed as a separate follow-up, [issue #516](https://github.com/dougis-org/session-combat/issues/516); not fixed in this change.
- [x] MEDIUM: `lib/components/CampaignChat.tsx` exceeds readability/size guidance — pre-existing file size, not grown materially by this change. Resolved as: filed as a separate follow-up, [issue #517](https://github.com/dougis-org/session-combat/issues/517); not fixed in this change.
- [x] MEDIUM: `CampaignChat.dicePool.test.tsx` exceeds readability/size guidance — same as above. Resolved as: filed as a separate follow-up, [issue #518](https://github.com/dougis-org/session-combat/issues/518); not fixed in this change.

## Remote push validation

Determine docs-only status via `git diff --name-only HEAD` against `main`. This change touches `.tsx`/`.test.tsx` files, so the **full path** applies:

- [x] Unit tests pass
- [x] Integration tests pass
- [x] Regression / E2E tests pass
- [x] Build succeeds

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `worktree-dice-panel-scroll-fixes` to `main`. PR body **includes `Closes #514`**. → [PR #519](https://github.com/dougis-org/session-combat/pull/519)
- [x] **Issue lifecycle: mark in-review** — labeled `in-review`, removed `in-progress`; project item moved to "In Review".
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; addressed all findings until zero remained and enabled auto-merge. **One finding materially changed shipped behavior**: review flagged that extending auto-scroll to other players' rolls unconditionally would yank a user reading history (see design.md D4 "Updated during PR review"); the fix added a ~100px bottom-proximity gate for remote rolls while keeping the roller's own roll unconditional (commits `cb7df30`, `1edd886`, `f5c5583`). This narrows the shipped behavior versus the originally-approved proposal/design/spec, which claimed fully unconditional auto-scroll — proposal.md, design.md, and both `specs/roll-share-ui/spec.md` copies (change-local and global) were corrected post-hoc in the archive commit to describe the guard accurately, per this schema's requirement that scope changes be reflected in the artifacts. Also added missing icon-size assertion tests flagged in the same review pass, and a reverse-order POST/SSE race test.
- [x] Enable auto-merge only after the review gate passes: `gh pr merge 519 --auto --merge` (never `--admin`) — enabled by the automated flow
- [x] **Iterate until merged** — every check passed except `check-codacy-coverage`, which twice hit an external timeout waiting on a Codacy check that never posted (`Codacy Diff Coverage` itself passed; this was a workflow polling failure, not a coverage regression). **The repo owner manually overrode the gate and merged PR #519 directly** rather than waiting for that check to clear or for the automated `--auto --merge` flow to complete on its own. Deviation from the schema's "never force-merge, iterate until the automated flow reports MERGED" instruction — recorded here for traceability, not corrected after the fact since the merge is already done.

Ownership metadata:

- Implementer: this session (agent-assisted)
- Reviewer(s): `pr-review-toolkit:review-pr` (automated), Doug Hubbard (manual merge decision)
- Required approvals: per repo branch protection; merged via manual override with one non-required-looking check (`check-codacy-coverage`) still failing due to an external timeout

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only` — this worktree could not literally check out `main` (already checked out in the primary worktree at `/home/doug/dev/session-combat`); verified via `git fetch origin` + `git log origin/main` instead, and branched the doc work from `origin/main`.
- [x] Verify the merged changes appear on `main` — confirmed: `78fbb43 fix: dice icon sizing, tooltips, content-driven panel height, and roll auto-scroll (#519)` is the tip of `origin/main`.
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none identified beyond this change's own artifacts)
- [x] Sync approved spec deltas into `openspec/specs/roll-share-ui/spec.md`; fix relative links to point at the archive location — done; no relative links into this change's directory existed in the delta spec, so no link rewrites were needed.
- [x] Archive the change: move `openspec/changes/dice-panel-scroll-fixes/` to `openspec/changes/archive/2026-08-21-dice-panel-scroll-fixes/` in a single commit (copy + delete together)
- [x] Confirm the archive path exists and the original change directory is gone
- [x] Create a doc branch: `git checkout -b doc/archive-2026-08-21-dice-panel-scroll-fixes`, push it
- [x] Open a PR from the doc branch to `main` titled `docs: archive dice-panel-scroll-fixes (2026-08-21)` → [PR #520](https://github.com/dougis-org/session-combat/pull/520)
- [x] Immediately enable auto-merge on the doc PR (never `--admin`) — enabled via `gh pr merge 520 --auto --merge`
- [ ] Monitor the doc PR until merged (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and delete `worktree-dice-panel-scroll-fixes` and the doc branch

Required cleanup after archive: `git fetch --prune` and `git branch -D worktree-dice-panel-scroll-fixes doc/archive-2026-08-21-dice-panel-scroll-fixes`
