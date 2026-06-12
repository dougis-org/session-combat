# Tasks

## Preparation

- [x] **Step 1 — Sync default branch:** `git checkout main` and `git pull --ff-only`
- [x] **Step 2 — Create and publish working branch:** `git checkout -b feat/issue-405-doc-only-ci-skip` then immediately `git push -u origin feat/issue-405-doc-only-ci-skip`

## Execution

### 1. Add `check-changes` job

- [x] Add `check-changes` job to `.github/workflows/build-test.yml` as the first job
- [x] Use `dorny/paths-filter@v3` (pinned to a specific commit SHA) with a `docs` filter matching `**/*.md`
- [x] Output `docs_only: true` when only markdown files changed, `false` otherwise
- [x] Add `permissions: contents: read` to the job
- Verification: `act pull_request` locally (or push a test branch) with a markdown-only change and confirm `docs_only=true`

### 2. Extract standalone `build` job

- [x] Add a new `build` job to `.github/workflows/build-test.yml` with `needs: [lint]`
- [x] Move `npm run build` (with `MONGODB_URI` and `MONGODB_DB` env vars) into this job
- [x] Remove the build steps from `integration-tests` and `regression-tests`
- [x] Add `check-changes` to the `needs` of `build` so the output is available (no condition — build always runs)
- Verification: Confirm the workflow graph still shows `integration-tests` and `regression-tests` downstream of lint without their own build steps

### 3. Add `docs_only` skip conditions to test jobs

- [x] Add `needs: [check-changes]` to `unit-tests`, `integration-tests`, and `regression-tests`
- [x] Add `if: needs.check-changes.outputs.docs_only != 'true'` to each of those three jobs
- [x] Ensure `integration-tests` and `regression-tests` also `needs: [build]` (since build is now separate)
- Verification: Docs-only test PR shows all three test jobs as `skipped` in Actions UI

### 4. Add `upload-and-finalize-coverage` job

- [x] Add `upload-and-finalize-coverage` job with `needs: [unit-tests, integration-tests, regression-tests]`
- [x] Add `if: needs.check-changes.outputs.docs_only != 'true' && always()` — skip on docs-only but run even if tests fail
- [x] Move the Codacy partial report upload logic (curl download + `report --partial`) for each of the three coverage files into this job, guarding each upload with a file-existence check
- [x] Call `./codacy-coverage-reporter.sh final` once at the end
- [x] Remove the inline coverage upload steps from `unit-tests`, `integration-tests`, and `regression-tests`
- [x] Remove the existing `finalize-coverage` job (replaced by this job)
- Verification: Non-docs PR shows three partial uploads followed by `final` call in job logs; Codacy receives the report

### 5. Add `check-codacy-coverage` job

- [x] Add `check-codacy-coverage` job with `needs: [upload-and-finalize-coverage]`
- [x] Add condition: `if: needs.check-changes.outputs.docs_only != 'true' && github.event_name == 'pull_request'`
- [x] Use `actions/github-script@v8` to poll `github.rest.checks.listForRef` for the commit SHA
- [x] Poll at 30-second intervals for up to 10 minutes
- [x] Match check names exactly: `"Codacy Diff Coverage"` and `"Codacy Coverage Variation"`
- [x] Fail immediately if either check concludes with a non-`success` conclusion
- [x] Fail with a descriptive timeout message if both checks have not completed within the 10-minute window (hard fail — do NOT pass on timeout, unlike `wait-for-ai-reviews.yml`)
- [x] Add `permissions: checks: read` to the job
- Verification: Code-change PR with passing coverage shows job succeeding; manually test timeout path by inspecting log output

### 6. Add `ci-gate` job

- [x] Add `ci-gate` job as the final job in `.github/workflows/build-test.yml`
- [x] `needs: [lint, build, unit-tests, integration-tests, regression-tests, upload-and-finalize-coverage, check-codacy-coverage]`
- [x] `if: always()`
- [x] Single step: shell conditional `if [[ "${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}" == "true" ]]; then exit 1; fi`
- Verification: Docs-only PR shows `ci-gate` succeeding with skipped upstream jobs; failing test PR shows `ci-gate` failing

### 7. Update branch protection rules

- [ ] In GitHub repository settings → Branches → Branch protection rules for `main`:
  - Add `ci-gate` as a required status check
  - Remove `lint`, `unit-tests`, `integration-tests`, `regression-tests`, `finalize-coverage` as required checks
  - Remove `Codacy Diff Coverage` and `Codacy Coverage Variation` as required checks
  - Leave `Codacy Quality` as a required check (unchanged)
- [ ] **Perform this update immediately after the workflow change merges to `main`** to minimise the open window
- Verification: Attempt a merge without `ci-gate` passing; confirm it is blocked

## Pre-Commit Code Review

- [x] **Before every commit**, spawn a dedicated sub-agent to run the `openspec-review-code` skill. The primary agent must automatically apply all clearly-correct findings directly to the code — without stopping, without presenting the findings list to the user, and without asking for confirmation. Apply fixes, re-run any applicable validation, then proceed to commit.

