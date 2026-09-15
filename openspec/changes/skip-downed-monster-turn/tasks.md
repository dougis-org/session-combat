# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal — worktree
  `.worktrees/skip-downed-monster-turn` was created via
  `git worktree add .worktrees/skip-downed-monster-turn -b
  skip-downed-monster-turn origin/main` from the primary checkout.
- [x] **Step 2 — Create and publish working branch:** done during
  proposal — `skip-downed-monster-turn` pushed to remote via
  `git push -u origin skip-downed-monster-turn`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the
  available skills list for `pr-review-toolkit:review-pr`. If the skill is
  not listed, halt immediately, inform the user that the plugin is
  required, provide installation guidance, and do not proceed until the
  user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — this change is issue-driven
  (GitHub issue #730). Run `gh issue edit 730 --add-label "in-progress"`.
  Then discover the GitHub Project linked to `dougis-org/session-combat`
  via `gh project list --owner dougis-org --format json`, resolve the
  status field option semantically matching "In Progress" via
  `gh project field-list <project-number> --owner dougis-org --format
  json`, and move the item via `gh project item-edit`. If no project item
  is found, log a warning and continue. If the `gh` token lacks the
  `project` scope, instruct the user to run `gh auth refresh -s project`
  and skip the project-item update (issue label update still proceeds).
- [x] **Confirm working location:** confirm the current shell is inside
  `.worktrees/skip-downed-monster-turn` and the branch is
  `skip-downed-monster-turn` before making any code edit.
- [x] **T1 — Extract/inline the skip predicate.** In
  `lib/hooks/useCombat.ts`, add the downed-monster predicate used by
  `nextTurn()`: a combatant is skippable iff `type === 'monster' && hp <=
  0`. (Design decision 1.)
- [x] **T2 — Rework `nextTurn()`'s index-advance into a bounded skip
  loop.** Replace the single `if (nextIndex >= combatState.combatants.length)`
  block (currently `lib/hooks/useCombat.ts:349-378`) with a loop bounded at
  `combatState.combatants.length` iterations that: advances the index by
  one per iteration; on wrap, resets to `0`, increments the round, and runs
  the existing `processRoundEnd` + condition-expiry alert exactly as today;
  and stops as soon as the candidate at the new index is not skippable per
  T1. Reuse the existing `resetIncomingLegendaryPool` call, applied only to
  the final landing index. (Design decision 2.)
- [x] **T3 — Handle the all-skippable exhaustion case.** If the bounded
  loop in T2 completes `combatState.combatants.length` iterations without
  finding a non-skippable combatant, return without calling
  `saveCombatState` (no state mutation) and call
  `alert('No combatants remain able to take a turn.')`. (Design decision
  3.)
- [x] **T4 — Look for existing tooling/functions to reuse.** Confirm no
  other helper already implements "find next combatant able to act"
  elsewhere in `lib/combat/` or `lib/hooks/` before adding T1-T3 (checked
  during design: `usesDeathSaves`, `lifeStateDisplay` inform the predicate
  but do not implement it; no existing turn-order helper was found to
  reuse).
- [x] **T5 — Write/extend unit tests in the `useCombat` test suite**
  (colocated with existing `nextTurn` coverage) for every scenario in
  `openspec/changes/skip-downed-monster-turn/specs/turn-order-advancement/spec.md`:
  - Monster at 0 HP is skipped
  - Consecutive downed monsters are all skipped
  - Player at 0 HP (`lifeState: 'dying'`) keeps their turn
  - Lair combatant is never skipped
  - Skip crosses the round wrap (round increments by exactly 1,
    `processRoundEnd` fires exactly once)
  - Every remaining combatant is a downed monster → no-op + alert,
    `currentTurnIndex`/`currentRound`/combatant state all unchanged
  - Legendary-action pool reset targets only the final landing combatant,
    skipped monster's pool is untouched
  - Healed monster (hp raised above 0 after being skipped) resumes its
    normal turn on its next natural turn
- [x] Confirm all acceptance criteria in
  `openspec/changes/skip-downed-monster-turn/specs/turn-order-advancement/spec.md`
  are covered by the tests written in T5.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. Automatically apply all clearly-correct
  findings directly to the code — without stopping, without presenting the
  findings list to the user, and without asking for confirmation. Apply
  fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests (`npm test` or project-standard command)
- [x] Run E2E tests if any cover active-combat turn advancement
  (`active-combat-view` integration specs) — not expected to need new
  cases, but must still pass unchanged (none found: no `e2e`/`integration`
  spec references `ActiveCombatView`)
- [x] Run type checks (`npm run typecheck` or project-standard command)
- [x] Run build (`npm run build`)
- [ ] Run security/code quality checks required by project standards
  (Codacy / Verity gate)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run
`git diff --name-only HEAD` (or compare the working branch against the base
branch) and check whether every changed file ends in `.md`. This change is
expected to touch `lib/hooks/useCombat.ts` and its test file, so the
**full path** applies.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all
  tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression
  test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no
  errors

If **ANY** required step fails, you **MUST** iterate and address the
failure before pushing.

Use the project's documented commands for each of the above (see
`package.json` scripts / `CLAUDE.md`).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings
  were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `skip-downed-monster-turn` to `main`. The PR body
  **MUST include `Closes #730`** (this change is issue-driven).
