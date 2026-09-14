# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only` (performed from the primary checkout before creating the worktree)
- [x] **Step 2 — Create and publish working branch:** dedicated worktree created at `.worktrees/hide-session-edit-controls-for-non-dm` with branch `hide-session-edit-controls-for-non-dm`, pushed via `git push -u origin hide-session-edit-controls-for-non-dm`

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] **Issue lifecycle: mark in-progress**: run `gh issue edit 719 --add-label "in-progress"`. Then discover the GitHub Project linked to `dougis-org/session-combat` (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue. If the `gh` token lacks the `project` scope, surface a message instructing the user to run `gh auth refresh -s project` and skip the project-item update (issue label update still proceeds).
- [x] **Task 1 — Add `isDM` prop to `SessionEntryCard`** (`app/campaigns/[id]/sessions/page.tsx`): extend the inline props type with `isDM: boolean`; conditionally render the action-button `<div>` (currently containing "Edit" and "Delete") only when `isDM` is `true`. Leave the expand/collapse button and rendering untouched.
- [x] **Task 2 — Wire `useIsDM` into `SessionsContent`** (`app/campaigns/[id]/sessions/page.tsx`): import `useIsDM` from `@/lib/hooks/useIsDM`; call `const { isDM } = useIsDM(campaignId);`; pass `isDM` to every `<SessionEntryCard>` instance in the `logs.map(...)` render.
- [x] **Task 3 — Gate the "+ New Session" button**: wrap the existing `{!showForm && !editingLog && (...)}` button block's render condition with `isDM` (button only renders when `isDM && !showForm && !editingLog`).
- [x] **Task 4 — Guard the inline `SessionForm` render** (defense in depth): the "+ New Session" button and per-card "Edit" are already the only entry points into `showForm`/`editingLog` state, and both are now gated by `isDM` from Tasks 1–3; confirm no other code path (e.g. deep link, keyboard shortcut) can set `showForm`/`editingLog` to `true` for a non-DM viewer. No new gating code expected here — this is a verification task, not an implementation task.
- [x] **Task 5 — Unit tests for `SessionEntryCard`**: add/extend `tests/unit/...` (or existing page test file, per current project convention for this file) covering: `isDM={true}` renders "Edit" and "Delete"; `isDM={false}` renders neither; expand/collapse still works with `isDM={false}`.
- [x] **Task 6 — Unit tests for `SessionsContent`**: mock `useIsDM` to `{ isDM: true, loading: false }` → assert "+ New Session" renders; mock to `{ isDM: false, loading: false }` → assert it does not; mock to `{ isDM: false, loading: true }` → assert it does not (fail-closed while loading).
- [x] Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch — confirmed: `useIsDM` (`lib/hooks/useIsDM.ts`) is the existing hook to reuse, already proven via `lib/components/SessionControl.tsx`'s identical usage pattern; no new hook or permission utility should be introduced.
- [x] Confirm acceptance criteria are covered — cross-check against `specs/session-log/spec.md` scenarios: "DM sees full create/edit/delete controls", "Non-DM member sees no write controls", "Non-DM member can still read session details", "Write controls stay hidden while DM status is still resolving".

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Run unit/integration tests: `npm run test:unit` (per project convention — this repo has no `test` script)
- [x] Run E2E tests (if applicable) — not expected to be required for this change (no route/flow structurally changes, only control visibility), but run the project's E2E suite if session-journal E2E coverage exists and touches Edit/Delete/New Session controls
- [x] Run type checks
- [x] Run build
- [x] Run security/code quality checks required by project standards
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**: run `git diff --name-only HEAD` (or compare the working branch against the base branch) and check whether every changed file ends in `.md`. This change touches `app/campaigns/[id]/sessions/page.tsx` and its test file, so it is **not** docs-only — use the full path.

**Full path**:

- **Unit tests** — `npm run test:unit`; all tests must pass
- **Integration tests** — run the project's integration test suite; all tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no errors

If **ANY** required step fails, you **MUST** iterate and address the failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `hide-session-edit-controls-for-non-dm` to `main`. PR body **MUST** include `Closes #719`.
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit 719 --add-label "in-review" --remove-label "in-progress"`. Then move the project item to the status column semantically matching "In Review" via `gh project item-edit` (same project/field/option discovery as the in-progress lifecycle step above; warn and skip if not found).
- [x] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge; use `--squash` per this repo's ruleset — plain `--merge` will be BLOCKED)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved (reply, then resolve via the `resolveReviewThread` GraphQL mutation)
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: agent executing `/opsx:apply` for this change
- Reviewer(s): `pr-review-toolkit:review-pr` sub-agent (automated); dougis (human, as needed)
- Required approvals: PR merge gate per repo branch protection (squash merge only)

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only` (from the primary checkout)
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none expected — no user-facing docs describe player session-editing behavior; confirm during execution)
- [ ] Sync approved spec deltas into `openspec/specs/`: copy `specs/session-log/spec.md`'s MODIFIED requirement into `openspec/specs/session-log/session-log.md` (note: this capability's global spec file is legacy-named `session-log.md`, not `spec.md` — merge the delta's "Session journal UI" scenarios into that existing requirement in place rather than creating a new `spec.md` file, to avoid diverging from the established file for this capability). Update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-hide-session-edit-controls-for-non-dm/design.md`, and similarly for `../../tasks.md`.
- [ ] Archive the change: move `openspec/changes/hide-session-edit-controls-for-non-dm/` to `openspec/changes/archive/YYYY-MM-DD-hide-session-edit-controls-for-non-dm/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-hide-session-edit-controls-for-non-dm/` exists and `openspec/changes/hide-session-edit-controls-for-non-dm/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-hide-session-edit-controls-for-non-dm` then `git push -u origin doc/archive-YYYY-MM-DD-hide-session-edit-controls-for-non-dm`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-hide-session-edit-controls-for-non-dm` to `main` with title `docs: archive hide-session-edit-controls-for-non-dm (YYYY-MM-DD)` — **do NOT push directly to `main`**. This PR must be docs-only (per project convention: code fixes belong on a separate hotfix branch, never mixed into a doc archive branch).
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge; use `--squash`)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Remove the change's dedicated worktree: `git worktree remove .worktrees/hide-session-edit-controls-for-non-dm`
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D hide-session-edit-controls-for-non-dm doc/archive-YYYY-MM-DD-hide-session-edit-controls-for-non-dm`

Required cleanup after archive: `git fetch --prune` and `git branch -D hide-session-edit-controls-for-non-dm doc/archive-YYYY-MM-DD-hide-session-edit-controls-for-non-dm`
