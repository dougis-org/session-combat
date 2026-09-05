# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during propose — worktree created from `origin/main` at commit `b00d169`.
- [x] **Step 2 — Create and publish working branch:** `storage-refactor-close-gaps` created via `git worktree add .worktrees/storage-refactor-close-gaps -b storage-refactor-close-gaps origin/main` and pushed with `git push -u origin storage-refactor-close-gaps`.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 708 --repo dougis-org/session-combat --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Task A — `savedContentRepo.ts`:** create `lib/storage/savedContentRepo.ts` exporting `list`, `create`, `update`, `remove`, each wrapped in `runStorageOp` per design.md Decision 1 & 3. `list` passes `isEmpty: (r) => r.length === 0`.
  - [x] Write/adjust unit tests first (TDD): success path, empty-result path (`list` only), and DB-error path (asserts `StorageError` rejection + exactly one `logStorageEvent` call with `outcome: "error"`) for all four functions.
  - [x] Implement `savedContentRepo.ts` to make the tests pass, porting the existing query/insert/update/delete logic verbatim from `lib/storage.ts`'s current `savedContent.*` block (no logic changes beyond the error-handling seam).
- [x] **Task B — `encounterRepo.ts` additions:** add `loadEncountersByIds`, `addEncounterToCampaign`, `removeEncounterFromCampaign` to the existing `lib/storage/encounterRepo.ts`, each wrapped in `runStorageOp` per design.md Decision 2 & 3. `loadEncountersByIds` passes `isEmpty: (r) => r.length === 0`. Add a short comment noting these two mutators intentionally touch the `campaigns` collection because they're encounter-linking operations (per design.md's Decision 2 trade-off note).
  - [x] Write/adjust unit tests first (TDD): success path, empty-result path (`loadEncountersByIds` only), and DB-error path for all three functions.
  - [x] Implement the three functions to make the tests pass, porting the existing logic verbatim.
- [x] **Task C — `lib/storage.ts` delegation:** replace the 7 inline implementations (the `savedContent.list/create/update/remove` block and `loadEncountersByIds`/`addEncounterToCampaign`/`removeEncounterFromCampaign`) with thin delegations to the new/updated repo functions, matching the existing delegation style used for every other already-migrated method (e.g. `async loadSessionLogs(...) { return sessionLogRepo.loadSessionLogs(...); }`). Preserve exact method names, signatures, and `storage.savedContent` nesting.
- [x] **Task D — swallow-site sweep:** confirm `grep -c "console\.\(error\|warn\)" lib/storage.ts` returns `0` after Tasks A–C.
- [x] **Task E — caller re-verification:** re-grep all callers of the 7 methods (`app/api/content/route.ts`, `app/api/content/[id]/route.ts`, `app/api/encounters/route.ts`, `app/api/campaigns/[id]/encounters/route.ts`, `app/api/campaigns/[id]/encounters/[encounterId]/route.ts`, `lib/scripts/backfillCampaignEncounters.ts`) to confirm no new caller was introduced since design.md was written, and that each still handles a thrown error appropriately (per design.md's risk mitigation).
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — done: this task deliberately reuses `runStorageOp`/`logStorageEvent`/`StorageError`/`normalizeStoredEntityId` rather than introducing anything new.
- [x] Confirm acceptance criteria are covered: cross-check each scenario in `specs/storage-telemetry-seam-completion/spec.md` against the tests written in Tasks A and B.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable)
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `lib/storage.ts` and `lib/storage/*.ts`, so it is **not** docs-only — apply the full path.

**Full path:**

- **Unit tests** — `npm test` (or the project's configured test runner); all tests must pass, including the new `savedContentRepo`/`encounterRepo` tests and every existing test that mocks `storage`
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — `npm run build`; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `storage-refactor-close-gaps` to `main`. PR body **MUST include `Closes #708`** (and reference `#499` for context, without closing it — #499 stays open only until its own remaining checkboxes are otherwise satisfied, which this PR completes).
- [x] **Issue lifecycle: mark in-review** — run `gh issue edit 708 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [x] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge; recall repo convention — main is squash-only, 0 approvals required, `ci-gate` + Codacy are the required checks)
- [x] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: dougis (via agent session)
- Reviewer(s): pr-review-toolkit:review-pr (automated), dougis (final human sign-off per repo's 0-required-approvals ruleset — optional but welcome)
- Required approvals: 0 (per `main`'s squash-only ruleset — `ci-gate` + Codacy are the required checks)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [x] `git checkout main` (in the primary checkout, not the worktree) and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`: `grep -c "console\.\(error\|warn\)" lib/storage.ts` returns `0`; `ls lib/storage/savedContentRepo.ts` exists
- [x] Mark all remaining tasks as complete (`- [x]`)
- [x] Update repository documentation impacted by the change (none expected beyond the spec sync below)
- [x] Sync approved spec deltas into `openspec/specs/`: copy `specs/storage-telemetry-seam-completion/spec.md` to `openspec/specs/storage-telemetry-seam-completion/spec.md`. Update its relative links — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-storage-refactor-close-gaps/design.md`.
- [x] Archive the change: move `openspec/changes/storage-refactor-close-gaps/` to `openspec/changes/archive/YYYY-MM-DD-storage-refactor-close-gaps/` **and stage both the new location and the deletion of the old location in a single commit**
- [x] Confirm `openspec/changes/archive/YYYY-MM-DD-storage-refactor-close-gaps/` exists and `openspec/changes/storage-refactor-close-gaps/` is gone
- [x] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-storage-refactor-close-gaps` then `git push -u origin doc/archive-YYYY-MM-DD-storage-refactor-close-gaps`
- [x] Open a PR from `doc/archive-YYYY-MM-DD-storage-refactor-close-gaps` to `main` with title `docs: archive storage-refactor-close-gaps (YYYY-MM-DD)`
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [x] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [x] **Close #499**: once this PR and #708 are merged, verify `lib/storage.ts` has zero `console.error`/`console.warn` sites, then update #499's Definition of Done checkboxes to fully checked and close #499 as completed (`gh issue close 499 --repo dougis-org/session-combat --reason completed`) — #499's tracking scope is only now actually done.
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D storage-refactor-close-gaps doc/archive-YYYY-MM-DD-storage-refactor-close-gaps`
- [x] Remove the change's dedicated worktree: `git worktree remove .worktrees/storage-refactor-close-gaps` (use `--force` if the openspec-shared submodule blocks a clean removal, per project convention)

Required cleanup after archive: `git fetch --prune` and `git branch -D storage-refactor-close-gaps doc/archive-YYYY-MM-DD-storage-refactor-close-gaps`
