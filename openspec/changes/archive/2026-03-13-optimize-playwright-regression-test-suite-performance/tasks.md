## 1. Execution

- [x] 1.1 Confirm human approval of `openspec/changes/optimize-playwright-regression-test-suite-performance/proposal.md`, assign implementer and reviewer, and record that phase one targets robust Chromium parallel execution with incremental improvement accepted.
- [x] 1.2 Check out `main`, pull the latest remote changes, and create a feature branch for `optimize-playwright-regression-test-suite-performance` before making implementation changes.
- [x] 1.3 Review `openspec/changes/optimize-playwright-regression-test-suite-performance/design.md` and the spec files under `openspec/changes/optimize-playwright-regression-test-suite-performance/specs/` to confirm the worker strategy, isolation approach, and reporting plan before coding.

## 2. Implementation

- [x] 2.1 Add or update failing Playwright-focused tests first to capture the required behavior for worker-safe isolation and performance-related helper behavior in `tests/e2e/**`.
- [x] 2.2 Update the E2E test infrastructure in `playwright.config.ts` and supporting helpers so concurrent workers use isolated test data namespaces and do not rely on global destructive cleanup.
- [x] 2.3 Remove or replace unnecessary fixed waits and other avoidable delays in `tests/e2e/**` while preserving the existing critical user-flow coverage.
- [x] 2.4 Update `.github/workflows/build-test.yml` so the regression job runs a Chromium-specific path with explicit worker settings and emits measurable runtime evidence in CI logs.
- [x] 2.5 Update `docs/E2E_REGRESSION_TESTS.md` with the supported Chromium CI execution strategy, baseline and post-change timing notes, and any required local/CI runtime configuration.
- [x] 2.6 Review the resulting test suite for duplication, scenario drift, and unnecessary complexity; simplify only where coverage remains explicit and traceable.

## 3. Validation

- [x] 3.1 Run the targeted automated tests that prove the new isolation and helper behavior, and confirm the new tests fail before implementation and pass after implementation.
- [x] 3.2 Run the Chromium regression suite with the intended worker configuration, capture the measured duration from CI-compatible logs, and compare it to the documented baseline.
- [x] 3.3 Run the required repository quality checks for changed code, including lint/build/test commands and any required Snyk scan for newly introduced or modified first-party code.
- [x] 3.4 If Chromium CI timing, flakiness, browser startup, or resource usage remains outside the approved target, reduce to the last stable worker strategy, document the blocker, and update the change artifacts before proceeding.

## 4. PR and Merge

- [x] 4.1 Create a pull request that references GitHub issue `#55`, summarizes the robust parallel execution strategy, includes before/after Chromium CI timing evidence from logs, and calls out any remaining trade-offs or follow-up work.
- [x] 4.2 Resolve blocking CI failures, unresolved review comments, and security findings before merge; if any fix changes approved behavior or scope, update proposal, design, specs, and tasks first.
- [x] 4.3 Request human review, obtain approval, and enable auto-merge only after required checks pass and the final diff matches the approved OpenSpec artifacts.

## 5. Post-Merge

- [x] 5.1 Sync approved spec deltas from `openspec/changes/optimize-playwright-regression-test-suite-performance/specs/` into `openspec/specs/` as part of the archive workflow.
- [x] 5.2 Archive the change through the OpenSpec workflow once implementation is merged and verified.
- [ ] 5.3 Prune merged local branches and confirm repository docs still reflect the current regression performance strategy after archive.

Note: the PR was merged via squash, so `git branch -d optimize-playwright-regression-test-suite-performance` is currently blocked by Git's "not fully merged" safety check. The branch was intentionally retained rather than force-deleted.