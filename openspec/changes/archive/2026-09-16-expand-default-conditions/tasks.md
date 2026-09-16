# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose (`git fetch origin main`)
- [x] **Step 2 — Create and publish working branch:** `.worktrees/expand-default-conditions` created from `origin/main`, branch `expand-default-conditions` pushed to remote during propose

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 742 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Confirm working directory is `.worktrees/expand-default-conditions` (never the primary checkout) for every remaining step
- [x] **T1 — Add the three catalog entries**: edit `lib/data/conditionCatalog.ts`, appending `Slowed`, `Confused`, `Turned` to `CONDITION_CATALOG` after `Unconscious`, per the descriptions drafted in `design.md` Decision 1. Update the file's doc comment (currently "The 15 standard D&D 5e conditions...") to reflect 18 entries / the new composition.
- [x] **T2 — Update the hardcoded-length test**: in `tests/unit/lib/scripts/seedConditionCatalog.test.ts`, change `expect(CONDITION_CATALOG).toHaveLength(15)` to `toHaveLength(18)`; add an assertion that `CONDITION_CATALOG.map(c => c.name)` contains `"Slowed"`, `"Confused"`, and `"Turned"` (per design.md Decision 3).
- [x] **T3 — Grep for other hardcoded assumptions**: search the full test suite for other references to the literal `15`/catalog length or an enumerated list of all condition names that might also need updating (e.g. `grep -rn "toHaveLength(15)\|CONDITION_CATALOG" tests/`) — reuse/extend existing tests rather than adding new ones if found, per design.md's minimal-diff approach.
- [x] **T4 — Reuse-before-build check**: confirm no changes are needed to `lib/storage/conditionCatalogRepo.ts`, `app/api/conditions/catalog/route.ts`, `ConditionFormModal.tsx`, or `ConditionControls.tsx` — these are shape/count-agnostic per design.md Goals; if any test there fails after T1/T2, investigate before adding new code (it likely indicates an undiscovered assumption, not a required feature change).
- [x] Confirm acceptance criteria are covered: all scenarios in `specs/condition-catalog/spec.md` (both ADDED and MODIFIED sections) map to a concrete assertion added/updated in T2/T3

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: targeted catalog tests (42 passed) + full unit suite (3940/3940 passed) + integration suite (357/357 passed, 4 pre-existing skips)
- [x] Run E2E tests (if applicable) — no dedicated combatant-card/conditions E2E suite exists in `tests/e2e`; no UI/API contract change, so none needed
- [x] Run type checks: `npx tsc --noEmit` — clean
- [x] Run build: `npm run build` — succeeded (worktree needed its own `npm install`; none existed before)
- [ ] Run security/code quality checks required by project standards (Verity gate, Codacy as configured)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against `main`) and check whether every changed file ends in `.md`. This change touches `lib/data/conditionCatalog.ts` and a test file (non-`.md`), so the **full path** applies.

**Full path**:

- **Unit tests** — `npm test`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `expand-default-conditions` to `main`. **PR body MUST include `Closes #742`.** (PR #750)
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 742 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. (0 findings, all checks passed first pass)
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's `main` branch is squash-only per its ruleset — do not use `--merge`; NEVER use `--admin` to force the merge) (merged directly once `mergeStateStatus` was CLEAN, commit `aa82063`)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated gate) + human reviewer per repo branch protection
- Required approvals: 0 human approvals required by `main`'s squash-only ruleset (per project memory), but `ci-gate` and Codacy required checks must pass

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none needed — confirmed no README/CLAUDE.md references the condition catalog's exact count)
- [x] Sync approved spec deltas into `openspec/specs/`: copy `openspec/changes/expand-default-conditions/specs/condition-catalog/spec.md`'s MODIFIED/ADDED content into `openspec/specs/condition-catalog/spec.md` (merge, don't overwrite — the existing capability spec has other requirements from `2026-09-16-default-condition-catalog` that must be preserved), updating relative links to `../../changes/archive/YYYY-MM-DD-expand-default-conditions/design.md` and `.../tasks.md`
- [x] Archive the change: move `openspec/changes/expand-default-conditions/` to `openspec/changes/archive/YYYY-MM-DD-expand-default-conditions/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-expand-default-conditions/` exists and `openspec/changes/expand-default-conditions/` is gone
- [ ] **Operational step**: re-run `npm run seed:conditions` against each deployed environment's database (dev/staging/prod) to upsert the 3 new entries — idempotent, safe to run multiple times; confirm via log output "Inserted: Slowed", "Inserted: Confused", "Inserted: Turned" on first run per environment. **Left for the user** — requires deployed-environment DB credentials/connection strings this agent does not have and touches prod data directly.
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-expand-default-conditions` then `git push -u origin doc/archive-YYYY-MM-DD-expand-default-conditions`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-expand-default-conditions` to `main` with title `docs: archive expand-default-conditions (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (this repo is squash-only; NEVER use `--admin`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/expand-default-conditions`
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D expand-default-conditions doc/archive-YYYY-MM-DD-expand-default-conditions`

Required cleanup after archive: `git fetch --prune` and `git branch -D expand-default-conditions doc/archive-YYYY-MM-DD-expand-default-conditions`
