# ci-build-test Specification

## Purpose
TBD - created by archiving change ci-coverage-codacy. Update Purpose after archive.
## Requirements
### Requirement: Workflow renamed to build-test
The CI workflow file SHALL be named `build-test.yml` and the workflow display name SHALL be "Build & Test". The old `integration-tests.yml` file SHALL be deleted.

#### Scenario: Workflow runs on push to main
- **WHEN** a commit is pushed to the `main` branch
- **THEN** the `Build & Test` workflow triggers and all jobs execute

#### Scenario: Workflow runs on pull request targeting main
- **WHEN** a pull request is opened or updated targeting `main`
- **THEN** the `Build & Test` workflow triggers and all jobs execute

### Requirement: Unit tests run in CI with coverage
The CI workflow SHALL include a `unit-tests` job that runs all Jest unit tests using the default `jest.config.js` and produces an LCOV coverage report at `coverage/lcov.info`.

#### Scenario: Unit tests pass
- **WHEN** the `unit-tests` job executes
- **THEN** Jest runs all test files matched by `jest.config.js` (excluding e2e) and exits 0 on success

#### Scenario: Unit test coverage output produced
- **WHEN** the `unit-tests` job completes successfully
- **THEN** the file `coverage/lcov.info` exists in the workspace

### Requirement: npm script for unit tests exists
The `package.json` SHALL include a `test:unit` script that runs Jest with coverage using the default configuration.

#### Scenario: Unit tests runnable locally
- **WHEN** a developer runs `npm run test:unit`
- **THEN** Jest executes all unit tests and outputs a coverage report

### Requirement: Unit test coverage uploaded to Codacy as partial
The `unit-tests` CI job SHALL upload `coverage/lcov.info` to Codacy as a partial coverage report if the file exists.

#### Scenario: Coverage file present
- **WHEN** `coverage/lcov.info` exists after unit tests complete
- **THEN** the Codacy reporter is invoked once with `report --partial -r coverage/lcov.info` (language auto-detected from the LCOV file paths)

#### Scenario: Coverage file absent
- **WHEN** `coverage/lcov.info` does not exist
- **THEN** the upload step logs a message and exits without error

### Requirement: Integration test coverage uploaded to Codacy as partial
The `integration-tests` CI job SHALL upload `coverage/lcov.info` to Codacy as a partial coverage report if the file exists.

#### Scenario: Integration coverage uploaded
- **WHEN** the integration test job completes and `coverage/lcov.info` exists
- **THEN** the Codacy reporter uploads it with `report --partial -r coverage/lcov.info` (single invocation, language auto-detected)

### Requirement: Coverage finalized after all test jobs complete
A `finalize-coverage` CI job SHALL run after all test jobs (unit, integration, regression) complete and SHALL send the Codacy `final` signal to commit the combined coverage.

#### Scenario: All jobs succeed
- **WHEN** unit-tests, integration-tests, and regression-tests all complete (success or failure)
- **THEN** `finalize-coverage` runs and calls `./codacy-coverage-reporter.sh final`

#### Scenario: One job fails
- **WHEN** any test job fails
- **THEN** `finalize-coverage` still runs (uses `if: always()`) and calls `final` so Codacy receives a complete report

### Requirement: Regression CI job uses explicit performance execution settings
The `regression-tests` job in `.github/workflows/build-test.yml` SHALL run Playwright with an explicit, documented worker strategy and a Chromium-specific browser scope rather than relying on implicit defaults.

#### Scenario: Worker strategy is explicit in CI
- **WHEN** the regression CI job starts
- **THEN** it sets the worker-count input used by Playwright explicitly through environment or command configuration
- **AND** the selected worker count is consistent with the documented regression performance strategy

#### Scenario: Browser scope is explicit in CI
- **WHEN** the regression CI job starts
- **THEN** the browser selection used for runtime budgeting is Chromium and that choice is stated in job configuration or logs
- **AND** the job does not silently fall back to the current WebKit-only override without updating the documented strategy

