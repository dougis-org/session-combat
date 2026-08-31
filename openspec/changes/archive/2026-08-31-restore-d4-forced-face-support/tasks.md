# Tasks

Change: `restore-d4-forced-face-support` · Issue-driven: **#627** · Default
branch: `main` · Working branch: `restore-d4-forced-face-support` · Worktree:
`.worktrees/restore-d4-forced-face-support`

Ownership metadata:

- Implementer: assigned agent (via `/opsx:apply`)
- Reviewer(s): repo owner (doug) — vendored patch + CI change require a human
  reviewer
- Required approvals: 1 human approval; `pr-review-toolkit:review-pr` gate at
  zero findings; `openspec-review-code` sub-agent run before every commit

## Preparation

- [x] **Step 1 — Sync default branch:** from the primary checkout,
  `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Working branch already exists:** `restore-d4-forced-face-support`
  was created and pushed during propose (`git worktree add
  .worktrees/restore-d4-forced-face-support -b restore-d4-forced-face-support
  origin/main` + `git push -u origin restore-d4-forced-face-support`). Confirm it
  still tracks `origin/restore-d4-forced-face-support`; if the worktree is
  missing, recreate it per the Execution Step 1 fallback.

## Preflight

- [x] **Verify `pr-review-toolkit:review-pr` is available** — check the available
  skills list for `pr-review-toolkit:review-pr`. If it is not listed, halt
  immediately, tell the user the plugin is required (install via the plugin
  marketplace / `pr-review-toolkit`), and do not proceed until they confirm it
  is installed.
- [x] **Verify the spike is feasible to run** — confirm Playwright browsers are
  installed (`npx playwright install --with-deps chromium`) and headless WebGL
  works in this environment (the existing `tests/e2e/dice-roll-animation.spec.ts`
  runs).

## Execution

- [x] **Step 1 — Enter the worktree:** confirm `.worktrees/restore-d4-forced-face-support`
  exists (created during propose) and `cd` into it. If it is missing: from the
  primary checkout run `git fetch origin main` then `git worktree add
  .worktrees/restore-d4-forced-face-support -b restore-d4-forced-face-support
  origin/main`. Never checkout a different branch inside the primary checkout.
  After entering the worktree, run `git submodule update --init --force
  .github/openspec-shared` (new worktrees do not inherit the submodule checkout).
- [x] **Step 2 — Confirm branch is pushed:** `git rev-parse --abbrev-ref
  --symbolic-full-name @{u}` returns `origin/restore-d4-forced-face-support`. If
  not, `git push -u origin restore-d4-forced-face-support`.
- [x] **Issue lifecycle: mark in-progress** — run `gh issue edit 627 --add-label
  "in-progress"`. Then discover the linked GitHub Project (`gh project list
  --owner dougis-org --format json`), resolve the status field option matching
  "In Progress" (`gh project field-list <project-number> --owner dougis-org
  --format json`), and move the item via `gh project item-edit`. If no project
  item is found, log a warning and continue. If the `gh` token lacks `project`
  scope, tell the user to run `gh auth refresh -s project` and skip the
  project-item move (the label edit still proceeds).

### Task 1 — Spike: locate the d4 forcing defect and prove a fix _(throwaway; deleted before the final commit)_

- [x] Write a scratch Playwright script / `*.spike.test.ts` that loads a page
  with the engine (mirroring the archived change's E1 spike setup) and:
  - [x] Reproduces `box.roll("1d4@2")` → wrong `value`, `reason: "natural"`.
  - [x] Reproduces `box.roll("1d4@3")` with `iterationLimit: 20000` hanging (use
    a bounded outer timeout so the spike itself does not hang CI).
- [x] Read the vendored `@drdreo/dice-box-threejs@1.1.0` source
  (`node_modules/@drdreo/dice-box-threejs`): inspect `swapDiceFace`,
  `swapDiceFace_D4`, and the forced-roll path that decides whether to call the
  d4 branch. Classify the defect:
  - **small** — index math / branch condition, candidate patch < ~30 lines →
    proceed to Task 2.
  - **deep** — collider or geometry rework → **STOP.** Record the finding, update
    `proposal.md` / `design.md` via Change Control, and escalate to doug with the
    two options from `proposal.md` Risks (accept shipped state and close #627
    won't-fix-yet, or re-scope to an engine evaluation).
- [x] Produce a candidate patch diff proven to force d4 correctly in the spike
  page, and measure the forced-d4 settle-iteration count vs. a forced d6.
- [x] Append spike findings to `design.md` "Open Questions" (defect location,
  patch size, hang-shares-root-cause confirmation, iteration count, whether
  `iterationLimit` needs raising).
- [x] Delete the spike script (verified in the Pre-Commit review that no
  `*.spike*` file remains).
- **Verify:** spike notes recorded in `design.md`; go/no-go decision explicit.

### Task 2 — Vendor the patch via `patch-package`

- [x] `npm install --save-dev patch-package` and add
  `"postinstall": "patch-package"` to `package.json` scripts (merge if a
  `postinstall` already exists).
- [x] Apply the Task 1 fix directly in
  `node_modules/@drdreo/dice-box-threejs`, including a stable marker comment
  `/* d4-forced-face patch #627 */` adjacent to the fix.
- [x] `npx patch-package @drdreo/dice-box-threejs` → generates
  `patches/@drdreo+dice-box-threejs+1.1.0.patch`. Commit the patch file.
- [x] `rm -rf node_modules && npm ci` → confirm the patch re-applies cleanly and
  the postinstall step exits 0.
- **Verify:** `patches/@drdreo+dice-box-threejs+1.1.0.patch` exists; a fresh
  `npm ci` applies it with no error; the installed engine file contains the
  marker.

### Task 3 — `toDiceBoxNotation`: force d4 groups

- [x] TDD: add unit tests in `tests/unit/` asserting a d4 group in the returned
  plan has `forced: true` and `notation` matching `/^\d+d4@[\d,]+$/`, and a mixed
  `2d4+3d6` roll yields two groups each `forced: true`. Run — they fail.
- [x] Change `FORCEABLE_SIDES` in `lib/dice/toDiceBoxNotation.ts` from
  `{6,8,10,12,20}` to `{4,6,8,10,12,20}` and rewrite the doc comment to state d4
  forcing is restored via the vendored patch (reference this change).
- [x] Run — tests pass; existing `toDiceBoxNotation` tests still green.
- **Verify:** `npm run test:unit -- toDiceBoxNotation` green.

### Task 4 — `reconcileDiceFaces` + `useDiceAnimation`: remove every `sides === 4` carve-out

- [x] TDD: add unit tests asserting `reconcileDiceFaces` returns `true` for a
  matching d4 group and `false` for a mismatched one (same as other sizes). Run
  — confirm current behavior already treats d4 uniformly (tests should pass
  after the doc change; if any code branch special-cases d4, they fail first).
- [x] Edit `lib/dice/reconcileDiceFaces.ts`: delete the doc paragraph stating d4
  groups "are expected to mismatch"; note d4 is now forced like every size.
- [x] Inspect `lib/dice/useDiceAnimation.ts`: confirm the d4 group flows through
  the same per-group `roll()` / `add()` path as other sizes; **expected: no code
  change.** If Task 1 showed a forced d4 needs a larger `iterationLimit`, raise
  the shared constant (documented comment citing the spike) — never add a
  d4-specific branch.
- [x] `grep -rn "=== 4\|sides === 4\|d4" lib/dice/` → no die-size special-casing
  remains (comments referencing d4 as an example are fine).
- **Verify:** `npm run test:unit -- reconcileDiceFaces useDiceAnimation` green;
  grep clean.

### Task 5 — CI: run the patch before tests + marker guard test

- [x] Add a unit test (`tests/unit/dice/d4-engine-patch.test.ts` or similar) that
  reads the installed engine file and asserts it contains
  `/* d4-forced-face patch #627 */`; fails loudly with a message pointing at
  `npm ci` / `patch-package` if absent.
- [x] CI already satisfies "patch before tests": every job in `build-test.yml`
  runs plain `npm ci` (→ `postinstall` → `patch-package`, which fails the install
  loudly) before unit / integration / regression, and no workflow uses
  `--ignore-scripts` (asserted by `d4EnginePatch.test.ts`). No workflow edit
  needed — an earlier explicit grep step was dropped so this change does not
  touch `build-test.yml` (avoids attributing a pre-existing unpinned-action
  finding to this PR).
- **Verify:** the marker test passes locally; CI config review confirms ordering.

### Task 6 — E2E: d4 pool settles on its predetermined faces

- [x] Add a case to `tests/e2e/dice-roll-animation.spec.ts` that rolls a `3d4`
  pool, waits for the tumble, and asserts the per-die `[a, b, c]` breakdown line
  equals the predetermined faces and that the tumble (not the instant) path ran
  — mirroring the existing d6/d20 assertions. No pixel/screenshot assertions.
- [x] Add (or extend) a case covering a mixed `2d4+3d6` pool settling correctly.
- **Verify:** `npm run test:e2e -- dice-roll-animation` green locally (use a free
  port for the test server, not 3000 — other threads occupy it).

### Task 7 — Verify safe degradation when the patch is absent

- [x] Add a unit test (or extend Task 4's) proving that when the engine reports a
  d4 face mismatch, `reconcileDiceFaces` returns `false` and the overlay logic
  routes to the instant reveal with the correct total — i.e. a missing patch is
  cosmetic only, never a hang or a wrong total.
- **Verify:** test green; matches spec scenario "Missing patch degrades to the
  instant reveal, never a hang".

### Task 8 — Upstream PR to `drdreo/dice-box-threejs` _(parallel; not a merge gate)_

- [x] Forked `drdreo/dice-box-threejs`, applied the source-form one-line fix on
  branch `dougis:fix/d4-forced-face` (`swapDiceFace_D4` clears `dicemesh.result`
  after the geometry swap; the repo has no test suite so verification is the
  manual snippet in the PR body).
- [x] Opened the PR: **`Upstream PR: https://github.com/drdreo/dice-box-threejs/pull/2`**
- [x] Linked from a comment on issue #627.
- **Verify:** PR URL recorded here and on #627; upstream merge is **not** required.
  Follow-up: when it merges and a release ships, bump `@drdreo/dice-box-threejs`
  and drop `patches/@drdreo+dice-box-threejs+1.1.0.patch` + the `postinstall` hook.

