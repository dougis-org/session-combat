## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Integration test worker configuration via env var

The system SHALL read `INTEGRATION_WORKERS` from the environment to set Jest `maxWorkers` for the integration test suite, warn on invalid values, and fall back to `'50%'` (half logical CPUs) when unset.

#### Scenario: Valid INTEGRATION_WORKERS value

- **Given** `INTEGRATION_WORKERS=4` is set in the environment
- **When** `npm run test:integration` is executed
- **Then** Jest runs with `maxWorkers: 4`, multiple test files execute concurrently, and all tests pass

#### Scenario: Invalid INTEGRATION_WORKERS value

- **Given** `INTEGRATION_WORKERS=banana` is set in the environment
- **When** `npm run test:integration` is executed
- **Then** a warning is printed to stderr (e.g., `Invalid INTEGRATION_WORKERS="banana"; falling back to default`), Jest uses its default worker count, and tests proceed normally

#### Scenario: INTEGRATION_WORKERS not set (local default)

- **Given** `INTEGRATION_WORKERS` is not set in the environment
- **When** `npm run test:integration` is executed
- **Then** Jest uses `'50%'` as the explicit `maxWorkers` value (approximately half of logical CPUs) and tests pass

### Requirement: ADDED Playwright smart local worker default

The system SHALL allow Playwright to use its built-in worker default (half logical CPUs, bounded by spec file count) when `REGRESSION_WORKERS` is not set.

#### Scenario: REGRESSION_WORKERS not set on local machine

- **Given** `REGRESSION_WORKERS` is not set and the machine has 4 logical CPUs
- **When** `npm run test:regression` is executed
- **Then** Playwright uses 2 workers (min of 2 and 4 spec files) instead of 1, reducing wall-clock time

#### Scenario: REGRESSION_WORKERS explicitly set to 1

- **Given** `REGRESSION_WORKERS=1` is set in the environment
- **When** `npm run test:regression` is executed
- **Then** Playwright uses exactly 1 worker (escape hatch for debugging)

## MODIFIED Requirements

### Requirement: MODIFIED Integration test suite runs sequentially

The system SHALL no longer force sequential execution of integration tests via `maxWorkers: 1`.

#### Scenario: Parallel integration tests remain data-isolated

- **Given** 4 Jest workers are running integration tests concurrently
- **When** each worker creates test users and performs CRUD operations
- **Then** no test fails due to data contention (unique email addresses prevent collision)

### Requirement: MODIFIED CI regression test worker count

The system SHALL run E2E regression tests in CI with 4 workers instead of 2.

#### Scenario: CI regression job

- **Given** the CI workflow sets `REGRESSION_WORKERS: '4'`
- **When** the regression-tests CI job runs
- **Then** the finish trap logs `Regression workers: 4` and Playwright distributes spec files across 4 workers

## REMOVED Requirements

### Requirement: REMOVED Hard-coded sequential integration test execution

Reason for removal: The original `maxWorkers: 1` was added to avoid port conflicts between concurrent Jest processes on the same machine. Issue #220 resolved this by assigning deterministic per-directory ports. The constraint no longer serves a purpose.

## Traceability

- Proposal: remove stale `maxWorkers: 1` → Requirement: MODIFIED Integration test suite runs sequentially → Task: Update jest.integration.config.js
- Proposal: `INTEGRATION_WORKERS` env var → Requirement: ADDED Integration test worker configuration → Task: Update jest.integration.config.js
- Proposal: E2E local default → Requirement: ADDED Playwright smart local worker default → Task: Update playwright.config.ts
- Proposal: CI env vars → Requirement: MODIFIED CI regression worker count → Task: Update build-test.yml
- Design Decision 1 → Requirement: ADDED Integration test worker configuration
- Design Decision 2 → Requirement: ADDED Playwright smart local worker default
- Design Decision 3 → Requirement: MODIFIED CI regression worker count

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Integration tests stable under parallelism

- **Given** `INTEGRATION_WORKERS=4` and the full integration test suite
- **When** the suite is run 3 consecutive times
- **Then** all 3 runs pass with zero flaky failures attributable to data contention

### Requirement: Performance

#### Scenario: Reduced wall-clock time in CI

- **Given** the integration-tests CI job runs with `INTEGRATION_WORKERS=4`
- **When** compared to the previous sequential baseline
- **Then** total job duration decreases (directional; no hard SLA)

### Requirement: Operability

#### Scenario: Emergency rollback without code change

- **Given** parallel integration tests are causing failures
- **When** `INTEGRATION_WORKERS` is set to `'1'` in `.github/workflows/build-test.yml`
- **Then** integration tests return to sequential execution without a code change or redeployment
