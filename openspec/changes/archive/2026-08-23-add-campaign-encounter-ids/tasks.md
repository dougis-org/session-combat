# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** done during proposal scaffolding —
  fetched `origin/main` and branched from it.
- [x] **Step 2 — Create and publish working branch:** `add-campaign-encounter-ids`
  created from `origin/main` and pushed (`git push -u origin add-campaign-encounter-ids`).

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
  skills list for `pr-review-toolkit:review-pr`. If the skill is not listed,
  halt immediately, inform the user that the plugin is required, provide
  installation guidance, and do not proceed until the user confirms it is
  installed.

## Execution

- [x] **Issue lifecycle: mark in-progress** — run
  `gh issue edit 535 --repo dougis-org/session-combat --add-label "in-progress"`.
  Then discover the GitHub Project linked to `dougis-org/session-combat`
  (`gh project list --owner dougis-org --format json`), resolve the status
  field option semantically matching "In Progress"
  (`gh project field-list <project-number> --owner dougis-org --format json`),
  and move the project item via `gh project item-edit`. If no project item
  is found, log a warning and continue. If the `gh` token lacks the
  `project` scope, surface a message instructing the user to run
  `gh auth refresh -s project` and skip the project-item update (issue
  label update still proceeds).
- [x] **Write failing unit tests first (TDD)** for `normalizeCampaign()` in
  `lib/storage.test.ts` (or the matching existing test file), covering the
  three scenarios from `specs/campaign-model/spec.md`:
  - legacy doc with no `encounterIds` key → `[]`
  - doc with a valid `encounterIds: string[]` → preserved unchanged
  - doc with a malformed non-array `encounterIds` (e.g. `null`) → `[]`
- [x] **Add `encounterIds?: string[]` to `Campaign`** in `lib/types.ts`
  (`lib/types.ts:603`), next to the other optional fields
  (`currentChapterId?`, `templateId?`).
- [x] **Add the normalization line** to `normalizeCampaign()` in
  `lib/storage.ts` (`lib/storage.ts:56`), directly beside the existing
  `chapters` line, following the identical `Array.isArray(...)` guard
  style:
  `encounterIds: Array.isArray(campaign.encounterIds) ? campaign.encounterIds : []`
- [x] Confirm the new unit tests pass and no existing `normalizeCampaign()`
  / storage test regresses.
- [x] Confirm acceptance criteria in `proposal.md` and
  `specs/campaign-model/spec.md` are covered by the tests above.

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the
  `openspec-review-code` skill. The primary agent must automatically apply
  all clearly-correct findings directly to the code — without stopping,
  without presenting the findings list to the user, and without asking
  for confirmation. Apply fixes, re-run tests to confirm they pass, then
  proceed to commit.

## Validation

- [x] Run unit/integration tests
- [x] Run E2E tests (if applicable — not expected to be affected by this
  change, but run the existing suite to confirm no regression)
- [x] Run type checks (`tsc --noEmit` or project equivalent)
- [x] Run build
- [x] Run security/code quality checks required by project standards
  (Codacy, as configured for this repo)
- [x] All completed tasks marked as complete
- [x] All steps in [Remote push validation]

## Remote push validation

Before running, determine whether the current change is **docs-only**:
run `git diff --name-only HEAD` (or compare the working branch against
`main`) and check whether every changed file ends in `.md`. This change
touches `lib/types.ts` and `lib/storage.ts` (and their test file), so the
**full path** applies.

**Full path:**

- **Unit tests** — run the project's unit test suite; all tests must pass
- **Integration tests** — run the project's integration test suite; all
  tests must pass
- **Regression / E2E tests** — run the project's end-to-end or regression
  test suite; all tests must pass
- **Build** — run the project's build script; build must succeed with no
  errors

If **ANY** required step fails, you **MUST** iterate and address the
failure before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all
  findings were automatically addressed before the final commit
- [x] Commit all changes to the working branch and push to remote
- [x] Open PR from `add-campaign-encounter-ids` to `main`. The PR body
  MUST include `Closes #535`.
