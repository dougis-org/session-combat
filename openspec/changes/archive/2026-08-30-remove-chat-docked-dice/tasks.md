# Tasks

Change: `remove-chat-docked-dice` — GitHub issue #585.

Ownership metadata:

- Implementer: TBD (assign on pickup)
- Reviewer(s): repo maintainers via `pr-review-toolkit:review-pr` + human approval
- Required approvals: 1 human approval + zero `pr-review-toolkit:review-pr` findings + green CI

## Preparation

- [x] **Step 1 — Confirm the dedicated worktree:** verify `.worktrees/remove-chat-docked-dice`
  exists (created during propose) and `cd` into it. If missing, from the primary checkout
  run `git fetch origin main` then
  `git worktree add .worktrees/remove-chat-docked-dice -b remove-chat-docked-dice origin/main`.
  Never checkout this branch in the primary checkout.
- [x] **Step 2 — Confirm the branch is published:** `git rev-parse --abbrev-ref HEAD` is
  `remove-chat-docked-dice`; if `git status` shows it is not tracking a remote, run
  `git push -u origin remove-chat-docked-dice` from inside the worktree.
- [x] **Step 3 — Ensure the openspec submodule is present in the worktree:**
  `git submodule update --init .github/openspec-shared` (needed for `openspec` schema
  resolution inside the worktree).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills
  list. If not listed, halt, tell the user the `pr-review-toolkit` plugin is required,
  give installation guidance, and do not proceed until they confirm it is installed.