### Task 9 — Confirm acceptance criteria

- [x] Walk every scenario in
  `openspec/changes/restore-d4-forced-face-support/specs/global-dice-fab/spec.md`
  and confirm a test or explicit verification covers it.
- [x] Look for existing tooling/helpers reused rather than re-implemented
  (dice test factories, the existing e2e breakdown-line helper).

## Pre-Commit Code Review

- [x] `openspec-review-code` run pre-commit (initial commit `1b0359c`): dropped a
  brittle whitespace-exact marker assertion and a redundant expect/throw pair in
  `d4EnginePatch.test.ts`.
- [x] `pr-review-toolkit:review-pr` (code-reviewer + pr-test-analyzer +
  silent-failure-hunter) on PR #635. Findings addressed:
  - **CRITICAL** — the Docker build ran `npm ci` before `COPY . .`, so
    `patch-package` found no `patches/` dir, exited 0, and the deployed image
    shipped the *unpatched* engine (the exact #627 regression, prod-only). Fixed:
    `Dockerfile` now `COPY patches ./patches` before `npm ci`; a unit test asserts
    that ordering.
  - E2E d4 cases now also assert the reconciliation-mismatch `console.warn` never
    fires — a real #627 regression signal, not just DOM-readout parity.
  - `patch-package` moved to `dependencies` (postinstall runs unconditionally;
    protects a future `npm ci --omit=dev` builder). Unit test enforces it.
  - `d4EnginePatch.test.ts` workflow scan scoped to `npm ci/install` lines + guarded
    with `existsSync`; added a `lib/dice` static guard against `=== 4` special-casing.
  - silent-failure-hunter: clean (no hang / wrong total / session latch).
- [x] Confirm the throwaway spike file(s) from Task 1 are deleted before the
  final commit.

## Validation

- [x] `npm run test:unit` — 3176 pass
- [x] `npm run test:integration` — 328 pass / 4 skip
- [x] `npm run test:e2e` dice suite — 4/4 pass (vs `next start`; port from getDirectoryBasePort)
- [x] `npm run typecheck`
- [x] `npm run lint` — clean (2 pre-existing warnings elsewhere)
- [x] `npm run build`
- [x] Security / code-quality checks required by project standards (Verity
  pre-commit/pre-push gate, Codacy). Fix findings — do **not** `verity waive`
  unless relaying a risk a human explicitly accepted in writing.
- [x] `rm -rf node_modules && npm ci` → patch applies cleanly, marker test
  green (proves a clean-clone install works).
- [x] All completed tasks marked complete
- [x] All steps in [Remote push validation]

## Remote push validation

Determine whether the change is **docs-only**: `git diff --name-only main...HEAD`
— if every changed file ends in `.md`, use the docs-only path; otherwise the full
path. This change touches `lib/`, `patches/`, `package.json`, CI, and tests, so
the **full path** applies:

- **Unit tests** — `npm run test:unit`; all pass
- **Integration tests** — `npm run test:integration`; all pass
- **Regression / E2E tests** — `npm run test:e2e`; all pass
- **Build** — `npm run build`; succeeds with no errors

If ANY step fails, iterate and fix before pushing.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings
  addressed before the final commit
- [x] Commit all changes to `restore-d4-forced-face-support` and push
- [x] Open PR from `restore-d4-forced-face-support` to `main`. **PR body MUST
  include `Closes #627`.** Check for `.github/PULL_REQUEST_TEMPLATE` and follow it.
- [x] **Issue lifecycle: mark in-review** — `gh issue edit 627 --add-label
  "in-review" --remove-label "in-progress"`; move the project item to the "In
  Review" column (same discovery pattern as in-progress; warn and skip if not
  found).
