# ci-lint-gate Specification

## Purpose
Define the lint gate requirements for the `Build & Test` CI workflow so lint
failures block downstream test jobs early.

## Requirements

### Requirement: Dedicated lint CI job gates all test jobs
The CI workflow SHALL include a `lint` job that must succeed before
`unit-tests`, `integration-tests`, and `regression-tests` are allowed to
start.

#### Scenario: Lint passes, test jobs proceed
- **Given** a push or PR triggers the `Build & Test` workflow
- **When** the `lint` job completes with exit 0
- **Then** the three test jobs start normally and the workflow proceeds

#### Scenario: Lint fails, test jobs are blocked
- **Given** a commit introduces a lint violation
- **When** the `lint` job fails
- **Then** `unit-tests`, `integration-tests`, and `regression-tests` do not
  start
- **And** the overall workflow run is marked failed

### Requirement: Lint job is deterministic and has no external service dependencies
The `lint` CI job SHALL not depend on external services beyond public npm
registry access for `npm ci`.

#### Scenario: Lint job succeeds without secrets configured
- **Given** no `CODACY_API_TOKEN` or other secrets are set
- **When** the `lint` job runs
- **Then** it completes successfully without attempting to contact any external
  service

### Requirement: Test jobs declare lint as a prerequisite
Each of `unit-tests`, `integration-tests`, and `regression-tests` in
`.github/workflows/build-test.yml` SHALL declare `needs: [lint]`.

#### Scenario: Test jobs list lint dependency
- **Given** the `build-test.yml` workflow is inspected
- **When** the `needs` field of each test job is read
- **Then** `lint` appears in the `needs` array for `unit-tests`,
  `integration-tests`, and `regression-tests`

### Requirement: Lint job completes quickly for fast feedback
The lint job SHALL complete within 3 minutes including checkout, node setup,
dependency install, and lint execution.

#### Scenario: Lint job completes within the time budget
- **Given** the `lint` job is triggered by a push
- **When** `npm run lint` runs against the full codebase
- **Then** the lint job completes within 3 minutes
