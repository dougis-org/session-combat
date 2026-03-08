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
Each Playwright test SHALL start with a clean database state. A global `beforeEach` hook (at the describe-block level or in a shared fixture) SHALL call `clearTestCollections()` before each test so that data created by a previous test does not affect subsequent tests.

#### Scenario: Database is clean at the start of each test
- **WHEN** a Playwright test begins
- **THEN** `clearTestCollections()` has been called and all user/character/party/monster/encounter/combat collections are empty
- **AND** if `clearTestCollections()` throws (e.g., cannot connect), the test fails immediately with the underlying error

#### Scenario: Cookie clearing is still performed
- **WHEN** a Playwright test begins
- **THEN** `page.context().clearCookies()` is also called (in addition to DB cleanup) so browser auth state is reset

### Requirement: No duplicate E2E spec coverage
`tests/e2e/auth.spec.ts` and `tests/e2e/combat.spec.ts` SHALL NOT test the same user scenarios. Each distinct scenario (such as "register page loads form" or "user can start a combat encounter") SHALL be owned by exactly one spec file. The recommended division of responsibilities is:
- `auth.spec.ts` — registration, login, logout, duplicate-email rejection
- `combat.spec.ts` — character creation, party creation, encounter creation, combat flow


#### Scenario: No test scenario covered by more than one spec file
- **WHEN** the spec files are audited
- **THEN** each distinct user scenario (e.g., "register page loads form") appears in exactly one spec file

#### Scenario: All previously covered scenarios still exist after consolidation
- **WHEN** E2E spec files are refactored, split, or consolidated
- **THEN** all previously covered user scenarios are preserved somewhere in the E2E suite (possibly renamed or restructured) so that no scenario loses automated coverage
