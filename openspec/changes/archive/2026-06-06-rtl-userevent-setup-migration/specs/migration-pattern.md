## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Use `userEvent.setup()` instance in all RTL tests

All RTL test files SHALL obtain a `userEvent` instance via `userEvent.setup()` before calling any interaction methods. No static calls to `userEvent.click()`, `userEvent.type()`, or `userEvent.selectOptions()` shall remain.

#### Scenario: Single-interaction test uses inline const

- **Given** a test file where only one test function calls `userEvent` methods
- **When** the test is written
- **Then** it declares `const user = userEvent.setup()` inside that test function and calls methods on `user`

#### Scenario: Multi-interaction tests use beforeEach

- **Given** a describe block where multiple test functions each call `userEvent` methods
- **When** the tests are written
- **Then** a `let user: ReturnType<typeof userEvent.setup>` is declared at describe scope and assigned in `beforeEach(() => { user = userEvent.setup(); })`

#### Scenario: No static calls remain

- **Given** the full `tests/` directory
- **When** `grep -r "userEvent\." tests/ | grep -v "setup()"` is run
- **Then** the command returns no matches

### Requirement: ADDED All migrated tests continue to pass

The migrated test files SHALL produce the same pass/fail results as before migration.

#### Scenario: All unit tests green after migration

- **Given** all 5 files have been migrated
- **When** `npm run test:unit` is executed
- **Then** the command exits with code 0 and no test failures are reported

#### Scenario: Migrated tests produce stable results

- **Given** all 5 files have been migrated
- **When** `npm run test:unit` is run twice consecutively
- **Then** both runs exit 0 with identical pass counts (no flakiness)

## MODIFIED Requirements

### Requirement: MODIFIED RTL test interaction pattern

The test suite SHALL use `userEvent.setup()` consistently across all files (previously 18/23 files; target: 23/23).

#### Scenario: CampaignsPage — multiple tests share a user instance

- **Given** `tests/unit/components/CampaignsPage.test.tsx` with 3 `it` blocks that click
- **When** the file is migrated
- **Then** a `beforeEach` assigns `user = userEvent.setup()` and each `it` block calls `await user.click(...)`

#### Scenario: SessionsPage — multiple tests share a user instance

- **Given** `tests/unit/components/SessionsPage.test.tsx` with 2 `test` blocks that click
- **When** the file is migrated
- **Then** a `beforeEach` assigns `user = userEvent.setup()` and each `test` block calls `await user.click(...)`

#### Scenario: AlignmentSelect — single test uses inline const

- **Given** `tests/unit/components/AlignmentSelect.test.tsx` with 1 test calling `selectOptions`
- **When** the file is migrated
- **Then** that test declares `const user = userEvent.setup()` inline and calls `await user.selectOptions(...)`

#### Scenario: NavBar — single test uses inline const

- **Given** `tests/unit/components/NavBar.test.tsx` with 1 test calling `click`
- **When** the file is migrated
- **Then** that test declares `const user = userEvent.setup()` inline and calls `await user.click(...)`

#### Scenario: RegisterPage — single test with multiple type calls uses inline const

- **Given** `tests/unit/components/RegisterPage.test.tsx` with 4 `type` calls in one test
- **When** the file is migrated
- **Then** that test declares `const user = userEvent.setup()` inline and calls `await user.type(...)` for each field

## REMOVED Requirements

### Requirement: REMOVED Static userEvent API usage

Reason for removal: Deprecated in `@testing-library/user-event` v14. Replaced by the `userEvent.setup()` instance pattern in all 5 affected files.

## Traceability

- Proposal: "5 files use static API" → Requirement: Use `userEvent.setup()` instance
- Proposal: "Risk of timing regressions" → Requirement: All migrated tests continue to pass
- Design Decision 1 (inline vs beforeEach) → Modified requirement scenarios per file
- Design Decision 2 (sequential migration) → Tasks: migrate one file at a time, verify after each

