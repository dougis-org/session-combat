## Context

- Relevant architecture: `.github/workflows/build-test.yml` — single workflow with five jobs: `lint`, `unit-tests`, `integration-tests`, `regression-tests`, `finalize-coverage`. Coverage uploaded inline per test job using the Codacy bash reporter. Three Codacy checks currently configured as required branch-protection rules: Codacy Diff Coverage, Codacy Coverage Variation, Codacy Quality.
- Dependencies: `dorny/paths-filter` action (or equivalent) for file-path detection; `actions/github-script` (already used in `wait-for-ai-reviews.yml`) for Codacy check polling; GitHub Checks API (`checks.listForRef`).
- Interfaces/contracts touched: `.github/workflows/build-test.yml`; GitHub branch protection rules for `main`.

## Goals / Non-Goals

### Goals

- Skip all test jobs and coverage upload on docs-only changes (all changed files match `**/*.md`).
- Always run lint and build regardless of change type.
- Surface Codacy Diff Coverage and Coverage Variation results inside the workflow for non-docs PRs; auto-pass those gates for docs-only runs.
- Expose a single `ci-gate` job as the only required branch-protection check for this workflow.
- Preserve identical test execution and coverage reporting behaviour for non-docs changes.

### Non-Goals

- Changing test configuration, coverage thresholds, or Codacy Quality check.
- Optimising CI for other partial-change patterns.
- Modifying any other workflow file.

## Decisions

### Decision 1: Path detection approach

- Chosen: `dorny/paths-filter@v3` action in a dedicated `check-changes` job, outputting a `docs_only` boolean.
- Alternatives considered: Native `git diff --name-only` shell script; workflow-level `paths-ignore` trigger filter.
- Rationale: `dorny/paths-filter` handles the edge cases (first commit, force-push, merge commits) that a naive `git diff` misses. Workflow-level `paths-ignore` skips the workflow entirely, which breaks required status checks unless GitHub treats absent checks as passing — unreliable.
- Trade-offs: Introduces an external action dependency; pinning to a SHA mitigates supply-chain risk.

### Decision 2: Standalone `build` job

- Chosen: Extract `npm run build` into a dedicated `build` job that always runs after `lint`, independent of `docs_only`.
- Alternatives considered: Keep build embedded in `integration-tests` and `regression-tests`; skip build on docs-only.
- Rationale: Proposal explicitly requires build to run on docs-only changes to catch config/syntax errors in non-test files. Extracting it also removes duplication (build was run twice in the current workflow).
- Trade-offs: Adds one job to every run; build (~30s) is cheap compared to the value of catching broken builds on doc PRs.

### Decision 3: Coverage upload consolidation

- Chosen: Remove per-job inline coverage upload steps; add a single `upload-and-finalize-coverage` job that depends on all three test jobs completing (success or failure), uploads all partial reports, then calls `final`.
- Alternatives considered: Keep per-job uploads, add a separate finalize job.
- Rationale: Consolidation removes three copies of identical curl/script logic; a single job with `if: always()` after the test fan-out ensures `final` is only called once and only when at least one test job ran. Skipped on docs-only.
- Trade-offs: Coverage lands in Codacy slightly later (after all three suites finish rather than incrementally); acceptable given Codacy processes after `final` anyway.

### Decision 4: Codacy coverage gate via workflow polling

- Chosen: `check-codacy-coverage` job uses `actions/github-script` to poll `checks.listForRef` waiting for "Codacy Diff Coverage" and "Codacy Coverage Variation" checks to reach `completed` status. Job fails if either check concludes with a non-success conclusion or if the 10-minute timeout is reached.
- Alternatives considered: Keep Codacy checks as standalone branch-protection rules (current); remove Codacy coverage gates entirely.
- Rationale: Internalising the gates allows docs-only runs to skip them cleanly without needing per-pattern branch-protection exceptions. The polling pattern is already proven in `wait-for-ai-reviews.yml`.
- Trade-offs: Adds up to 10 minutes of potential latency on non-docs PRs if Codacy is slow; timeout is a hard fail (not advisory), so a slow Codacy instance blocks merge.

### Decision 5: `ci-gate` umbrella job

- Chosen: A final `ci-gate` job with `if: always()` that depends on all upstream jobs and fails only if any upstream job concluded with `failure` or `cancelled`. Skipped jobs are treated as passing.
- Alternatives considered: Require each job individually in branch protection.
- Rationale: Single required check dramatically simplifies branch protection and makes docs-only skips transparent. The `contains(needs.*.result, 'failure')` pattern is idiomatic GitHub Actions.
- Trade-offs: If `ci-gate` itself has a bug, all PRs are blocked; mitigated by keeping the gate logic trivial (one conditional).

### Decision 6: Push-to-main handling

- Chosen: On push to `main`, `check-codacy-coverage` is skipped regardless of `docs_only` (no PR context for check polling). Coverage is still uploaded and finalized for non-docs pushes. Lint and build always run.
- Alternatives considered: Run polling on push using commit SHA checks.
- Rationale: Codacy PR checks only exist in a PR context; polling them on a direct push is not meaningful. Coverage upload to Codacy still happens, keeping repo-level metrics current.
- Trade-offs: A direct non-docs push to main that breaks coverage thresholds will not be caught by this workflow (only by subsequent PRs). Acceptable given direct pushes to main are rare and typically come from merged PRs that already passed coverage gates.

## Proposal to Design Mapping

- Proposal element: `check-changes` job detecting docs-only
  - Design decision: Decision 1 (dorny/paths-filter)
  - Validation approach: Test PR with only `.md` changes verifies `docs_only=true`; mixed PR verifies `docs_only=false`

