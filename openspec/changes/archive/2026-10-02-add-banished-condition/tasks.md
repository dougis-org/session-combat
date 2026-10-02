# Tasks

Issue: dougis-org/session-combat#813. Worktree: `.worktrees/add-banished-condition`. Branch: `add-banished-condition`.

## Preparation

- [x] **Step 1 — Sync default branch:** `git fetch origin main` (worktree created from `origin/main`)
- [x] **Step 2 — Create and publish working branch:** `add-banished-condition` created in `.worktrees/add-banished-condition` and pushed with `git push -u origin add-banished-condition`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Confirm worktree and branch:** `cd .worktrees/add-banished-condition`; confirm the branch is on the remote (`git push -u origin add-banished-condition` if not).
- [x] **Issue lifecycle: mark in-progress:** `gh issue edit 813 --add-label "in-progress"`. Discover the GitHub Project (`gh project list --owner dougis-org --format json`), resolve the "In Progress" option (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, warn and continue; if the token lacks `project` scope, tell the user to run `gh auth refresh -s project` and skip only the project update.
- [x] Follow strict TDD per `tests.md`: write the failing test, make it pass, refactor. Reuse existing helpers and fixtures before writing new ones.
- [x] **T1 Types:** add `removedFromPlay?: boolean` to `StatusConditionCatalogEntry` and `StatusCondition` in `lib/types.ts`.
- [x] **T2 Catalog:** add the Banished entry (`removedFromPlay: true`, SRD-style *Banishment* description) to `lib/data/conditionCatalog.ts`; update the doc comment; update `tests/unit/lib/scripts/seedConditionCatalog.test.ts` counts (18 -> 19) and add a Banished assertion.
- [x] **T3 Repo/API:** update `loadConditionCatalog` in `lib/storage/conditionCatalogRepo.ts` to project `removedFromPlay` only when `true`; confirm `app/api/conditions/catalog/route.ts` passes it through; extend `tests/unit/lib/storage/conditionCatalogRepo.test.ts`.
- [x] **T4 Modal:** in `lib/components/combatant-card/ConditionFormModal.tsx`, copy `removedFromPlay` from the selected catalog entry onto the submitted `StatusCondition` (never for custom entries); extend `tests/unit/components/combatant-card/ConditionFormModal.test.tsx`.
- [x] **T5 Helper:** create `lib/combat/removedFromPlay.ts` exporting `isRemovedFromPlay(combatant)`; tests in `tests/unit/combat/removedFromPlay.test.ts` including expiry via `processRoundEnd`.
- [x] **T6 Turn order:** extend the skip predicate in `nextTurn` (`lib/hooks/useCombat.ts`); tests for skip, round wrap, all-out alert, and no legendary reset for skipped combatants.
- [x] **T7 Unrolled exclusion:** apply the helper in `lib/hooks/useInitiativeModal.ts`, `rollUnrolledMonsters` (`lib/hooks/useCombat.ts`), and `unrolledMonsterCount` (`lib/components/ActiveCombatView.tsx`); tests for ignore and return-after-removal.
- [x] **T8 Targeting:** filter both lists and skip chips for removed-from-play targets in `lib/components/combatant-card/TargetingPanel.tsx` without mutating `targetIds`; component tests.
- [x] **T8b Target-add path:** add `onRequestCondition` to `lib/components/TargetActionModal.tsx` (replace the freeform condition mode and `onAddCondition`); in `TargetingPanel.tsx` render `ConditionFormModal` for the selected target, append the submitted condition via `onUpdateCombatant`, and remove `addConditionToTarget`; update `tests/unit/components/TargetActionModal.test.tsx` and `TargetingPanel` tests.
- [x] **T9 Card presentation:** grey the card (`opacity-50`) and show a "Banished" badge in the combatant card header/`lib/components/CombatantCard.tsx`; component tests.
- [x] **T10 Call-site sweep:** grep for remaining `!c.initiativeRoll`, `allCombatants.filter`, and `hp <= 0` skip predicates to confirm no site was missed; list any intentional exclusions in the PR.
- [x] Confirm acceptance criteria in `specs/removed-from-play-conditions/spec.md` are all covered by tests.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests (`npm test`; use `--testPathPatterns` for targeted runs)
- [x] Run E2E tests on a free port, not 3000 (if applicable)
- [x] Run type checks (`npx tsc --noEmit`)
- [x] Run build (`npm run build`)
- [x] Run security/code quality checks required by project standards (Verity gate, Codacy)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. If yes, apply the docs-only path; otherwise apply the full path.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

**Docs-only path** (every changed file is `.md`):

- **Build** — run the project's build script; build must succeed with no errors
- Skip integration and regression/E2E tests — they are not required when no code changed

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `add-banished-condition` to `main` (squash-only ruleset). The PR body MUST include `Closes #813`.
- [x] **Issue lifecycle: mark in-review:** `gh issue edit 813 --add-label "in-review" --remove-label "in-progress"`, then move the project item to the "In Review" column via `gh project item-edit` (same discovery as above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings and wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes:** `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`; `main` is squash-only)
- [x] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state` returns `MERGED` (exit and notify the user if `CLOSED`); never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix failures, commit, and push first
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address every unresolved thread, commit, validate, push, wait 180 seconds; continue until all are resolved
  3. **CI check failures** — poll `gh pr checks <PR-URL> --json isRequired,state`; fix failing required checks (`ci-gate`, Codacy), commit, validate, push, wait 180 seconds; restart from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (agent-assisted)
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent; repo owner on request
- Required approvals: 0 (ruleset); `ci-gate` + Codacy required checks

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] **Ops: re-seed the condition catalog** in each environment (dev/staging/prod): run `seedConditionCatalog` so Banished and its flag are upserted (idempotent)
- [x] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change
- [x] Sync approved spec deltas into `openspec/specs/` (global spec). After copying `specs/removed-from-play-conditions/spec.md` to `openspec/specs/removed-from-play-conditions/spec.md`, update relative links: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-add-banished-condition/design.md`, and similarly for `tasks.md`. Also hand-edit `openspec/specs/condition-catalog/spec.md` to change the "18 entries" counts to 19 and mention Banished. Note existing live specs may fail `openspec validate`; use `--skip-specs` and hand-merge if archive aborts.
- [x] Archive the change: move `openspec/changes/add-banished-condition/` to `openspec/changes/archive/YYYY-MM-DD-add-banished-condition/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-add-banished-condition/` exists and `openspec/changes/add-banished-condition/` is gone
- [x] **Create a doc branch:** `git checkout -b doc/archive-YYYY-MM-DD-add-banished-condition` then `git push -u origin doc/archive-YYYY-MM-DD-add-banished-condition`
- [x] Open a PR from the doc branch to `main` titled `docs: archive add-banished-condition (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin`)
- [x] Monitor the doc PR until it merges (address comments and CI failures on the same branch)
- [x] Remove the worktree and prune: `git worktree remove --force .worktrees/add-banished-condition` (the `openspec-shared` submodule requires `--force`), `git fetch --prune`, and `git branch -D add-banished-condition doc/archive-YYYY-MM-DD-add-banished-condition`