- [ ] **Issue lifecycle: mark in-review** — run
  `gh issue edit 730 --add-label "in-review" --remove-label
  "in-progress"`. Then move the project item to the status column
  semantically matching "In Review" via `gh project item-edit` (same
  project/field/option discovery as the in-progress lifecycle step above;
  warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, push, re-run) until zero findings remain. If findings
  persist after three or more iterations with no progress, report the
  stall with remaining findings listed and wait for human guidance before
  continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero
  findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`
  to force the merge — see project feedback memory: no admin merge
  bypass, and note `main` is a squash-only ruleset requiring `--squash`
  with the `ci-gate` + Codacy required checks)
- [ ] **Iterate until merged** — repeat the following priority loop
  continuously until `gh pr view <PR-URL> --json state` returns `MERGED`;
  if it returns `CLOSED` exit and notify the user — **never wait for a
  human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix
     any failures, commit, and push before doing anything else in this
     iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`;
     for every unresolved thread, address the feedback, commit fixes, run
     [Remote push validation], push, wait 180 seconds; continue until all
     threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing
     required checks, commit, run [Remote push validation], push, wait 180
     seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before
pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` (automated gate) + repository
  code owner(s) per branch protection
- Required approvals: per `main`'s squash-only ruleset — `ci-gate` and
  Codacy required checks passing; 0 human approvals required by the
  ruleset, but any human review comment must still be resolved per
  project policy before merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push →
  re-scan (do not waive without a human-approved reason per project
  policy — see `CLAUDE.md` "Quality gate: accepted risks")
- Review comment → address → commit → validate locally → push → confirm
  resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary
  checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none
  expected beyond this change's own artifacts — `nextTurn()` has no
  external docs describing its behavior)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy
  `openspec/changes/skip-downed-monster-turn/specs/turn-order-advancement/spec.md`
  to `openspec/specs/turn-order-advancement/spec.md` (new capability —
  first sync, no prior spec.md to merge into). Update relative links that
  pointed into the change directory so they resolve from the archive
  location — replace `../../design.md` with
  `../../changes/archive/YYYY-MM-DD-skip-downed-monster-turn/design.md`
  and similarly for `../../tasks.md`.
- [ ] Archive the change: move
  `openspec/changes/skip-downed-monster-turn/` to
  `openspec/changes/archive/YYYY-MM-DD-skip-downed-monster-turn/` **and
  stage both the new location and the deletion of the old location in a
  single commit** — do not commit the copy and delete separately
- [ ] Confirm
  `openspec/changes/archive/YYYY-MM-DD-skip-downed-monster-turn/` exists
  and `openspec/changes/skip-downed-monster-turn/` is gone
- [ ] **Create a doc branch** for the archive and spec updates:
  `git checkout -b doc/archive-YYYY-MM-DD-skip-downed-monster-turn` then
  `git push -u origin doc/archive-YYYY-MM-DD-skip-downed-monster-turn`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-skip-downed-monster-turn` to
  `main` with title
  `docs: archive skip-downed-monster-turn (YYYY-MM-DD)` — **do NOT push
  directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force
  the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation
  PR — address comments and CI failures, push to the same doc branch,
  repeat)
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D skip-downed-monster-turn
  doc/archive-YYYY-MM-DD-skip-downed-monster-turn`
- [ ] Remove the change's dedicated worktree:
  `git worktree remove .worktrees/skip-downed-monster-turn` (from the
  primary checkout)

Required cleanup after archive: `git fetch --prune` and
`git branch -D skip-downed-monster-turn
doc/archive-YYYY-MM-DD-skip-downed-monster-turn`
