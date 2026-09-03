# Tasks

## Preparation

- [ ] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] Task 1: Initialize standard development workflows (pr-review-toolkit:review-pr check, issue assignment, code review sub-agent hook, etc)
- [x] Task 2: **Issue lifecycle: assign to yourself**: run `gh issue edit #665 --add-assignee "@me"`
- [x] Task 3: **Verify `pr-review-toolkit:review-pr` is available** — check the available skills list for `pr-review-toolkit:review-pr`. If the skill is not listed, halt immediately, inform the user that the plugin is required, provide installation guidance, and do not proceed until the user confirms it is installed.
- [x] Task 4: **Issue lifecycle: mark in-progress**: run `gh issue edit #665 --add-label "in-progress"`. Then discover the GitHub Project linked to the repo (`gh project list --owner dougis-org --format json`), resolve the status field option semantically matching "In Progress" (`gh project field-list <project-number> --owner dougis-org --format json`), and move the project item via `gh project item-edit`. If no project item is found, log a warning and continue.
- [x] Task 5: Update `lib/preferences/schema.ts` to include `surface: string | null;` in `dice` preferences. Update `DEFAULT_PREFERENCES` to include `surface: null`. Update validators.
- [x] Task 6: Update `lib/components/UserMenu.tsx` to include `<DropdownMenu.Item asChild><Link href="/profile">Profile & Settings</Link></DropdownMenu.Item>` above Logout.
- [x] Task 7: Create `app/profile/page.tsx` containing `<ProtectedRoute>` and a simple form for mapping the existing dice and chat preferences. Use `usePreferences` context to read/write.
- [x] Task 8: Look for existing tooling or functions in the codebase that can be reused or extended before writing new logic from scratch.
- [x] Task 9: Confirm acceptance criteria are covered

## Pre-Commit Code Review

- [x] Task 10: **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run tests to confirm they pass, then proceed to commit.

## Validation

- [x] Task 11: Run unit/integration tests (`npm run test`)
- [x] Task 12: Run E2E tests (if applicable)
- [x] Task 13: Run type checks (`npx tsc --noEmit`)
- [x] Task 14: Run build (`npm run build`)
- [x] Task 15: Run security/code quality checks required by project standards (`npm run lint`)
- [x] Task 16: All completed tasks marked as complete
- [x] Task 17: All steps in [Remote push validation]
- [x] Task 18: All reviewer findings applied

## Remote push validation

