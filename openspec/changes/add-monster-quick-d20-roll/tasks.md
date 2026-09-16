# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` and confirm the base is current (done during propose)
- [x] **Step 2 — Create and publish working branch:** dedicated worktree `.worktrees/add-monster-quick-d20-roll` created off `origin/main`, branch `add-monster-quick-d20-roll` created and pushed with `git push -u origin add-monster-quick-d20-roll` (done during propose)

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 734 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] Confirm the canonical `CombatantState.type` discriminator (`"player" | "monster" | "lair"`, `lib/types.ts:561`) still matches this assumption before writing the gate condition
- [ ] Populate the existing `data-card-section="quick-rolls"` slot in `lib/components/CombatantCard.tsx` with a native `<button>` (accessible name, `DiceD20Icon` from `lib/components/icons/dice.tsx`), rendered only when `combatant.type === 'monster'`
- [ ] Add a single `useState<BuiltRoll | null>` slot in `CombatantCard.tsx` (or a small co-located helper) to hold the active quick roll, reusing the existing `rollDie` import from `lib/utils/dice.ts` (already imported for death saves) — no new dice-generation utility
- [ ] On button click: roll via `rollDie(20)[0]`, construct `{ formula: '1d20', rolls: [value], total: value, breakdown: [{ sides: 20, value }], modifier: 0 }` as a `BuiltRoll` (type imported from `lib/dice/useDicePoolState.ts`), and set it as the active roll — replacing (not stacking) any roll already showing
- [ ] Render `<DiceRollOverlay built={activeRoll} disableAnimation onClose={() => setActiveRoll(null)} />` from `lib/components/dice/DiceRollOverlay.tsx` only when `activeRoll` is non-null
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed during design: `rollDie`, `DiceD20Icon`, `DiceRollOverlay`, and `BuiltRoll` are reused as-is; no new shared helper is introduced (see design.md Decision 3 rationale)
- [ ] Write unit tests (new file, e.g. `tests/unit/components/CombatantCard.quickRoll.test.tsx`) covering every scenario in `specs/monster-quick-roll/spec.md`:
  - button renders for `type: 'monster'`; absent for `type: 'player'` and `type: 'lair'`
  - clicking the button shows a result modal immediately with total/formula matching a mocked `rollDie` return value, with no animation-status gating
  - clicking the button does not call `fetch` or any session-chat/roll-submission function
  - two clicks in a row leave exactly one result modal showing the second roll's value
  - a quick roll leaves HP, conditions, targeting, and death-save state on the card unchanged
  - two sibling cards' quick-roll state are independent of each other
- [ ] Confirm acceptance criteria in `specs/monster-quick-roll/spec.md` are covered by the above tests, including the Non-Functional Acceptance Criteria (no animation engine import/mount, independent per-card state)

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests
- [ ] Run E2E tests (if applicable)
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `lib/components/CombatantCard.tsx` and new test files, so it is **not** docs-only — apply the full path.

**Full path**:

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `add-monster-quick-d20-roll` to `main`. The PR body **MUST include `Closes #734`**.
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 734 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): PR reviewers assigned via `pr-review-toolkit:review-pr` gate; repository codeowners
- Required approvals: per repository branch ruleset for `main` (squash-only, `ci-gate` + Codacy required checks, 0 human approvals required per `[[project_main_branch_squash_only_ruleset]]`) — the automated review gate above still applies regardless

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — single-component UI addition)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/add-monster-quick-d20-roll/specs/monster-quick-roll/spec.md` to `openspec/specs/monster-quick-roll/spec.md`, updating its relative link to `design.md` to `../../changes/archive/YYYY-MM-DD-add-monster-quick-d20-roll/design.md`
- [ ] Archive the change: move `openspec/changes/add-monster-quick-d20-roll/` to `openspec/changes/archive/YYYY-MM-DD-add-monster-quick-d20-roll/` **and stage both the new location and the deletion of the old location in a single commit**
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-add-monster-quick-d20-roll/` exists and `openspec/changes/add-monster-quick-d20-roll/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-add-monster-quick-d20-roll` then `git push -u origin doc/archive-YYYY-MM-DD-add-monster-quick-d20-roll`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-add-monster-quick-d20-roll` to `main` with title `docs: archive add-monster-quick-d20-roll (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D add-monster-quick-d20-roll doc/archive-YYYY-MM-DD-add-monster-quick-d20-roll`
- [ ] Remove this change's dedicated worktree: `git worktree remove .worktrees/add-monster-quick-d20-roll` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D add-monster-quick-d20-roll doc/archive-YYYY-MM-DD-add-monster-quick-d20-roll`
