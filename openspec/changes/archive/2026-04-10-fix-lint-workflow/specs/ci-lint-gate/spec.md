## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED FR1 — Dedicated lint CI job gates all test jobs

The CI workflow SHALL include a `lint` job that must succeed before `unit-tests`, `integration-tests`, and `regression-tests` are allowed to start.

#### Scenario: Lint passes — test jobs proceed

- **Given** a push or PR triggers the `Build & Test` workflow
- **When** the `lint` job completes with exit 0
- **Then** the three test jobs start normally and the workflow proceeds

#### Scenario: Lint fails — test jobs are blocked

- **Given** a commit introduces a lint violation
- **When** the `lint` job fails
- **Then** `unit-tests`, `integration-tests`, and `regression-tests` do not start, and the overall workflow run is marked failed

---

### Requirement: ADDED NFR1 — Lint job is deterministic and has no external service dependencies

The `lint` CI job SHALL not depend on external services (databases, APIs, secrets) beyond public npm registry access for `npm ci`.

#### Scenario: Lint job succeeds without secrets configured

- **Given** no `CODACY_API_TOKEN` or other secrets are set (e.g., a fork PR)
- **When** the `lint` job runs
- **Then** it completes successfully without attempting to contact any external service

## MODIFIED Requirements

### Requirement: MODIFIED — Test jobs declare lint as a prerequisite

Each of `unit-tests`, `integration-tests`, and `regression-tests` in `build-test.yml` SHALL declare `needs: [lint]`.

#### Scenario: Test jobs list lint dependency

- **Given** the `build-test.yml` workflow is inspected
- **When** the `needs` field of each test job is read
- **Then** `lint` appears in the `needs` array for `unit-tests`, `integration-tests`, and `regression-tests`

## REMOVED Requirements

None for this capability.

## Traceability

- Proposal element "Add lint CI job gating test jobs" -> FR1, NFR1
- Design Decision 4 (standalone job with `needs` wiring) -> FR1, MODIFIED test job prerequisites
- FR1 -> Task: Add lint job to build-test.yml
- MODIFIED -> Task: Add needs: [lint] to test jobs

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Lint job does not access external services

- **Given** the lint job runs in CI with no secrets available
- **When** the job executes `npm ci` and `npm run lint`
- **Then** the job completes without network errors or secret-related failures

### Requirement: Performance

#### Scenario: Lint job completes quickly, enabling fast feedback

- **Given** the `lint` job is triggered by a push
- **When** `npm run lint` runs against the full codebase
- **Then** the lint job completes within 3 minutes (including checkout, node setup, and install)
