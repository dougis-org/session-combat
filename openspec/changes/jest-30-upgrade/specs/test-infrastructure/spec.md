## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED Test Dependency Baseline

The system SHALL use `jest` ^30.x, `jest-environment-jsdom` ^30.x, `@types/jest` ^30.x, and `@testing-library/jest-dom` ^7.x as the unit/integration test toolchain, transformed exclusively through `ts-jest` (bumped only if required for Jest 30 peer compatibility), with the unused `@swc/jest` dependency removed.

#### Scenario: Install upgraded dependencies without conflicts

- **Given** the test environment setup with `package.json` updated to the Jest 30 line
- **When** `npm install` (or `npm ci`) is executed
- **Then** the dependencies install cleanly with no unresolved peer-dependency conflicts between `jest@30` and `ts-jest`.

#### Scenario: Unused transform dependency removed

- **Given** `@swc/jest` was previously listed in `package.json` with no config file referencing it and no other package depending on it
- **When** the dependency baseline is updated
- **Then** `@swc/jest` no longer appears in `package.json` or `package-lock.json`, and `npm ls @swc/jest` reports it as not found.

#### Scenario: Existing unit test suite passes under Jest 30

- **Given** the existing `tests/unit` suite and `jest.config.js` (`testEnvironment: "jsdom"`, `ts-jest` transform)
- **When** `npm run test:unit` is executed against the upgraded dependencies
- **Then** all tests that passed before the upgrade continue to pass, with no changes required to application code under `app/` or `lib/`.

#### Scenario: Existing integration test suite passes under Jest 30

- **Given** the existing `tests/integration` suite and `jest.integration.config.js` (`testEnvironment: "node"`, `ts-jest` transform)
- **When** `npm run test:integration` is executed against the upgraded dependencies
- **Then** all tests that passed before the upgrade continue to pass, with no changes required to application code under `app/` or `lib/`.

### Requirement: MODIFIED Unit Test Script Path Filtering

The `test:unit` npm script SHALL select the `tests/unit` path scope using the CLI flag name valid for the installed Jest major version.

#### Scenario: test:unit uses the Jest-30-valid flag

- **Given** Jest 30 renames the `--testPathPattern` CLI flag to `--testPathPatterns`
- **When** the `test:unit` script in `package.json` is invoked
- **Then** it uses `--testPathPatterns='tests/unit'` and runs only the `tests/unit` subset, exiting 0 with coverage collected as before.

## REMOVED Requirements

None

## Traceability

- Proposal element -> Requirement: Bump jest/jest-environment-jsdom/@types/jest/@testing-library/jest-dom to Jest 30 -> MODIFIED Test Dependency Baseline
- Proposal element -> Requirement: Remove unused `@swc/jest` -> MODIFIED Test Dependency Baseline (Scenario: Unused transform dependency removed)
- Proposal element -> Requirement: Rename `--testPathPattern` to `--testPathPatterns` -> MODIFIED Unit Test Script Path Filtering
- Design decision -> Requirement: Decision 1 (remove @swc/jest) -> MODIFIED Test Dependency Baseline
- Design decision -> Requirement: Decision 2 (keep ts-jest, bump only if required) -> MODIFIED Test Dependency Baseline
- Design decision -> Requirement: Decision 3 (config files untouched unless forced) -> MODIFIED Test Dependency Baseline (Scenario: Existing unit/integration test suite passes)
- Requirement -> Task(s): Update package.json dependency versions, remove @swc/jest, rename test:unit flag, regenerate package-lock.json, run and fix test/lint/typecheck suites.

## Non-Functional Acceptance Criteria

> **Important:** NFAC scenarios MUST NOT duplicate scenarios already expressed in the functional requirements sections above (ADDED/MODIFIED/REMOVED). If a functional scenario already covers a given behavior (e.g., access-control rejection, error handling), cross-reference it here instead of repeating it. Only include NFAC scenarios that express genuinely new, non-functional behaviors (latency budgets, throughput limits, recovery SLOs, audit logging, etc.).

### Requirement: Reliability

#### Scenario: Coverage output remains ingestible by Codacy

- **Given** CI uploads `coverage/lcov.info` produced by `npm run test:unit` and `npm run test:integration -- --coverage` to Codacy
- **When** the Jest 30 upgrade is applied
- **Then** `coverage/lcov.info` continues to be produced in the same location and lcov format, with no changes to `collectCoverageFrom` needed in either Jest config.

### Requirement: Operability

#### Scenario: No application code changes introduced

- **Given** this change's scope is limited to test tooling
- **When** the change is complete
- **Then** a diff against the base branch shows no modified files under `app/` or `lib/` — only `package.json`, `package-lock.json`, and, if strictly required by a Jest 30 breaking change, `jest.config.js` and/or `jest.integration.config.js`.
