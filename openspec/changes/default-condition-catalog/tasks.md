# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only` (done in primary checkout before this change was proposed)
- [x] **Step 2 — Create and publish working branch:** dedicated worktree created at `.worktrees/default-condition-catalog` on branch `default-condition-catalog`, pushed with `git push -u origin default-condition-catalog`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 733 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] Confirm the `.github/openspec-shared` submodule is checked out in this worktree (`git submodule update --init --force .github/openspec-shared`) before relying on any shared schema tooling.
- [x] **Types**: add `StatusConditionCatalogEntry` (`{ name: string; description: string }`) to `lib/types.ts` near `StatusCondition`.
- [x] **Repo (write test first)**: add `tests/unit/lib/storage/conditionCatalogRepo.test.ts` covering `loadConditionCatalog()` shape and the empty-collection case; then implement `lib/storage/conditionCatalogRepo.ts` (`loadConditionCatalog(): Promise<StatusConditionCatalogEntry[]>` via `db.collection<StatusConditionCatalogEntry>("conditionCatalog").find({}).toArray()`, wrapped in `runStorageOp({ name: "loadConditionCatalog", collection: "conditionCatalog", isEmpty: (res) => res.length === 0 })`), returning only the typed `{ name, description }` fields (strip any other stored fields/`_id`).
- [x] Register `storage.loadConditionCatalog()` in `lib/storage.ts` façade, delegating to `conditionCatalogRepo`.
- [x] Add a `conditionCatalog` index/setup entry in `lib/db.ts` `initializeDatabase` if a uniqueness constraint on `name` is warranted (prevents duplicate seed rows).
- [x] **Seed script (write test first)**: add `tests/unit/lib/scripts/seedConditionCatalog.test.ts` asserting idempotent upsert-by-name (running twice yields 15 rows, not 30); then implement `lib/scripts/seedConditionCatalog.ts` (mirrors `lib/scripts/seedGlobalMonsters.ts` shape: `seedConditionCatalog()` + `runCli()`) with the 15 standard 5e conditions and their SRD descriptions (Blinded, Charmed, Deafened, Exhaustion, Frightened, Grappled, Incapacitated, Invisible, Paralyzed, Petrified, Poisoned, Prone, Restrained, Stunned, Unconscious).
- [x] Add an npm script (e.g. `seed:conditions`) to `package.json` invoking the new seed script's CLI entry, matching the existing seed script conventions.
- [x] **API route (write test first)**: add a route test asserting an authenticated `GET /api/conditions/catalog` returns 200 and a `{ name, description }[]` payload with no extra fields even if the stored document has extras; then implement `app/api/conditions/catalog/route.ts` using the existing `withAuth` wrapper and `storage.loadConditionCatalog()`.
- [x] **ConditionFormModal (write/extend tests first)**: extend `tests/unit/components/combatant-card/ConditionFormModal.test.tsx` with cases for: catalog populated → selecting an entry sets `description`; "Custom…" selected → free-text path unchanged (`parseConditionForm` behavior untouched); fetch failure/empty catalog → dropdown hidden/limited to Custom with a muted "No default conditions loaded — enter a custom one." note; modal usable (Custom path available) before the fetch resolves. Then implement the dropdown + "Custom…" option in `lib/components/combatant-card/ConditionFormModal.tsx`, fetching `GET /api/conditions/catalog` on mount, wiring selected catalog entries to `{ name, description }` and "Custom…" to today's existing free-text inputs.
- [x] **ConditionControls (write/extend tests first)**: extend `tests/unit/components/combatant-card/ConditionControls.test.tsx` with cases for description shown when non-empty and no extra line when empty. Then implement the inline description line in `lib/components/combatant-card/ConditionControls.tsx`'s expanded row (`{condition.description && (<span>...</span>)}`), styled as small/muted text.
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (e.g. reuse `runStorageOp`, `withAuth`, existing seed-script CLI scaffolding, existing modal fetch/loading-state patterns) rather than introducing new helpers.
- [x] Confirm acceptance criteria in `openspec/changes/default-condition-catalog/specs/condition-catalog/spec.md` are covered by the tests above (one test per scenario, minimum).

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [ ] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change is not expected to be docs-only (it adds a collection, repo, seed script, API route, and UI changes), so apply the **full path**.

**Full path** (any non-`.md` file changed):

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

Use the project's documented commands for each of the above (see project README or CLAUDE.md / AGENTS.md).

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `default-condition-catalog` to `main`. The PR body MUST include `Closes #733`.
- [ ] **Issue lifecycle: mark in-review**: run `gh issue edit 733 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --squash` (this repo's `main` branch is squash-only per its ruleset — NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` (automated), Doug (human, as needed)
- Required approvals: 0 approvals required for merge (per this repo's `main` branch ruleset), but `ci-gate` + Codacy required checks must pass

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (e.g. note the new `seed:conditions` step in any deploy/setup docs)
- [ ] Sync approved spec deltas into `openspec/specs/condition-catalog/spec.md`. After copying `spec.md`, update relative links that pointed into the change directory: replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-default-condition-catalog/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/default-condition-catalog/` to `openspec/changes/archive/YYYY-MM-DD-default-condition-catalog/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-default-condition-catalog/` exists and `openspec/changes/default-condition-catalog/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-default-condition-catalog` then `git push -u origin doc/archive-YYYY-MM-DD-default-condition-catalog`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-default-condition-catalog` to `main` with title `docs: archive default-condition-catalog (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --squash` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D default-condition-catalog doc/archive-YYYY-MM-DD-default-condition-catalog`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/default-condition-catalog` (from the primary checkout)

Required cleanup after archive: `git fetch --prune` and `git branch -D default-condition-catalog doc/archive-YYYY-MM-DD-default-condition-catalog`
