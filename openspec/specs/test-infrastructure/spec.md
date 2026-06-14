## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-fix-audit-cves/design.md) document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED Test Dependency Baseline

The system SHALL use `@testcontainers/mongodb` ^12.0.1, `@testcontainers/postgresql` ^12.0.1, and `ts-jest` ^29.4.11 to resolve known HIGH/CRITICAL CVEs in outdated test infrastructure dependencies.

#### Scenario: Install upgraded dependencies without conflicts

- **Given** the test environment setup
- **When** `npm install` is executed to apply package.json updates
- **Then** the dependencies install cleanly without peer dependency conflicts.

#### Scenario: Existing integration test suite passes

- **Given** the existing integration and e2e test suites
- **When** the test runner is executed
- **Then** the tests using `MongoDBContainer` successfully boot the container, execute tests, and tear down without regressions.

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Upgrade testcontainers and ts-jest -> MODIFIED Test Dependency Baseline
- Design decision -> Requirement: Upgrade to testcontainers v12 and ts-jest v29.4.11 -> MODIFIED Test Dependency Baseline
- Requirement -> Task(s): Update package.json, regenerate package-lock.json, verify test suite, verify audit.

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Security

#### Scenario: Security audit scan

- **Given** the project with upgraded test dependencies
- **When** `npm audit --audit-level=high` is executed
- **Then** the command exits with code 0, confirming zero HIGH or CRITICAL vulnerabilities are present in the dependency tree.
