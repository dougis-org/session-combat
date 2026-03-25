# ci-build-test Delta Spec

## MODIFIED Requirements

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

### Requirement: Non-instrumented suites are not implied to contribute coverage
The `Build & Test` capability SHALL distinguish between suites that validate behavior and suites that contribute LCOV coverage totals. With E2E instrumentation active, the `regression-tests` job now contributes coverage. The workflow SHALL log clearly when any expected coverage artifact is missing.

#### Scenario: E2E coverage file present
- **WHEN** the `regression-tests` job completes and `coverage-e2e/lcov.info` exists
- **THEN** the Codacy reporter uploads it with `report --partial -r coverage-e2e/lcov.info`

#### Scenario: E2E coverage file absent
- **WHEN** `coverage-e2e/lcov.info` does not exist after the regression job completes
- **THEN** the upload step logs a message and exits without error
- **AND** does not block the `finalize-coverage` job

## ADDED Requirements

### Requirement: E2E coverage uploaded to Codacy as partial from regression job
The `regression-tests` CI job SHALL upload `coverage-e2e/lcov.info` to Codacy as a partial coverage report after Playwright tests complete, using the same pattern as unit and integration jobs.

#### Scenario: Partial upload succeeds
- **WHEN** `coverage-e2e/lcov.info` exists and `CODACY_API_TOKEN` is set
- **THEN** the Codacy reporter is invoked with `report --partial -r coverage-e2e/lcov.info`

#### Scenario: Missing API token on fork PR
- **WHEN** `CODACY_API_TOKEN` is not set (fork PR or missing secret)
- **THEN** the upload step logs a skip message and exits 0 without failing the job