## Validation

- [ ] Push a docs-only branch (only `.md` changes) and verify: `check-changes` outputs `docs_only=true`; `lint` and `build` run; test jobs, coverage upload, and `check-codacy-coverage` show as `skipped`; `ci-gate` passes
- [ ] Push a code-change branch and verify: full suite runs; `upload-and-finalize-coverage` uploads three partial reports and calls `final`; `check-codacy-coverage` polls and passes; `ci-gate` passes
- [ ] Push a mixed branch (`.md` + `.ts` files) and verify: `docs_only=false`; full suite runs
- [ ] Verify `ci-gate` fails when a test job fails (can test with a deliberately broken assertion)
- [x] Run `npm run lint` locally — no new lint errors introduced
- [x] Run `npm run build` locally — build succeeds

## Remote push validation

Verification requirements (all must pass before PR or pushing updates to a PR):

- **Lint** — `npm run lint`; must pass with no errors
- **Build** — `npm run build`; must succeed

Note: Unit, integration, and regression tests are not re-run locally for this change (CI workflow config only; no application code changed). The CI run itself is the test.

## PR and Merge

- [x] Ensure the `openspec-review-code` sub-agent was run and all findings were automatically addressed before the final commit
- [x] Commit all changes to `feat/issue-405-doc-only-ci-skip` and push to remote
- [x] Open PR from `feat/issue-405-doc-only-ci-skip` to `main`. PR body must include **`Closes #405`**
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <PR-URL> --auto --squash` (NEVER use `--admin`)
- [ ] Wait 180 seconds for CI to start and agentic reviewers to post their comments
- [ ] **Monitor PR comments** — poll autonomously; address comments, commit fixes, follow remote push validation steps, push to `feat/issue-405-doc-only-ci-skip`; wait 180 seconds; repeat until no unresolved comments remain
- [ ] **Monitor CI checks** — poll with `gh pr checks <PR-URL> --json isRequired,state`; fix any failing required checks, commit, follow remote push validation steps, push; wait 180 seconds; repeat
- [ ] **Poll for merge** — `gh pr view <PR-URL> --json state`; when `MERGED` proceed to Post-Merge; if `CLOSED` notify user

Ownership metadata:

- Implementer: AI agent (via `/opsx:apply`)
- Reviewer(s): dougis
- Required approvals: 1

Blocking resolution flow:

- CI failure → fix workflow YAML → commit → push → re-run checks
- Review comment → address → commit → push → confirm thread resolved
- Branch protection update blocked → check for typos in job name; job name in branch protection must exactly match `ci-gate`

## Post-Merge

- [ ] `git checkout main` and `git pull --ff-only`
- [ ] Verify `.github/workflows/build-test.yml` on `main` contains the `ci-gate` job
- [ ] Mark all remaining tasks as complete (`- [x]`)
- [ ] Sync approved spec deltas into `openspec/specs/`:
  - Copy `openspec/changes/issue-405-doc-only-ci-skip/specs/doc-only-ci-skip/spec.md` → `openspec/specs/doc-only-ci-skip/spec.md`
  - Copy `openspec/changes/issue-405-doc-only-ci-skip/specs/codacy-coverage-gate/spec.md` → `openspec/specs/codacy-coverage-gate/spec.md`
  - Copy `openspec/changes/issue-405-doc-only-ci-skip/specs/ci-gate/spec.md` → `openspec/specs/ci-gate/spec.md`
  - Update relative references in each copied spec from `../../design.md` → `../../changes/archive/YYYY-MM-DD-issue-405-doc-only-ci-skip/design.md`
- [ ] Archive the change as a single atomic commit: move `openspec/changes/issue-405-doc-only-ci-skip/` → `openspec/changes/archive/YYYY-MM-DD-issue-405-doc-only-ci-skip/` (stage both the copy and the deletion together — never split into two commits)
- [ ] Confirm `openspec/changes/archive/YYYY-MM-DD-issue-405-doc-only-ci-skip/` exists and `openspec/changes/issue-405-doc-only-ci-skip/` is gone
- [ ] Create doc branch: `git checkout -b doc/archive-YYYY-MM-DD-issue-405-doc-only-ci-skip` then `git push -u origin doc/archive-YYYY-MM-DD-issue-405-doc-only-ci-skip`
- [ ] Open PR from doc branch to `main` with title `docs: archive issue-405-doc-only-ci-skip (YYYY-MM-DD)`
- [ ] **IMMEDIATELY** enable auto-merge: `gh pr merge <DOC-PR-URL> --auto --squash`
- [ ] Monitor doc PR until merged (same loop — address comments and CI failures, push to doc branch, repeat)
- [ ] Prune merged local branches: `git fetch --prune` && `git branch -D feat/issue-405-doc-only-ci-skip doc/archive-YYYY-MM-DD-issue-405-doc-only-ci-skip`
