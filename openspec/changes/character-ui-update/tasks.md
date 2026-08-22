# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b character-ui-update-impl` then immediately `git push -u origin character-ui-update-impl`

## Preflight

- [x] **Verify `pr-reviewer` is available** — check the available skills list for `pr-reviewer`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.

## Execution

- [x] Extract `CharacterEditor` component
  - Create `lib/components/CharacterEditor.tsx`
  - Move the `CharacterEditor` component function and its local state/hooks from `app/characters/page.tsx` to the new file.
  - Export `CharacterEditor` and ensure all required imports (`Character`, `VALID_CLASSES`, etc.) are present.
- [x] Create `CharacterCard` component
  - Create `lib/components/CharacterCard.tsx`
  - Import `CharacterMiniSummary` or create the summary layout directly.
  - Add `isExpanded` state (`useState`).
  - Render the summary view when collapsed, and `<CreatureStatBlock isCompact={false} />` when expanded.
  - Include "Expand/Collapse" toggle button.
  - Include "View Character", "Edit", and "Delete" action buttons.
- [x] Update `app/characters/page.tsx`
  - Import the new `CharacterCard` and `CharacterEditor` components.
  - Remove the inline `CharacterEditor` definition.
  - Update the rendering loop to use `CharacterCard`.
- [x] Create Dedicated Detail View
  - Create `app/characters/[id]/page.tsx`
  - Fetch character data using the existing API (`/api/characters/[id]`).
  - Render the full `CreatureStatBlock` for the character.
  - Include an "Edit" button that shows the `CharacterEditor` when clicked.
  - Add a "Back to Characters" link.
- [x] Confirm acceptance criteria are covered (check toggle behavior, edit flow in both places, detail route fetching).

## Pre-Commit Code Review

- [ ] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [ ] Run unit/integration tests (`npm run test` or equivalent)
- [ ] Run E2E tests (if applicable)
- [ ] Run type checks (`npm run typecheck` or `npx tsc --noEmit`)
- [ ] Run build (`npm run build`)
- [ ] Run security/code quality checks required by project standards (`npm run lint`)
- [ ] All completed tasks marked as complete
- [ ] All steps in [Remote push validation]

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

- [ ] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [ ] Commit all changes to the working branch and push to remote
- [ ] Open PR from working branch to `main`.
- [ ] Wait 60 seconds for CI to start
- [ ] Spawn a sub-agent to run `pr-reviewer`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing.
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: current user
- Reviewer(s): n/a
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm resolved

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify the merged changes appear on the default branch
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-character-ui-update/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [ ] Archive the change: move `openspec/changes/character-ui-update/` to `openspec/changes/archive/YYYY-MM-DD-character-ui-update/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-character-ui-update/` exists and `openspec/changes/character-ui-update/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-character-ui-update` then `git push -u origin doc/archive-YYYY-MM-DD-character-ui-update`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-character-ui-update` to `main` with title `docs: archive character-ui-update (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D character-ui-update-impl doc/archive-YYYY-MM-DD-character-ui-update`

Required cleanup after archive: `git fetch --prune` and `git branch -D character-ui-update-impl doc/archive-YYYY-MM-DD-character-ui-update`