- [x] Wait 60 seconds for CI to start
- [x] Spawn a sub-agent to run `pr-review-toolkit:review-pr`; address all
  findings (commit → [Remote push validation] → push → re-run) until zero
  findings remain. If findings persist after 3+ iterations with no progress,
  report the stall with remaining findings and wait for human guidance.
- [x] **Enable auto-merge only after the review gate passes:** `gh pr merge
  <PR-URL> --auto --merge` (NEVER `--admin`; never push directly to `main`)
- [x] **Iterate until merged** — repeat until `gh pr view <PR-URL> --json state`
  is `MERGED` (if `CLOSED`, exit and notify the user):
  1. **Build and tests** — run [Remote push validation]; fix failures, commit,
    push before anything else
  2. **PR comments** — poll `gh pr view <PR-URL> --json reviewThreads`; address
    every unresolved thread, commit, validate, push, wait 180s; repeat until all
    resolved
  3. **CI check failures** — only after comments resolved, poll `gh pr checks
    <PR-URL>`; fix failing required checks, commit, validate, push, wait 180s;
    restart from step 1
- [x] Address every PR review comment before merge (project rule: resolve all PR
  comments).

Blocking resolution flow:

- CI failure → diagnose → fix → commit → [Remote push validation] → push →
  re-run checks. If the `postinstall` patch step fails, the `.patch` no longer
  applies to `1.1.0` — re-base the patch file, never disable the step.