### Requirement: Regression CI job reports performance evidence
The `regression-tests` job SHALL emit enough evidence for reviewers to evaluate whether a performance optimization actually improved the Playwright feedback loop.

#### Scenario: Performance evidence is available on success
- **WHEN** the regression CI job succeeds
- **THEN** the CI job logs include the measured regression duration and execution settings used for the run

#### Scenario: Performance evidence is available on failure
- **WHEN** the regression CI job fails after starting Playwright
- **THEN** the CI job logs still preserve any available timing and execution details needed to diagnose the failure and compare runtime behavior

### Requirement: Coverage reporting inputs are reproducible
The `Build & Test` capability SHALL document which test jobs produce LCOV input
for Codacy and SHALL preserve a reproducible method for comparing local and CI
coverage totals.

#### Scenario: Maintainer reproduces Codacy input locally
- **WHEN** a maintainer audits a Codacy coverage report
- **THEN** the repository provides a documented way to run the same coverage-
  producing test suites locally
- **AND** the resulting local coverage artifacts can be compared directly to the
  CI job outputs used for Codacy uploads

### Requirement: Non-instrumented suites are not implied to contribute coverage
The `Build & Test` capability SHALL distinguish between suites that validate behavior and suites that contribute LCOV coverage totals. With E2E instrumentation active, the `regression-tests` job now contributes coverage. The workflow SHALL log clearly when any expected coverage artifact is missing.

#### Scenario: E2E coverage file present
- **WHEN** the `regression-tests` job completes and `coverage-e2e/lcov.info` exists
- **THEN** the Codacy reporter uploads it with `report --partial -r coverage-e2e/lcov.info`

#### Scenario: E2E coverage file absent
- **WHEN** `coverage-e2e/lcov.info` does not exist after the regression job completes
- **THEN** the upload step logs a message and exits without error
- **AND** does not block the `finalize-coverage` job

### Requirement: Playwright browser coverage is collected in a separate Chromium-only job
The `Build & Test` capability SHALL collect Playwright browser coverage in the existing `regression-tests` job, which already runs Chromium-only in CI. The `regression-tests` job SHALL set `GENERATE_SOURCE_MAPS: true` on its build step so that coverage output maps to source files. This requirement replaces the prior conditional framing ("If Playwright-contributed coverage is enabled") — coverage collection is now active.

#### Scenario: Chromium-only browser coverage job runs
- **WHEN** the `regression-tests` job executes
- **THEN** the app is built with `GENERATE_SOURCE_MAPS=true`
- **AND** Playwright collects V8 browser coverage via Chromium
- **AND** `coverage-e2e/lcov.info` is produced at the end of the test run

#### Scenario: Browser coverage is merged without claiming server execution
- **WHEN** the `regression-tests` job uploads a coverage report
- **THEN** only source-mapped client-side files are credited from that report
- **AND** maintainers do not treat the Playwright browser coverage artifact as evidence that `app/api/**` or other server-only modules were exercised

### Requirement: E2E coverage uploaded to Codacy as partial from regression job
The `regression-tests` CI job SHALL upload `coverage-e2e/lcov.info` to Codacy as a partial coverage report after Playwright tests complete, using the same pattern as unit and integration jobs.

#### Scenario: Partial upload succeeds
- **WHEN** `coverage-e2e/lcov.info` exists and `CODACY_API_TOKEN` is set
- **THEN** the Codacy reporter is invoked with `report --partial -r coverage-e2e/lcov.info`

#### Scenario: Missing API token on fork PR
- **WHEN** `CODACY_API_TOKEN` is not set (fork PR or missing secret)
- **THEN** the upload step logs a skip message and exits 0 without failing the job

### Requirement: Coverage denominator changes are auditable
The `Build & Test` capability SHALL require any change to coverage collection or
upload inputs to be documented with before-and-after impact.

#### Scenario: Jest coverage scope is changed
- **WHEN** a change modifies `collectCoverageFrom` or any uploaded LCOV source
- **THEN** the change records which files entered or left the denominator
- **AND** reviewers can distinguish metric movement caused by new tests from
  movement caused by scope changes
