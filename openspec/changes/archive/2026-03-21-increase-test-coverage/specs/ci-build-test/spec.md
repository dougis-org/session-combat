## ADDED Requirements

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
The `Build & Test` capability SHALL distinguish between suites that validate
behavior and suites that currently contribute LCOV coverage totals.

#### Scenario: Regression tests lack LCOV instrumentation
- **WHEN** the regression or E2E job completes without a `coverage/lcov.info`
  artifact
- **THEN** the workflow logs that no coverage report was produced for that job
- **AND** maintainers do not treat that job as a Codacy coverage contributor

### Requirement: Playwright browser coverage is collected in a separate Chromium-only job
If Playwright-contributed coverage is enabled, the `Build & Test` capability
SHALL collect it in a Chromium-based job separate from the existing cross-
browser regression run.

#### Scenario: Chromium-only browser coverage job runs
- **WHEN** browser coverage is enabled for Playwright
- **THEN** a dedicated Chromium-based job collects browser JavaScript coverage
- **AND** the existing regression run remains responsible for browser-behavior
  validation rather than being replaced solely for coverage purposes

#### Scenario: Browser coverage is merged without claiming server execution
- **WHEN** the Chromium Playwright coverage job uploads a merged report
- **THEN** only source-mapped client-side files are credited from that report
- **AND** maintainers do not treat the Playwright browser coverage artifact as
  evidence that `app/api/**` or other server-only modules were exercised

### Requirement: Coverage denominator changes are auditable
The `Build & Test` capability SHALL require any change to coverage collection or
upload inputs to be documented with before-and-after impact.

#### Scenario: Jest coverage scope is changed
- **WHEN** a change modifies `collectCoverageFrom` or any uploaded LCOV source
- **THEN** the change records which files entered or left the denominator
- **AND** reviewers can distinguish metric movement caused by new tests from
  movement caused by scope changes