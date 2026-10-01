# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (done in primary checkout)
- [x] **Step 2 — Create and publish working branch:** worktree `.worktrees/encounter-picker-sort-search` on branch `encounter-picker-sort-search`, pushed to origin

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If not listed, halt, tell the user the plugin is required, provide install guidance, and wait for confirmation.

## Execution

- [x] **Issue lifecycle: mark in-progress:** `gh issue edit 814 --add-label "in-progress"`. Discover the Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" option (`gh project field-list <n> --owner dougis-org --format json`), move the item with `gh project item-edit`. Warn and continue if not found; if the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip the project update.
- [x] Confirm work happens in `.worktrees/encounter-picker-sort-search` and the branch is on remote
- [x] **Task 1 — Helper (TDD):** write failing tests in `tests/unit/utils/encounterFilter.test.ts`, then implement `lib/utils/encounterFilter.ts` (`filterAndSortEncounters`). Reuse the pattern from `app/monsters/filterUtils.ts`.
- [x] **Task 2 — Component wiring (TDD):** extend `tests/unit/components/CombatSetupView.test.tsx`, then update `lib/components/CombatSetupView.tsx` (search input, `useMemo` options, "No encounters match" message, hidden in campaign empty state)
- [x] **Task 3 — E2E:** add a scenario in `tests/e2e/` that searches the picker on `/combat` and starts combat with the filtered encounter
- [x] **Task 4 — Docs:** note the sort/search behavior wherever combat setup is documented; confirm acceptance criteria in `openspec/changes/encounter-picker-sort-search/specs/combat-encounter-picker-search/spec.md` are covered

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a sub-agent to run the `openspec-review-code` skill. Automatically apply all clearly-correct findings without presenting the list or asking confirmation, re-run tests, then commit.

## Validation

- [x] `npm run test:unit`
- [x] E2E tests (`npx playwright test` for the new spec)
- [x] Type check (`npx tsc --noEmit`)
- [x] Build (`npm run build`)
- [ ] Security/code quality checks required by project standards (Codacy/Verity gates)
- [ ] All completed tasks marked complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only** (`git diff --name-only origin/main` all end in `.md`).

**Full path** (any non-`.md` file changed): unit tests, integration tests, E2E/regression tests, and build must all pass.

**Docs-only path:** build must succeed; skip integration and E2E.

If any required step fails, fix it before pushing. Use the commands documented in CLAUDE.md/README (note: use `npm run test:unit`, there is no `npm test`).

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent ran and all findings were addressed before the final commit
- [ ] Commit and push to the working branch
- [ ] Open PR to `main`; body MUST include `Closes #814`
- [ ] **Issue lifecycle: mark in-review:** `gh issue edit 814 --add-label "in-review" --remove-label "in-progress"` and move the project item to "In Review" (same discovery; warn and skip if not found)
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero remain. After three or more iterations without progress, report the stall and wait for guidance.
- [ ] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --squash` (the repo ruleset allows squash only; never `--admin`)
- [ ] **Iterate until merged** until `gh pr view <PR-URL> --json state` is `MERGED` (exit and notify if `CLOSED`); never force-merge:
  1. **Build and tests** — run [Remote push validation]; fix failures first
  2. **PR comments** — address each unresolved thread, commit, validate, push, resolve the thread (GraphQL `resolveReviewThread`), wait 180s
  3. **CI failures** — only after comments are resolved, check `gh pr checks <PR-URL>`; fix, validate, push, wait 180s; restart from step 1

Ownership metadata:

- Implementer: dougis (with Claude)
- Reviewer(s): pr-review-toolkit:review-pr, Codacy
- Required approvals: per repo branch protection

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [ ] Verify merged changes appear on `main`
- [ ] Mark all remaining tasks complete
- [ ] Update repository documentation impacted by the change
- [ ] Sync spec delta to `openspec/specs/combat-encounter-picker-search/spec.md` as a valid main-spec form (not delta format); update relative links to `../../changes/archive/YYYY-MM-DD-encounter-picker-sort-search/design.md` and `.../tasks.md`
- [ ] Archive: move `openspec/changes/encounter-picker-sort-search/` to `openspec/changes/archive/YYYY-MM-DD-encounter-picker-sort-search/` in a single commit
- [ ] Confirm the archive dir exists and the original is gone
- [ ] Create doc branch `doc/archive-YYYY-MM-DD-encounter-picker-sort-search` and push it
- [ ] Open a docs-only PR titled `docs: archive encounter-picker-sort-search (YYYY-MM-DD)`; do NOT push directly to `main`
- [ ] Immediately enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor the doc PR until merged (address comments/CI on the same branch)
- [ ] Remove the worktree: `git worktree remove .worktrees/encounter-picker-sort-search`
- [ ] Prune: `git fetch --prune` and `git branch -D encounter-picker-sort-search doc/archive-YYYY-MM-DD-encounter-picker-sort-search`
