## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

_No new capabilities are added by this change._

## MODIFIED Requirements

### Requirement: MODIFIED Test file boilerplate

Unit test files (matched by `jest.config.js`, i.e. under `tests/unit/`) SHALL NOT contain `@jest-environment jsdom` docblock comments or per-file `IS_REACT_ACT_ENVIRONMENT` assignments — these are already set globally by `jest.config.js` and `jest.setup.ts`. Integration test files (matched by `jest.integration.config.js`, which uses `testEnvironment: "node"`) MAY retain `@jest-environment jsdom` overrides where required for browser-API access.

#### Scenario: No per-file jest-environment docblocks remain

- **Given** the full test suite in `tests/`
- **When** `grep -r "@jest-environment jsdom" tests/` is run after cleanup
- **Then** the command returns no matches (exit code 1 / empty output)

#### Scenario: No per-file IS_REACT_ACT_ENVIRONMENT assignments remain

- **Given** the full test suite in `tests/`
- **When** `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/` is run after cleanup
- **Then** the command returns no matches (exit code 1 / empty output)

#### Scenario: reactRoot.ts helper has no jest-environment docblock

- **Given** `tests/unit/helpers/reactRoot.ts`
- **When** its contents are read
- **Then** no `@jest-environment` annotation is present

#### Scenario: jest.setup.ts retains global IS_REACT_ACT_ENVIRONMENT

- **Given** `jest.setup.ts`
- **When** its contents are read
- **Then** `IS_REACT_ACT_ENVIRONMENT = true` is still present on line 7

#### Scenario: jest.config.js retains testEnvironment: jsdom

- **Given** `jest.config.js`
- **When** its contents are read
- **Then** `testEnvironment: "jsdom"` is still present

## REMOVED Requirements

### Requirement: REMOVED Per-file jest environment override

The `@jest-environment jsdom` docblock is no longer required in unit test files matched by `jest.config.js` (under `tests/unit/`).

Reason for removal: `jest.config.js` sets `testEnvironment: "jsdom"` globally, making per-file overrides in unit test files redundant. Integration test files under `tests/integration/` that need jsdom for browser APIs retain their overrides, as `jest.integration.config.js` defaults to `node`.

### Requirement: REMOVED Per-file IS_REACT_ACT_ENVIRONMENT assignment

The `(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;` line is no longer required in individual test files.

Reason for removal: `jest.setup.ts` sets this globally via `setupFilesAfterEnv`, making per-file assignments redundant.

## Traceability

- Proposal element "Remove @jest-environment jsdom from 52 files" -> Requirement: MODIFIED Test file boilerplate (scenario 1)
- Proposal element "Remove per-file IS_REACT_ACT_ENVIRONMENT from 30 files" -> Requirement: MODIFIED Test file boilerplate (scenario 2)
- Proposal element "reactRoot.ts docblock removal" -> Requirement: MODIFIED Test file boilerplate (scenario 3)
- Design decision 1 (grep enumeration) -> Task: enumerate affected files
- Design decision 2 (full block removal) -> Task: remove docblocks
- Design decision 3 (keep in setup) -> Requirement: scenario 4
- Design decision 4 (reactRoot.ts same treatment) -> Requirement: scenario 3
- Requirement MODIFIED Test file boilerplate -> Tasks: remove-jest-env-docblocks, remove-is-react-act-env-lines, verify-tests-pass

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Full test suite passes after cleanup

- **Given** all docblock and IS_REACT_ACT_ENVIRONMENT removals have been applied
- **When** `npm run test:unit && npm run test:integration` is run
- **Then** all tests pass with zero failures and zero regressions from the pre-cleanup baseline