- Security finding → remediate → commit → validate → push → re-scan. A flagged
  `patch-package` advisory or suspicious patch hunk must be resolved or explained
  in the PR before merge; never waived on agent judgment.
- Review comment → address → commit → validate → push → confirm thread resolved.
- Escalation: if the spike is not conclusively "small" within its time box, or CI
  is red > 1 working day with no clear fix, convert the PR to draft and escalate
  to doug.

## Post-Merge

- [x] From the primary checkout: `git checkout main` and `git pull --ff-only`
- [x] Verify the merged changes appear on `main`
- [x] Mark all remaining tasks complete (`- [x]`)
- [x] Update repository documentation impacted by the change (e.g. a
  `patches/README` or CONTRIBUTING note on the `patch-package` workflow;
  `.wolf/anatomy.md` + `.wolf/cerebrum.md` per project protocol)
- [x] Sync approved spec deltas into `openspec/specs/global-dice-fab/spec.md`.
  After copying, update relative links that pointed into the change directory so
  they resolve from the archive location — `../../design.md` →
  `../../changes/archive/2026-MM-DD-restore-d4-forced-face-support/design.md`,
  same for `../../tasks.md`.
- [x] Archive: move `openspec/changes/restore-d4-forced-face-support/` to
  `openspec/changes/archive/2026-MM-DD-restore-d4-forced-face-support/` and stage
  both the new location and the deletion of the old in a **single** commit.
- [x] Confirm `openspec/changes/archive/2026-MM-DD-restore-d4-forced-face-support/`
  exists and `openspec/changes/restore-d4-forced-face-support/` is gone
- [x] **Create a doc branch:** `git checkout -b
  doc/archive-2026-MM-DD-restore-d4-forced-face-support` then `git push -u origin
  doc/archive-2026-MM-DD-restore-d4-forced-face-support`
- [x] Open a PR from that doc branch to `main`, title `docs: archive
  restore-d4-forced-face-support (2026-MM-DD)` — **do NOT push directly to
  `main`**
- [x] **IMMEDIATELY** enable auto-merge on the doc PR: `gh pr merge <DOC-PR-URL>
  --auto --merge` (NEVER `--admin`)
- [x] Monitor the doc PR until merged (same loop as the implementation PR)
- [x] Issue lifecycle: confirm #627 auto-closed via `Closes #627`; move the
  project item to "Done" if not automatic; remove `in-review` label if it lingers
- [x] Record the upstream PR URL on issue #627 for future follow-up (version bump
  + patch removal when it merges)
- [x] Remove the worktree: `git worktree remove
  .worktrees/restore-d4-forced-face-support` (use `--force` if the
  openspec-shared submodule blocks removal)
- [x] Prune merged local branches: `git fetch --prune` and `git branch -D
  restore-d4-forced-face-support
  doc/archive-2026-MM-DD-restore-d4-forced-face-support`

### Completion checklist

- [x] Docs updated (patch-package workflow note; `.wolf/` protocol files)
- [x] Approved spec deltas synced to `openspec/specs/global-dice-fab/spec.md`
- [x] Change archived as a single atomic commit
- [x] Upstream PR opened and its URL recorded in this file + on #627
- [x] Dedicated worktree removed and merged local branches pruned
