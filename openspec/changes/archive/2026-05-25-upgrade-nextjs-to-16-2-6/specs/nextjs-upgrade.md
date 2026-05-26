## ADDED Requirements

### Requirement: ADDED Security Vulnerabilities Resolved

The system SHALL have zero unpatched high/moderate severity Next.js vulnerabilities after the upgrade.

#### Scenario: npm audit clean after upgrade

- **Given** the codebase with Next.js 16.2.6 installed and dependencies resolved
- **When** `npm audit --omit=dev` is run
- **Then** no high/moderate severity vulnerabilities appear in the report (zero Next.js CVEs flagged)

#### Scenario: Specific CVEs fixed

- **Given** the pre-upgrade state has 13 known Next.js vulnerabilities (GHSA-q4gf-8mx6-v5v3, GHSA-8h8q-6873-q5fj, etc.)
- **When** Next.js is upgraded to 16.2.6
- **Then** all 13 CVEs are no longer reported in npm audit (each GHSA ID is removed from output)

### Requirement: ADDED Package Versions Updated

The system SHALL have both next and eslint-config-next at version 16.2.6.

#### Scenario: Next.js version bump

- **Given** package.json with next@^16.2.2
- **When** npm install is run
- **Then** package-lock.json reflects next 16.2.6 (verified: `grep '"version": "16.2.6"' package-lock.json | grep -c "next"` ≥ 1)

#### Scenario: ESLint config version bump

- **Given** package.json with eslint-config-next@^16.2.2
- **When** npm install is run
- **Then** package-lock.json reflects eslint-config-next 16.2.6 (verified: `npm ls eslint-config-next` shows 16.2.6)

## MODIFIED Requirements

### Requirement: MODIFIED Build Validation


The system MUST build successfully without errors or warnings after the upgrade.

#### Scenario: Build completes cleanly

- **Given** the codebase with Next.js 16.2.6 installed
- **When** `npm run build` is executed
- **Then** the process exits with code 0 and outputs "ready - started server" or similar success message (no ERR! or critical warnings)

#### Scenario: No unexpected build artifacts

- **Given** a successful build
- **When** the .next directory is inspected
- **Then** it contains expected app router output (no legacy Pages Router artifacts, no build errors logged)

### Requirement: MODIFIED Unit Test Suite Validation

All 116 unit tests SHALL pass with no failures or flakes.

#### Scenario: Full unit test suite passes

- **Given** the codebase with Next.js 16.2.6 and dependencies installed
- **When** `npm run test:unit` is executed
- **Then** all 116 tests pass (output shows "PASS" and test count matches expected, exit code 0)

#### Scenario: No new test flakes introduced

- **Given** tests that passed with 16.2.2
- **When** the same tests run with 16.2.6
- **Then** they continue to pass consistently across 3 runs (no intermittent failures)

### Requirement: MODIFIED Integration Test Suite Validation

All 23 integration tests SHALL pass with MongoDB and PostgreSQL containers.

#### Scenario: Integration tests pass with containers

- **Given** the codebase with Next.js 16.2.6, testcontainers running MongoDB and PostgreSQL
- **When** `npm run test:integration` is executed
- **Then** all 23 tests pass (output shows test count matches expected, exit code 0, no container errors)

### Requirement: MODIFIED E2E Test Suite Validation

All 11 E2E tests SHALL pass with Playwright.

#### Scenario: E2E tests validate critical flows

- **Given** the app running with Next.js 16.2.6, Playwright configured
- **When** `npx playwright test tests/e2e/` is executed
- **Then** all 11 tests pass (output shows "11 passed", exit code 0, no timeout or connection errors)

## REMOVED Requirements

(None—this is a dependency patch with no capability additions/removals)

## Traceability

- **Proposal element: "13 security vulnerabilities"** → Requirement: Security Vulnerabilities Resolved
- **Proposal element: "Next.js 16.2.2 → 16.2.6"** → Requirement: Package Versions Updated
- **Proposal element: "Validate tests pass"** → Requirements: Build Validation, Unit/Integration/E2E Test Suite Validation
- **Design decision 1: "Patch release only"** → Requirements: Package Versions Updated, Build Validation
- **Design decision 3: "Validation via existing test suite"** → Requirements: Unit/Integration/E2E Test Suite Validation

## Non-Functional Acceptance Criteria

### Requirement: Security (Vulnerability Elimination)

#### Scenario: npm audit shows no Next.js CVEs

- **Given** `npm audit --omit=dev` run post-upgrade
- **When** the report is parsed
- **Then** zero entries for next/nextjs packages in the vulnerability list (all 13 CVEs resolved)

### Requirement: Reliability (No Regressions)

#### Scenario: Application behavior unchanged after upgrade

- **Given** a deployed app with Next.js 16.2.6
- **When** standard user workflows are exercised (login, combat, encounters, characters, etc.)
- **Then** all workflows behave identically to pre-upgrade behavior (no new errors, same performance)

#### Scenario: Build artifact is deployable

- **Given** `npm run build` completes successfully
- **When** the output is deployed to staging
- **Then** the app starts, listens on the configured port, and responds to HTTP requests (no startup errors)

### Requirement: Operability (CI/CD Success)

#### Scenario: GitHub Actions CI passes

- **Given** a PR is created with the upgrade
- **When** GitHub Actions workflows run (lint, unit tests, integration tests, build)
- **Then** all required checks pass (exit codes 0, no failed jobs)
