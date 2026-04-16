## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

(No new config capabilities added — only simplification and removal.)

## MODIFIED Requirements

### Requirement: MODIFIED `jest.integration.config.js` uses single glob, no exclusions

The system SHALL have a `jest.integration.config.js` that matches all `tests/integration/**/*.test.ts` files without `testPathIgnorePatterns`.

#### Scenario: Config runs all integration tests including Docker tests

- **Given** `jest.integration.config.js` previously excluded `api.integration.test.ts` and `monsters.integration.test.ts`
- **When** `testPathIgnorePatterns` is removed and `testMatch` covers `**/tests/integration/**/*.test.ts`
- **Then** `npm run test:integration` runs the full integration suite including testcontainer-dependent tests

#### Scenario: CI script unchanged

- **Given** `test:ci` is defined as `npm run test:integration -- --forceExit`
- **When** `jest.integration.config.js` is updated
- **Then** `npm run test:ci` continues to run the full integration suite with forceExit

## REMOVED Requirements

### Requirement: REMOVED `jest.docker.config.js`

Reason for removal: The split existed only because non-Docker integration tests needed a separate config to avoid starting containers. Once all integration tests use real dependencies (or are documented exceptions with boundary-only mocks), both configs have identical purpose. `jest.integration.config.js` absorbs the full scope.

### Requirement: REMOVED `test:docker` script from `package.json`

Reason for removal: `jest.docker.config.js` is deleted. The `test:integration` script replaces `test:docker` for running testcontainer-dependent tests.

## Traceability

- Proposal: Config collapse → MODIFIED jest.integration.config.js, REMOVED jest.docker.config.js, REMOVED test:docker
- Design Decision 7 → All requirements in this spec
- Requirements → Tasks: see tasks.md (config collapse task; must be last, after all file moves complete)

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: test:integration replaces test:docker

- **Given** `jest.docker.config.js` is deleted
- **When** a developer runs `npm run test:integration`
- **Then** all integration tests including testcontainer-dependent ones execute successfully
