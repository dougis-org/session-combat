# userEvent.setup() Instance Pattern

Specification for consistent use of `@testing-library/user-event` v14 in RTL unit tests.

## Requirement: Use `userEvent.setup()` instance for all interactions

All RTL test files SHALL obtain a `userEvent` instance via `userEvent.setup()` before calling any interaction methods. No static calls to `userEvent.click()`, `userEvent.type()`, or `userEvent.selectOptions()` shall remain.

### Scenario: Single-interaction test uses inline const

- **Given** a test file where only one test function calls `userEvent` methods
- **When** the test is written
- **Then** it declares `const user = userEvent.setup()` inside that test function and calls methods on `user`

### Scenario: Multi-interaction tests use beforeEach

- **Given** a describe block where multiple test functions each call `userEvent` methods
- **When** the tests are written
- **Then** a `let user: ReturnType<typeof userEvent.setup>` is declared at describe scope and assigned in `beforeEach(() => { user = userEvent.setup(); })`

### Scenario: No static calls remain

- **Given** the full `tests/` directory
- **When** `grep -r "userEvent\.\(click\|type\|selectOptions\)" tests/` is run
- **Then** the command returns no matches

## Requirement: All tests continue to pass after migration

Migrated test files SHALL produce the same pass/fail results as before migration.

### Scenario: All unit tests green after migration

- **Given** all affected files have been migrated
- **When** `npm run test:unit` is executed
- **Then** the command exits with code 0 and no test failures are reported with identical pass counts (no flakiness)
