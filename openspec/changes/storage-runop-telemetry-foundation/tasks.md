# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** fetched `origin/main` from the primary checkout; worktree created at `.worktrees/storage-runop-telemetry-foundation` off `origin/main`
- [x] **Step 2 — Create and publish working branch:** `git worktree add .worktrees/storage-runop-telemetry-foundation -b storage-runop-telemetry-foundation origin/main` then `git push -u origin storage-runop-telemetry-foundation` (done during `/opsx:propose`)

## Preflight

- [ ] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [ ] **Issue lifecycle: mark in-progress** — run `gh issue edit 501 --add-label "in-progress"`. Discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, instruct the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [ ] **`lib/storage/errors.ts`** — implement `StorageError` per design.md Decision 3: extends `Error`, constructor `(op: string, collection: string, options: { cause: unknown })`, sets `name = "StorageError"`, exposes `op` and `collection` as readonly fields, passes `cause` through to the native `Error` `cause` option.
- [ ] **`lib/telemetry/logger.ts`** — implement `logStorageEvent({ name, collection, outcome, durationMs, error? })` per design.md Decision 1/spec "logStorageEvent emits a fixed structured shape": `outcome` is `"success" | "not_found" | "error"`; console-backed for now (this is the seam #505 later swaps to OpenTelemetry); emits all fields on every call regardless of outcome.
- [ ] **`lib/storage/runOp.ts`** — implement `runStorageOp<T>({ name, collection, isEmpty? }, fn)` per design.md Decision 1: on success, classify `outcome` as `"not_found"` if `isEmpty?.(result)` is true else `"success"`, log via `logStorageEvent`, return `result` unmodified; on catch, log via `logStorageEvent` with `outcome: "error"`, then throw `new StorageError(name, collection, { cause: error })`. Capture `durationMs` around the `fn()` call for both paths.
- [ ] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch (checked: no existing error-wrapper or structured-logging seam exists in this repo — confirmed during `/opsx:explore #501`; these are genuinely new).
- [ ] Confirm none of the three new files are imported by `lib/storage.ts` or any of its 36 existing caller files — this issue is foundation-only, per proposal.md Scope
- [ ] Confirm acceptance criteria from issue #501 are covered: not-found/failure distinction, structured `logStorageEvent` fields, `StorageError` cause/op/collection

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests (`tests/unit/lib/storage/runOp.test.ts`, `tests/unit/lib/storage/errors.test.ts`, `tests/unit/lib/telemetry/logger.test.ts`) — all pass
- [ ] Run full existing unit test suite — all 11 existing `storage` mock-consuming test files and 36 caller files remain green, unmodified (proves zero blast radius per design.md Reliability NFR)
- [ ] Run E2E tests (if applicable) — not applicable; no UI/route surface touched by this change
- [ ] Run type checks
- [ ] Run build
- [ ] Run security/code quality checks required by project standards
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change adds non-`.md` source files, so apply the **full path**.

**Full path**:

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, iterate and address the failure before pushing.

## PR and Merge

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from `storage-runop-telemetry-foundation` to `main`. PR body **MUST** include `Closes #501`
- [ ] **Issue lifecycle: mark in-review** — run `gh issue edit 501 --add-label "in-review" --remove-label "in-progress"`. Move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress step; warn and skip if not found).
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — never wait for a human to report the merge; never force-merge:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent (via `/opsx:apply`)
- Reviewer(s): `dougis` (repo owner), plus automated `pr-review-toolkit:review-pr` gate
- Required approvals: passing CI + zero unresolved `review-pr` findings before auto-merge

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout, not the worktree)
- [ ] Verify the merged changes appear on `main`
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change — update `docs/storage-refactor-plan.md`'s OpenSpec change-mapping table (§6) to mark `storage-runop-telemetry-foundation` as `Applied`; update its Changelog (§8)
- [ ] Sync approved spec deltas into `openspec/specs/storage-op-telemetry-foundation/spec.md`. After copying `spec.md`, update relative links `../../design.md` → `../../changes/archive/YYYY-MM-DD-storage-runop-telemetry-foundation/design.md` and `../../tasks.md` similarly
- [ ] Archive the change: move `openspec/changes/storage-runop-telemetry-foundation/` to `openspec/changes/archive/YYYY-MM-DD-storage-runop-telemetry-foundation/`, staging both the new location and the deletion of the old location in a single commit
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-storage-runop-telemetry-foundation/` exists and `openspec/changes/storage-runop-telemetry-foundation/` is gone
- [ ] **Create a doc branch**: `git checkout -b doc/archive-YYYY-MM-DD-storage-runop-telemetry-foundation` then `git push -u origin doc/archive-YYYY-MM-DD-storage-runop-telemetry-foundation`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-storage-runop-telemetry-foundation` to `main` with title `docs: archive storage-runop-telemetry-foundation (YYYY-MM-DD)` — do NOT push directly to `main`
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D storage-runop-telemetry-foundation doc/archive-YYYY-MM-DD-storage-runop-telemetry-foundation`
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/storage-runop-telemetry-foundation` from the primary checkout
- [ ] Comment on #502, #503, and #504 that the foundation is merged and unblocked; comment on #527 the same

Required cleanup after archive: `git fetch --prune` and `git branch -D storage-runop-telemetry-foundation doc/archive-YYYY-MM-DD-storage-runop-telemetry-foundation`
