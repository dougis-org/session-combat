# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (primary checkout stays on `main`)
- [x] **Step 2 — Working branch exists and is published:** worktree `.worktrees/auto-end-combat-prompt`, branch `auto-end-combat-prompt` (already pushed with `git push -u origin auto-end-combat-prompt`)

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** (#812): run `gh issue edit 812 --add-label "in-progress"`. Then discover the GitHub Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" status option (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. Warn and continue if not found; if the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project update.
- [x] Task 1 — Confirm `.worktrees/auto-end-combat-prompt` is the working directory and the branch is on remote
- [x] Task 2 — Add `lib/combat/combatEnd.ts` with `getCombatEndSuggestion` (reuse `usesDeathSaves` from `lib/combat/deathSaves.ts`)
- [x] Task 3 — Add `answeredSuggestion` state and derived prompt-open value to `lib/components/ActiveCombatView.tsx`
- [x] Task 4 — Render second `ConfirmDialog` (unique `titleId`); Yes closes it and calls `endCombat()` directly; No/Escape records dismissal
- [x] Task 5 — Verify reload into finished combat prompts, and lair/dying/stable cases per spec
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch
- [x] Confirm acceptance criteria in `openspec/changes/auto-end-combat-prompt/specs/combat-end-prompt/spec.md` are covered

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit tests: `npm run test:unit`
- [x] Run integration tests: `npm run test:integration` (if affected)
- [ ] Run E2E tests (if applicable): `npm run test:e2e`
- [x] Run type checks: `npx tsc --noEmit`
- [x] Run lint: `npm run lint`
- [x] Run build: `npm run build`
- [x] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: run `git diff --name-only HEAD` (or compare against the base branch) and check whether every changed file ends in `.md`.

**Full path** (any non-`.md` file changed):

- **Unit tests** — `npm run test:unit`; all must pass
- **Integration tests** — `npm run test:integration`; all must pass
- **Regression / E2E tests** — `npm run test:regression`; all must pass
- **Build** — `npm run build`; must succeed with no errors

**Docs-only path:**

- **Build** — `npm run build`; must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `auto-end-combat-prompt` to `main`. PR body MUST include `Closes #812`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 812 --add-label "in-review" --remove-label "in-progress"`, then move the project item to "In Review" via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (repo ruleset allows squash only; NEVER use `--admin`)
- [ ] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (exit and notify if `CLOSED`); never wait for a human to report the merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address each unresolved thread, commit, validate, push, resolve the thread via the `resolveReviewThread` GraphQL mutation, wait 180 seconds
  3. **CI check failures** — only after comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks, commit, validate, push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate.

Ownership metadata:

- Implementer: dougis (agent-assisted)
- Reviewer(s): `pr-review-toolkit:review-pr`, human reviewer as requested
- Required approvals: Proposal approval before apply; branch-protection checks

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/combat-end-prompt/spec.md`; update relative links to `../../changes/archive/YYYY-MM-DD-auto-end-combat-prompt/design.md` and `.../tasks.md`
- [ ] Archive: move `openspec/changes/auto-end-combat-prompt/` to `openspec/changes/archive/YYYY-MM-DD-auto-end-combat-prompt/` and stage copy + deletion in a single commit
- [ ] Confirm the archive dir exists and `openspec/changes/auto-end-combat-prompt/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-auto-end-combat-prompt` then `git push -u origin doc/archive-YYYY-MM-DD-auto-end-combat-prompt`
- [ ] Open PR to `main` titled `docs: archive auto-end-combat-prompt (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER `--admin`)
- [ ] Monitor the doc PR until merged (address comments and CI failures on the same branch)
- [ ] Remove the worktree: `git worktree remove .worktrees/auto-end-combat-prompt`
- [ ] Prune: `git fetch --prune` and `git branch -D auto-end-combat-prompt doc/archive-YYYY-MM-DD-auto-end-combat-prompt`
