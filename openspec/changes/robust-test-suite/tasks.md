## 1. Application: Add data-testid attributes

- [ ] 1.1 Add `data-testid="logout-button"` to the Logout button component
- [ ] 1.2 Verify existing `data-testid="combat-screen"`, `"initiative-order"`, `"combatants-list"`, and `"health-bar"` attributes are present; add any that are missing

## 2. Test environment: Fix Playwright global setup

- [ ] 2.1 Remove MongoDB testcontainer bootstrap from `tests/e2e/global.setup.ts` (leave as a no-op or delete the file)
- [ ] 2.2 Remove `tests/e2e/global.teardown.ts` (no container to stop)
- [ ] 2.3 Remove `globalSetup` and `globalTeardown` entries from `playwright.config.ts` if both files are deleted
- [ ] 2.4 Add a startup guard in `global.setup.ts` (or the webServer config) that fails clearly when `MONGODB_URI` is not set

## 3. E2E helpers: Replace networkidle with explicit waits

- [ ] 3.1 In `helpers/actions.ts` `registerUser`: replace `waitForLoadState("networkidle")` with `await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({ timeout: 15000 })`
- [ ] 3.2 In `helpers/actions.ts` `loginUser`: same replacement as 3.1
- [ ] 3.3 In `helpers/actions.ts` `submitRegistrationForm`: remove `waitForLoadState("networkidle")` call and its `.catch()` handler
- [ ] 3.4 In `helpers/actions.ts` `openCombat`: replace `.catch(() => console.warn(...))` calls with proper awaits; let failures propagate
- [ ] 3.5 Audit all remaining `.catch(() => {})` and `.catch(() => console.warn(...))` in `tests/e2e/` and remove or replace with proper error handling
- [ ] 3.6 Remove or replace the `waitForLoadState("networkidle").catch(...)` in `registration.spec.ts`

## 4. E2E tests: Add per-test database cleanup

- [ ] 4.1 In each E2E spec file's `beforeEach`, call `await clearTestCollections()` after `clearCookies()` — ensure `MONGODB_URI` is available to the test process
- [ ] 4.2 Verify `clearTestCollections()` connects correctly when `MONGODB_URI` points to the CI Docker-service MongoDB (not a testcontainer URL)

## 5. E2E tests: Remove brittle selectors

- [ ] 5.1 In `regression.spec.ts`, replace `locator("text=Password Strength: Weak")` and `locator("text=Password Strength: Strong")` with `data-testid` or `getByText` paired with a dedicated wrapper element
- [ ] 5.2 Replace `toHaveClass(/text-green-400/)` assertions with semantic assertions (e.g., check that the requirement item is marked as satisfied via a `data-state` or `aria-checked` attribute, or remove the assertion if it's testing implementation details)
- [ ] 5.3 Replace `page.locator("h1, h2").first()` with a specific `data-testid` or `role` locator

## 6. E2E tests: Consolidate spec files

- [ ] 6.1 Create `tests/e2e/auth.spec.ts` containing all auth-related tests: registration form tests, login form tests, logout behaviour, duplicate email rejection — drawn from `regression.spec.ts`, `registration.spec.ts`, and `logout.spec.ts`
- [ ] 6.2 Create `tests/e2e/combat.spec.ts` (or rename `regression.spec.ts`) containing: character creation, party creation, monster import, encounter creation, and the end-to-end combat flow tests
- [ ] 6.3 Delete `tests/e2e/registration.spec.ts` (content merged into `auth.spec.ts`)
- [ ] 6.4 Delete `tests/e2e/logout.spec.ts` (content merged into `auth.spec.ts`)
- [ ] 6.5 Verify that after consolidation every unique scenario from the old files is present in the new files

## 7. Integration tests: Shared server bootstrap

- [ ] 7.1 Create `tests/integration/helpers/server.ts` with a `startTestServer()` function that starts a MongoDB testcontainer, spawns `next start`, waits for health, and returns `{ baseUrl, cleanup }`
- [ ] 7.2 Update `waitForServer` in the helper to log each retry attempt and include the last error and attempt count in the final thrown error
- [ ] 7.3 Refactor `tests/integration/api.integration.test.ts` to use `startTestServer()` / `cleanup()` — remove the duplicated container+server bootstrap code
- [ ] 7.4 Refactor `tests/integration/monsters.integration.test.ts` to use `startTestServer()` / `cleanup()` — remove the duplicated container+server bootstrap code

## 8. Integration tests: Proper authentication

- [ ] 8.1 Add a `registerAndGetCookie(baseUrl, email, password)` helper to `tests/integration/helpers/server.ts` that calls `POST /api/auth/register` and extracts the session cookie from the `Set-Cookie` header
- [ ] 8.2 In `api.integration.test.ts`, replace the registration test assertion `expect([201, 409, 500]).toContain(response.status)` with `expect(response.status).toBe(201)` and use a unique email per run
- [ ] 8.3 In `monsters.integration.test.ts`, register a user in `beforeAll` and include the session cookie in all monster API requests
- [ ] 8.4 Replace all `expect([201, 401]).toContain(response.status)` monster test assertions with precise status codes (201 for authenticated happy path; 401 only in the explicit unauthenticated test)

## 9. Integration tests: Remove duplicates

- [ ] 9.1 Review `tests/integration/monsters-copy.test.ts` — if it contains no unique tests, delete it; if it does, migrate unique tests to `monsters.integration.test.ts` first
- [ ] 9.2 Confirm `tests/integration/` has no remaining `-copy` or duplicate files

## 10. Verification

- [ ] 10.1 Run `npm run test:regression` locally with `MONGODB_URI` set — all tests must pass with zero retries
- [ ] 10.2 Run `npm run test:integration` locally — all integration tests must pass
- [ ] 10.3 Push to a branch and verify CI passes with zero flaky failures across at least 2 consecutive runs
