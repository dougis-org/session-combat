## Purpose
Define stable, maintainable E2E test authoring patterns and selector/waiting conventions.

## Requirements

### Requirement: E2E helpers use explicit element-based waits instead of networkidle
All Playwright helper functions in `tests/e2e/helpers/actions.ts` SHALL use explicit element-based waits rather than `waitForLoadState("networkidle")`. Specifically:
- After form submission and URL navigation, helpers SHALL wait for a known UI element that only appears after the operation succeeds (e.g., a dashboard heading or the user's email in the nav)
- After login/registration, helpers SHALL wait for a `[data-testid="logout-button"]` element to become visible as the signal that authentication succeeded
- `.catch(() => {})` and `.catch(() => console.warn(...))` SHALL NOT be used to suppress wait errors; all timeouts SHALL propagate as test failures

#### Scenario: Registration wait uses authenticated element
- **WHEN** `registerUser()` submits the form and the server returns a successful response
- **THEN** the helper waits for `[data-testid="logout-button"]` to be visible (timeout: 15 s)
- **AND** if the element does not appear within the timeout the helper throws, failing the test with a clear message

#### Scenario: Login wait uses authenticated element
- **WHEN** `loginUser()` submits credentials and the server returns a successful response
- **THEN** the helper waits for `[data-testid="logout-button"]` to be visible (timeout: 15 s)
- **AND** does not use `waitForLoadState("networkidle")`

#### Scenario: networkidle is never used
- **WHEN** the test suite is audited
- **THEN** no call to `waitForLoadState("networkidle")` exists in `tests/e2e/`

### Requirement: E2E tests use data-testid selectors for key elements
Playwright tests SHALL locate critical interactive elements using `data-testid` attributes rather than text content, CSS classes, or positional locators (`.first()`, `nth()`). Key elements that SHALL have `data-testid` attributes added to the application source:
- `logout-button` — the logout button visible on authenticated pages
- `combat-screen` — the root container of the active combat view (already exists)
- `initiative-order` — the initiative tracker list (already exists)
- `combatants-list` — the list of combatants (already exists)
- `health-bar` — individual combatant health bars (already exists)

Tests SHALL NOT use `locator("text=Password Strength: Weak")` or `toHaveClass(/text-green-400/)` style assertions that couple tests to display copy or Tailwind utility classes.

#### Scenario: Logout button located by testid
- **WHEN** a test needs to click the logout button
- **THEN** it uses `page.locator('[data-testid="logout-button"]')` to locate it

#### Scenario: No Tailwind class assertions
- **WHEN** the test suite is audited
- **THEN** no `toHaveClass(/text-green-/)` or similar Tailwind-specific class assertions exist in E2E tests

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

### Requirement: No duplicate E2E spec coverage
`tests/e2e/auth.spec.ts`, `tests/e2e/combat.spec.ts`, `tests/e2e/characters.spec.ts`, and `tests/e2e/parties.spec.ts` SHALL NOT test the same user scenarios. Each distinct scenario (such as "register page loads form" or "user can start a combat encounter") SHALL be owned by exactly one spec file. The recommended division of responsibilities is:
- `auth.spec.ts` — registration, login, logout, duplicate-email rejection
- `combat.spec.ts` — encounter creation, combat flow setup, legendary actions, lair actions, temp HP, end-to-end flow including character/party as prerequisites
- `characters.spec.ts` — character creation (including validation and field interactions), persistence, display, editing, and deletion
- `parties.spec.ts` — party creation (including validation and member state), persistence, display, editing, and deletion

Existing character and party creation tests in `combat.spec.ts` MAY remain as they serve a distinct purpose (verifying combat setup prerequisites) and SHALL NOT be removed solely to eliminate overlap. All *new* character and party coverage SHALL be added to `characters.spec.ts` and `parties.spec.ts` respectively.

#### Scenario: No test scenario covered by more than one spec file
- **WHEN** the spec files are audited
- **THEN** each distinct user scenario (e.g., "register page loads form") appears in exactly one spec file
- **AND** `characters.spec.ts` is the authoritative owner of character CRUD regression coverage
- **AND** `parties.spec.ts` is the authoritative owner of party CRUD regression coverage

#### Scenario: All previously covered scenarios still exist after new files are added
- **WHEN** `characters.spec.ts` and `parties.spec.ts` are added to `tests/e2e/`
- **THEN** all previously covered user scenarios in `auth.spec.ts` and `combat.spec.ts` are preserved
- **AND** no existing passing test is removed or modified

#### Scenario: New character or party coverage goes in the domain spec file
- **WHEN** a developer adds a new test for character creation, editing, or deletion
- **THEN** the test is placed in `tests/e2e/characters.spec.ts`
- **WHEN** a developer adds a new test for party creation, editing, or deletion
- **THEN** the test is placed in `tests/e2e/parties.spec.ts`

### Requirement: Regression helpers avoid fixed delay waits
Playwright regression helpers and specs SHALL NOT rely on arbitrary fixed sleeps to make tests pass. They SHALL wait on explicit UI conditions, URL changes, or other deterministic application signals.

#### Scenario: No arbitrary fixed sleeps in regression helpers
- **WHEN** the Playwright helpers and regression specs are audited
- **THEN** no unconditional fixed-delay wait is used as the primary synchronization mechanism for navigation, form submission, or UI readiness

#### Scenario: Fast-path waits complete promptly
- **WHEN** the application becomes ready before the configured timeout
- **THEN** the helper proceeds as soon as the explicit readiness signal is satisfied without waiting additional padded delay time