- [x] **Baseline green:** `npm run test:unit -- tests/unit/components/CampaignChat tests/unit/components/dice tests/unit/components/GlobalDiceFab.test.tsx` and `npm run typecheck` pass on the untouched branch (so later failures are attributable to this change).
- [x] **Confirm the dead-code inventory is still accurate:**
  `grep -rn "DicePoolPanel\|DiceTriggerButton\|useCampaignDice" lib/ app/ tests/`
  returns only: `lib/components/CampaignChat/index.tsx`,
  `lib/components/dice/DicePoolPanel.tsx`, `lib/components/dice/DiceTriggerButton.tsx`,
  `lib/components/CampaignChat/useCampaignDice.ts`, and
  `tests/unit/components/CampaignChat/CampaignChat.dicePool.{ui,commit,scroll,ssr}.test.tsx`.
  If anything else appears, STOP and update `proposal.md` / `design.md` / `specs/` before
  continuing (change control).

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 585 --add-label "in-progress"`.
  Discover the repo's GitHub Project (`gh project list --owner dougis-org --format json`),
  resolve the status field option matching "In Progress"
  (`gh project field-list <n> --owner dougis-org --format json`), move the item via
  `gh project item-edit`. If no project item is found, log a warning and continue. If the
  `gh` token lacks `project` scope, tell the user to run `gh auth refresh -s project` and
  skip the project-item move (the label edit still proceeds).

### T1 — Write failing tests first (BDD/TDD) — see `tests.md`

- [x] Add `CampaignChat` footer tests (new `it` blocks in
  `tests/unit/components/CampaignChat/CampaignChat.drawer.test.tsx` or a small new
  `CampaignChat.footer.test.tsx`): "No active session" text present iff
  `activeSessionId == null`; no `/roll|dice/i` button and no
  `title="Dice Rolls for main screen pop out"` in the drawer in either state. These fail
  now (the dice trigger is still rendered).
- [x] If `tests/unit/components/CampaignChat/CampaignChat.dicePool.scroll.test.tsx` holds
  any SSE-stream-driven auto-scroll assertion (rollerId self, rollerId other + near-bottom
  gate) not already present in `CampaignChat.roll.test.tsx`, port that case into
  `CampaignChat.roll.test.tsx`, driving the roll via a mocked SSE `'roll'` event instead
  of the panel. Confirm the ported test passes against the current code before deleting
  the source file.

### T2 — Edit `lib/components/CampaignChat/index.tsx`

- [x] Remove imports: `DicePoolPanel`, `DiceTriggerButton`, `useCampaignDice`.
- [x] Remove refs `diceTriggerRef`, `dicePanelRef`.
- [x] Remove the `useCampaignDice({...})` call and its destructured values (`dicePool`,
  `isTriggerDisabled`, `isRolling`, `rollError`, `handleDiceRoll`, `handlePercentileRoll`).
- [x] Remove `<DicePoolPanel ... />` from the flex-row wrapper (keep the wrapper —
  design Decision 3).
- [x] Replace the always-rendered bottom bar
  (`<div className="border-t border-gray-700 p-2 flex-shrink-0 flex items-center justify-between">…</div>`)
  with a footer rendered only when `activeSessionId === null`:
  `{activeSessionId === null && (<div className="border-t border-gray-700 px-3 py-2 flex-shrink-0"><p className="text-xs text-gray-500">No active session</p></div>)}`.
- [x] Keep the `announcePresence` / `clearPresence` effect and the `activeSessionId` prop
  untouched.
- [x] `npm run typecheck` — expect no unused-symbol / missing-import errors from this file.

### T3 — Delete dead source

- [x] `git rm lib/components/dice/DicePoolPanel.tsx lib/components/dice/DiceTriggerButton.tsx lib/components/CampaignChat/useCampaignDice.ts`
- [x] Re-run `grep -rn "DicePoolPanel\|DiceTriggerButton\|useCampaignDice" lib/ app/ tests/`
  — only the four `CampaignChat.dicePool.*` test files should remain.

### T4 — Delete / adjust dead tests

- [x] `git rm tests/unit/components/CampaignChat/CampaignChat.dicePool.ui.test.tsx tests/unit/components/CampaignChat/CampaignChat.dicePool.commit.test.tsx tests/unit/components/CampaignChat/CampaignChat.dicePool.scroll.test.tsx tests/unit/components/CampaignChat/CampaignChat.dicePool.ssr.test.tsx`
  (after T1 has ported any unique auto-scroll case).
- [x] Verify `tests/unit/components/dice/{DieGlyph,DiePoolButton,PercentileButton}.test.tsx`
  and `tests/unit/components/GlobalDiceFab*.test.tsx` are untouched and still pass.
- [x] Scan the remaining `tests/unit/components/CampaignChat/*.test.tsx` for any query that
  targeted the dice trigger (`/roll|dice/i` button, `Dice Rolls for main screen pop out`);
  update or remove only those assertions, leaving all other assertions verbatim.

### T5 — Confirm acceptance criteria are covered

- [x] Every scenario in `specs/roll-share-ui/spec.md` (ADDED footer, MODIFIED
  activeSessionId prop, MODIFIED auto-scroll, REMOVED requirements) and
  `specs/campaign-chat-dock/spec.md` (MODIFIED source location) maps to a passing test or
  a `grep`/`ls` check recorded in `tests.md`.
- [x] `openspec validate remove-chat-docked-dice --strict` passes.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill over the staged diff. The primary agent automatically
  applies all clearly-correct findings directly — no pause, no findings list to the user,
  no confirmation. Apply fixes, re-run the affected tests, then commit.

## Validation

- [x] `npm run test:unit` — full unit suite green (special attention to
  `tests/unit/components/CampaignChat/` and `tests/unit/components/dice/`).
- [x] `npm run test:integration` — via the project harness (not Jest directly); green.
- [x] `npm run test:e2e` (or the project's E2E command) if the dice/chat E2E specs exist;
  green. Use a free port (not 3000) for any E2E server.
- [x] `npm run typecheck` — green.
- [x] `npm run build` — green.
- [x] `npm run lint` and the Verity pre-commit/pre-push gate — green (fix findings; do not
  waive).
- [x] Manual/visual check via the `run` skill: expand the chat dock with an active session
  (no footer, feed fills the reclaimed space) and with no active session ("No active
  session" footer, no dice trigger). Tab order through the drawer is sane.
- [x] All completed tasks marked `- [x]`.
- [x] All steps in [Remote push validation] pass.

## Remote push validation

Determine whether the change is docs-only: `git diff --name-only origin/main...HEAD` — if
every file ends in `.md`, use the docs-only path; otherwise the full path. This change
touches `.tsx`/`.ts` → **full path**:

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — project integration harness; all pass
- **Regression / E2E** — project E2E/regression suite; all pass
- **Build** — `npm run build`; succeeds

If ANY step fails, iterate and fix before pushing.

## PR and Merge

- [x] Confirm the `openspec-review-code` sub-agent ran and all findings were addressed
  before the final commit.
- [x] Commit all changes to `remove-chat-docked-dice` and push.
- [x] Open a PR from `remove-chat-docked-dice` to `main`. The PR body MUST include
  `Closes #585`. Summarize: removes the chat-docked dice pool/trigger (superseded by
  `GlobalDiceFab`), deletes `DicePoolPanel` / `DiceTriggerButton` / `useCampaignDice` and
  their four dead tests, session-gates the "No active session" footer, expands the chat
  feed. Link the spec deltas.
- [x] **Issue lifecycle: mark in-review** — `gh issue edit 585 --add-label "in-review" --remove-label "in-progress"`
  and move the project item to the "In Review" column (same discovery as in-progress;
  warn and skip if not found).
- [x] Wait 60 seconds for CI to start.
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings
  (commit, run [Remote push validation], push, re-run) until zero findings. If findings
  persist after ≥3 iterations with no progress, report the stall with the remaining
  findings and wait for human guidance.
- [x] **After the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge`
  (never `--admin`, never force-merge).
- [x] **Iterate until merged** — loop until `gh pr view <PR-URL> --json state` returns
  `MERGED` (if `CLOSED`, stop and notify the user):
  1. Build & tests — run [Remote push validation]; fix, commit, push before anything else.
  2. PR comments — `gh pr view <PR-URL> --json reviewThreads`; resolve every unresolved
     thread (address, commit, validate, push, wait 180s) until all resolved.
  3. CI checks — after comments are clear, `gh pr checks <PR-URL>`; fix failing required
     checks (commit, validate, push, wait 180s), then restart from step 1.
- [x] Resolve every PR review comment before merge.

Blocking resolution flow:

- CI failure → diagnose from job log → fix → commit → [Remote push validation] → push → re-run.
- Security/quality finding → remediate (never waive on own judgment) → commit → validate → push → re-scan.
- Review comment → address → commit → validate → push → confirm thread resolved.
- Stalled > ~1 working day with no path → summarize blocker + remaining findings for the
  requester and pause.

## Post-Merge

- [x] From the primary checkout: `git checkout main` and `git pull --ff-only`.
- [x] Verify the merged changes are on `main`.
- [x] Mark all remaining tasks `- [x]`.
- [x] Update any repo docs that referenced the chat-docked dice panel (e.g.
  `.wolf/anatomy.md`, `.verity/memory/` pointers if stale — regen is auto but check).
- [x] Sync approved spec deltas into `openspec/specs/`:
  - `openspec/specs/roll-share-ui/spec.md` — apply the REMOVED / MODIFIED / ADDED sections;
    update the Purpose line to scope the capability to roll-feed rendering + history (drop
    "a staging pool of dice controls … a standalone percentile (d%) control, an explicit
    commit"); move the removed requirements' text into "Historical removals" with a
    pointer to this change.
  - `openspec/specs/campaign-chat-dock/spec.md` — apply the MODIFIED "Source location"
    requirement (drop `useCampaignDice.ts`).
  - Update relative links: `../../design.md` → `../../changes/archive/YYYY-MM-DD-remove-chat-docked-dice/design.md`
    (and similarly for `tasks.md`).
- [x] Archive: move `openspec/changes/remove-chat-docked-dice/` to
  `openspec/changes/archive/YYYY-MM-DD-remove-chat-docked-dice/` and stage the copy + the
  deletion of the original in a **single** commit.
- [x] Confirm the archive dir exists and `openspec/changes/remove-chat-docked-dice/` is gone.
- [x] Create a doc branch: `git checkout -b doc/archive-YYYY-MM-DD-remove-chat-docked-dice`
  and `git push -u origin doc/archive-YYYY-MM-DD-remove-chat-docked-dice`.
- [x] Open a PR `docs: archive remove-chat-docked-dice (YYYY-MM-DD)` to `main` — never push
  directly to `main`.
- [x] Immediately `gh pr merge <DOC-PR-URL> --auto --merge` (never `--admin`).
- [x] Monitor the doc PR to merge (same loop as the implementation PR).
- [x] Remove the worktree: `git worktree remove .worktrees/remove-chat-docked-dice`.
- [x] Prune merged branches: `git fetch --prune` and
  `git branch -D remove-chat-docked-dice doc/archive-YYYY-MM-DD-remove-chat-docked-dice`.

## Completion checklist

- [x] Docs updated (anatomy / memory pointers).
- [x] Spec deltas synced into `openspec/specs/` before archive.
- [x] Change archived as a single atomic commit.
- [x] Worktree removed and merged local branches pruned.