- Proposal element: lint and build always run
  - Design decision: Decision 2 (standalone build job); lint job unchanged
  - Validation approach: Docs-only PR confirms lint and build jobs complete; test jobs show as skipped

- Proposal element: test jobs skip on docs-only
  - Design decision: `if: needs.check-changes.outputs.docs_only != 'true'` on each test job
  - Validation approach: Docs-only PR shows unit-tests, integration-tests, regression-tests as skipped in Actions UI

- Proposal element: coverage upload consolidation
  - Design decision: Decision 3 (single upload-and-finalize-coverage job)
  - Validation approach: Non-docs PR confirms all three partial reports uploaded and `final` called once

- Proposal element: Codacy coverage checks internalised
  - Design decision: Decision 4 (check-codacy-coverage polling job)
  - Validation approach: Non-docs PR with passing coverage shows check-codacy-coverage succeeding; docs-only PR shows it skipped

- Proposal element: single required branch-protection check
  - Design decision: Decision 5 (ci-gate umbrella)
  - Validation approach: Branch protection updated; docs-only PR merges with ci-gate passing and test jobs skipped

## Functional Requirements Mapping

- Requirement: Docs-only PR skips tests and coverage upload
  - Design element: `check-changes` → per-job `if` conditions → `upload-and-finalize-coverage` skip
  - Acceptance criteria reference: spec `doc-only-ci-skip` — "all test jobs show status: skipped"
  - Testability notes: Verify via Actions UI on a real docs-only PR; assert no runner minutes consumed by test jobs

- Requirement: Lint and build always run
  - Design element: `lint` and `build` jobs have no `docs_only` condition
  - Acceptance criteria reference: spec `doc-only-ci-skip` — "lint and build complete successfully"
  - Testability notes: Verify on docs-only PR run

- Requirement: Non-docs PR runs full suite with coverage gating
  - Design element: All jobs run; `check-codacy-coverage` polls and gates on Codacy results
  - Acceptance criteria reference: spec `codacy-coverage-gate` — "check-codacy-coverage passes when Codacy checks pass"
  - Testability notes: Verify on a normal code-change PR

- Requirement: `ci-gate` is the single required check
  - Design element: Decision 5 + branch protection update
  - Acceptance criteria reference: spec `ci-gate` — "branch protection lists only ci-gate"
  - Testability notes: Attempt merge without ci-gate passing; confirm it is blocked

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Docs-only classification must never produce false positives (skip tests on code changes)
  - Design element: Decision 1 — `dorny/paths-filter` with explicit `**/*.md` glob; any non-md file sets `docs_only=false`
  - Acceptance criteria reference: spec `doc-only-ci-skip` — "mixed PR runs full suite"
  - Testability notes: Test PR with one `.md` + one `.ts` file must run full suite

- Requirement category: operability
  - Requirement: Codacy polling timeout must not silently pass
  - Design element: Decision 4 — hard fail on timeout (unlike `wait-for-ai-reviews.yml` which passes on timeout)
  - Acceptance criteria reference: spec `codacy-coverage-gate` — "workflow fails if Codacy checks do not complete within 10 minutes"
  - Testability notes: Hard to test in normal flow; verified by code review of timeout logic

- Requirement category: performance
  - Requirement: Docs-only PRs complete CI in under 5 minutes
  - Design element: Only lint + build run; no npm test suites, no Playwright, no MongoDB
  - Acceptance criteria reference: spec `doc-only-ci-skip` — "ci-gate completes within 5 minutes on docs-only PR"
  - Testability notes: Measure wall-clock time on first docs-only PR after deployment

## Risks / Trade-offs

- Risk/trade-off: `dorny/paths-filter` action compromise or breaking change
  - Impact: Supply-chain risk; or CI breaks if action API changes
  - Mitigation: Pin action to a specific commit SHA; review release notes before unpinning

- Risk/trade-off: Coverage upload consolidation delays Codacy analysis start
  - Impact: Codacy polling window may need to be longer if upload is later
  - Mitigation: 10-minute poll window is generous; monitor first few PRs after deployment

- Risk/trade-off: Branch protection update window
  - Impact: Brief gap between workflow landing on main and branch protection being updated
  - Mitigation: Prepare branch protection change in advance; apply immediately after workflow merges

## Rollback / Mitigation

- Rollback trigger: Docs-only classification is incorrect (tests skipped on code change), OR `ci-gate` is blocking all PRs due to a bug, OR Codacy polling is consistently timing out.
- Rollback steps:
  1. Revert `.github/workflows/build-test.yml` to the pre-change version via a fast-follow PR.
  2. Restore original required branch-protection checks (individual job names + Codacy checks).
  3. Merge the revert PR — it will pass under the restored protection rules.
- Data migration considerations: None — this change is purely CI configuration.
- Verification after rollback: Run a normal code-change PR end-to-end; confirm all original checks appear and pass.

## Operational Blocking Policy

- If CI checks fail: Investigate the specific failing job in the Actions UI. For test failures, fix the code. For `check-codacy-coverage` timeout, re-run the workflow — Codacy may have been temporarily slow. For `ci-gate` failure, check which upstream job failed.
- If security checks fail: Not applicable to this change (no application code modified).
- If required reviews are blocked/stale: Standard PR process applies — request re-review from codeowner.
- Escalation path and timeout: If `check-codacy-coverage` times out repeatedly (>3 consecutive runs), increase the timeout constant or investigate Codacy API availability. If unresolvable within 24 hours, roll back to standalone Codacy branch-protection checks as an interim measure.

## Open Questions

No open questions. All design decisions are resolved based on the explore session and existing codebase patterns.