- [x] Task 19: Commit all changes to the working branch and push to remote
- [x] Task 20: Open PR from working branch to main. If this change is issue-driven, the PR body MUST include `Closes #<issue-number>` for each linked issue (unconditionally, not as an optional conditional).
- [x] Task 21: **Once the PR is open**, spawn a sub-agent to run the `pr-reviewer-toolkit` skill on the current worktree (passing the PR URL or branch name). The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, commit, and push.

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
- [x] Open PR from working branch to `main`. **If this change is issue-driven, the PR body MUST include `Closes #665` for each linked issue** (unconditionally, not as an optional conditional). — PR #674, body `Closes #665`
- [x] **Issue lifecycle: mark in-review**: run `gh issue edit #665 --add-label "in-review" --remove-label "in-progress"`. — done; no project item found for #665, continued.
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all findings (commit, push, re-run) until zero findings remain. If findings persist after three or more iterations with no progress, report the stall with remaining findings listed and wait for human guidance before continuing. — CI regression-tests + ci-gate were red: `auth.spec.ts` "account menu opens and logs out via keyboard" assumed Logout was the first menu item; now that "Profile & Settings" precedes it, the test steps down one item before activating. Fixed + verified locally (full auth.spec 35/35, mePreferences integration 15/15, build OK).
- [ ] **Enable auto-merge only after the review gate passes (zero findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin` to force the merge). NOTE: `main` is a squash-only ruleset — use `--squash`, not `--merge`.
- [ ] **Iterate until merged** — repeat the following priority loop continuously until `gh pr view <PR-URL> --json state` returns `MERGED`; if it returns `CLOSED` exit and notify the user — **never wait for a human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix any failures, commit, and push before doing anything else in this iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; for every unresolved thread, address the feedback, commit fixes, run [Remote push validation], push, wait 180 seconds; continue until all threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, run [Remote push validation], push, wait 180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate before pushing any fix.

Ownership metadata:

- Implementer: Antigravity Agent
- Reviewer(s): Doug Hubbard
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
- [ ] Sync approved spec deltas into `openspec/specs/` (global spec). After copying each `spec.md` to `openspec/specs/<cap>/spec.md`, update all relative links that pointed into the change directory so they resolve from the archive location — replace `../../design.md` with `../../changes/archive/YYYY-MM-DD-profile-settings/design.md`, and similarly for `../../tasks.md` and any other relative paths into the change directory.
- [ ] Archive the change: move `openspec/changes/profile-settings/` to `openspec/changes/archive/YYYY-MM-DD-profile-settings/` **and stage both the new location and the deletion of the old location in a single commit** — do not commit the copy and delete separately
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-profile-settings/` exists and `openspec/changes/profile-settings/` is gone
- [ ] **Create a doc branch** for the archive and spec updates: `git checkout -b doc/archive-YYYY-MM-DD-profile-settings` then `git push -u origin doc/archive-YYYY-MM-DD-profile-settings`
- [ ] Open a PR from `doc/archive-YYYY-MM-DD-profile-settings` to `main` with title `docs: archive profile-settings (YYYY-MM-DD)` — **do NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation PR — address comments and CI failures, push to the same doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` and `git branch -D <feature-branch> doc/archive-YYYY-MM-DD-profile-settings`

Required cleanup after archive: `git fetch --prune` and `git branch -D <feature-branch> doc/archive-YYYY-MM-DD-profile-settings`

## Follow-ups (separate changes — not blockers for this PR)

Captured during explore review of PR #674 / this branch:

- [ ] FU-1: Tighten `KEY_VALIDATORS["dice.surface"]` in `lib/preferences/schema.ts` from
  `string | null` to an enum (`SURFACE_VALUES = ['wood','metal','stone','felt']`), exported
  and imported by `app/profile/page.tsx` so the `<select>` options and the validator share
  one source. Add unit tests: `validatePreferencePatch` rejects an unknown surface;
  `resolvePreferences` repairs a stored unknown surface to `null`. (design.md Decision 3)
- [ ] FU-2: Consume `preferences.dice.color` and `preferences.dice.surface` in the
  dice-rendering path (apply at DiceBox construction, alongside the existing dice-appearance
  work). Currently both values are persisted but unused. (design.md Decision 4)
- [x] FU-3: Inline validation on the "Dice Color" field — `app/profile/page.tsx` now holds a
  local draft, only pushes a valid short hex (or empty → `null`) to `setPreference`, and
  shows `aria-invalid` + a `role="alert"` helper while the entry is malformed instead of
  silently dropping it. Covered by `page.test.tsx` "does not persist an invalid entry…" and
  "persists once a previously-invalid entry becomes valid". (design.md Risks)
- [x] FU-4: Close the `ProfilePage` test-coverage gap — `page.test.tsx` now covers all five
  controls (21 cases): `dice.disableAnimation` / `dice.surface` selects (both directions),
  `dice.color` input (enter / clear / render), `dice.sendToChat` + `chat.pinned` checkboxes,
  and stored-value rendering. Added `htmlFor`/`id` to the three selects + the colour input so
  controls resolve by accessible name (also fixes the orphan "Dice Color (Hex)" `<label>`).
  Added `PATCH /api/me/preferences` `dice.surface` persist / clear / reject integration tests.
  Deferred: the optional navigate-to-`/profile` E2E and the `dice.color` invalid-state
  assertions (bundled with FU-3). Full status in `tests.md`.
