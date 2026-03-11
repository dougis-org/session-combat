## ADDED Requirements

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
