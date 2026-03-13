## MODIFIED Requirements

### Requirement: Per-test database cleanup in Playwright specs
Each Playwright worker SHALL operate on an isolated test-data namespace so the regression suite can run with more than one worker without cross-worker deletion. Within that isolated namespace, each Playwright test SHALL start with a clean state. Cleanup utilities SHALL clear only the current worker's namespace or an equivalent isolated scope, and browser auth state SHALL still be reset before each test.

#### Scenario: Database is clean at the start of each test
- **WHEN** a Playwright test begins
- **THEN** the current worker's isolated test-data namespace has been reset so all user, character, party, monster, encounter, and combat records created by prior tests in that namespace are removed
- **AND** if the cleanup step throws, the test fails immediately with the underlying error

#### Scenario: Parallel workers do not delete each other's data
- **WHEN** two Playwright workers run tests concurrently
- **THEN** cleanup performed by worker A does not remove or corrupt records created by worker B
- **AND** both workers can complete without relying on serialized global collection deletion

#### Scenario: Cookie clearing is still performed
- **WHEN** a Playwright test begins
- **THEN** `page.context().clearCookies()` is also called so browser auth state is reset independently of database cleanup

## ADDED Requirements

### Requirement: Regression helpers avoid fixed delay waits
Playwright regression helpers and specs SHALL NOT rely on arbitrary fixed sleeps to make tests pass. They SHALL wait on explicit UI conditions, URL changes, or other deterministic application signals.

#### Scenario: No arbitrary fixed sleeps in regression helpers
- **WHEN** the Playwright helpers and regression specs are audited
- **THEN** no unconditional fixed-delay wait is used as the primary synchronization mechanism for navigation, form submission, or UI readiness

#### Scenario: Fast-path waits complete promptly
- **WHEN** the application becomes ready before the configured timeout
- **THEN** the helper proceeds as soon as the explicit readiness signal is satisfied without waiting additional padded delay time