- [x] **Issue lifecycle: mark in-review** — run
  `gh issue edit 535 --repo dougis-org/session-combat --add-label "in-review" --remove-label "in-progress"`.
  Then move the project item to the status column semantically matching
  "In Review" via `gh project item-edit` (same project/field/option
  discovery as the in-progress lifecycle step above; warn and skip if not
  found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit, push, re-run) until zero findings remain. If findings
  persist after three or more iterations with no progress, report the
  stall with remaining findings listed and wait for human guidance before
  continuing.
- [x] **Enable auto-merge only after the review gate passes (zero
  findings):** `gh pr merge <PR-URL> --auto --merge` (NEVER use `--admin`
  to force the merge)
- [x] **Iterate until merged** — repeat the following priority loop
  continuously until `gh pr view <PR-URL> --json state` returns `MERGED`;
  if it returns `CLOSED` exit and notify the user — **never wait for a
  human to report the merge; never force-merge**:
  1. **Build and tests** — run all steps in [Remote push validation]; fix
     any failures, commit, and push before doing anything else in this
     iteration
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`;
     for every unresolved thread, address the feedback, commit fixes, run
     [Remote push validation], push, wait 180 seconds; continue until all
     threads are resolved
  3. **CI check failures** — only after all comments are resolved, poll
     `gh pr checks <PR-URL> --json isRequired,state`; fix any failing
     required checks, commit, run [Remote push validation], push, wait
     180 seconds; then restart this loop from step 1

After every push, restart at step 1. Never skip the build/test gate
before pushing any fix.

Ownership metadata:

- Implementer: (assignee on issue #535, currently dougis)
- Reviewer(s): TBD at PR open (repo default reviewers / CODEOWNERS)
- Required approvals: per branch protection on `main`

Blocking resolution flow:

- CI failure → fix → commit → validate locally → push → re-run checks
- Security finding → remediate → commit → validate locally → push → re-scan
- Review comment → address → commit → validate locally → push → confirm
  resolved

## Post-Merge

- [x] `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks as complete (`- [x]`)
- [ ] Update repository documentation impacted by the change (none
  expected — `lib/types.ts`/`lib/storage.ts` changes are self-documenting
  and no README/architecture doc references `Campaign`'s field list
  exhaustively)
- [ ] Sync approved spec deltas into `openspec/specs/campaign-model/spec.md`
  (global spec). After copying `specs/campaign-model/spec.md` there,
  update all relative links that pointed into the change directory so
  they resolve from the archive location — replace `../../design.md`
  with `../../changes/archive/YYYY-MM-DD-add-campaign-encounter-ids/design.md`,
  and similarly for `../../tasks.md` and any other relative paths into
  the change directory.
- [ ] Archive the change: move
  `openspec/changes/add-campaign-encounter-ids/` to
  `openspec/changes/archive/YYYY-MM-DD-add-campaign-encounter-ids/` **and
  stage both the new location and the deletion of the old location in a
  single commit** — do not commit the copy and delete separately
- [ ] Confirm
  `openspec/changes/archive/YYYY-MM-DD-add-campaign-encounter-ids/`
  exists and `openspec/changes/add-campaign-encounter-ids/` is gone
- [ ] **Create a doc branch** for the archive and spec updates:
  `git checkout -b doc/archive-YYYY-MM-DD-add-campaign-encounter-ids` then
  `git push -u origin doc/archive-YYYY-MM-DD-add-campaign-encounter-ids`
- [ ] Open a PR from
  `doc/archive-YYYY-MM-DD-add-campaign-encounter-ids` to `main` with
  title `docs: archive add-campaign-encounter-ids (YYYY-MM-DD)` — **do
  NOT push directly to `main`**
- [ ] **IMMEDIATELY** enable auto-merge on the doc PR:
  `gh pr merge <DOC-PR-URL> --auto --merge` (NEVER use `--admin` to force
  the merge)
- [ ] Monitor the doc PR until it merges (same loop as the implementation
  PR — address comments and CI failures, push to the same doc branch,
  repeat)
- [ ] Prune merged local branches: `git fetch --prune` and
  `git branch -D add-campaign-encounter-ids doc/archive-YYYY-MM-DD-add-campaign-encounter-ids`

Required cleanup after archive: `git fetch --prune` and
`git branch -D add-campaign-encounter-ids doc/archive-YYYY-MM-DD-add-campaign-encounter-ids`
