# End-to-End Regression Tests with Playwright

This guide covers how to run and write Playwright-based end-to-end (E2E) regression tests for the session-combat application.

## Overview

**Playwright** is a modern testing framework for end-to-end testing of web applications.
Our regression test suite validates critical user flows in parallel, ensuring UI
consistency and behavior across releases.

## Why Playwright?

- **Real Browser Testing**: Tests run in real browsers (Chromium, Firefox, WebKit)
- **Parallel Execution**: Multiple tests run simultaneously for faster feedback
- **Reliable Waits**: Automatic waiting for elements and network conditions
- **Trace/Debug**: Built-in debugging and trace capabilities
- **Cross-Browser**: Single test suite runs against multiple browsers

## Prerequisites

- **Node.js**: Version 18 or higher (tested with v20+)
- **npm**: Version 9 or higher
- **Dev Server**: Next.js development or production server running on `http://localhost:3000`

## Running Regression Tests Locally

### 1. Install Playwright Browsers

On first install, download Playwright browser binaries:

```bash
npx playwright install
```

### 2. Start the Development Server

In a separate terminal, start the Next.js development server:

```bash
npm run dev
```

Wait for the server to be ready:

```text
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### 3. Run Regression Tests

**Run all Playwright tests:**

```bash
npm run test:e2e
```

**Run regression test suite specifically:**

```bash
npm run test:regression
```

Workers default to Playwright's auto-detection locally, or 1 in CI. Override with:

```bash
REGRESSION_WORKERS=2 npm run test:regression
```

**Run tests in headed mode** (see browser):

```bash
npm run test:e2e:ui
```

**Debug a specific test:**

```bash
npx playwright test tests/e2e/regression.spec.ts --debug
```

## Test Organization

### File Structure

```text
tests/
├── e2e/
│   ├── regression.spec.ts          # Main regression test suite (38 tests)
│   ├── registration.spec.ts        # Registration flow tests (6 tests)
│   ├── logout.spec.ts              # Logout/storage cleanup tests (1 test)
│   └── helpers/
│       ├── actions.ts              # Reusable UI action helpers
│       └── db.ts                   # Database test helpers (optional, for teardown)
```

## Test Helpers

### `tests/e2e/helpers/actions.ts`

Reusable UI action functions covering the full regression suite:

```typescript
import {
  generateUniqueEmail,
  registerUser,
  loginUser,
  createCharacter,
  createParty,
  importMonster,
  createEncounter,
  openCombat,
  verifyCombatScreenElements,
} from './helpers/actions';

// Generate unique email for registration
const email = generateUniqueEmail();
const password = 'a-strong-password';

// Complete registration flow
await registerUser(page, email, password);

// Login
await loginUser(page, email, password);

// Create character (Phase 2+)
await createCharacter(page, { name: 'Aragorn', class: 'Fighter', race: 'Human' });
```

### `tests/e2e/helpers/db.ts` (Optional)

Database helpers for test cleanup (only used when `MONGODB_DB` environment variable is set):

```typescript
import { clearTestCollections, disconnectDB } from './helpers/db';

// Clear collections before test scenario (Phase 2+)
await clearTestCollections();

// Disconnect after tests
await disconnectDB();
```

## Regression Test Suite

### What Gets Tested

The regression suite (`tests/e2e/regression.spec.ts`) includes **38 parallel tests** covering the full user journey:

#### 1. Registration Page Tests (9 tests)

- ✅ Register page loads and displays form
- ✅ Register form has all required input fields
- ✅ Register form has submit button
- ✅ Email input accepts valid email format
- ✅ Password input accepts text input
- ✅ Confirm password input accepts text input
- ✅ Password requirements are displayed
- ✅ Password requirements update based on input
- ✅ Can link to login page from register

#### 2. Login Page Tests (3 tests)

- ✅ Login page loads and displays form
- ✅ Login form has email and password fields
- ✅ Login form has submit button

#### 3. Navigation & Routing Tests (2 tests)

- ✅ Register and login pages are accessible
- ✅ Navigation does not produce console errors

#### 4. Form Interaction Tests (4 tests)

- ✅ Form fields can be filled and cleared
- ✅ Password inputs mask character entry
- ✅ Form shows/hides elements appropriately
- ✅ Page remains responsive after user input

#### 5. UI Consistency Tests (3 tests)

- ✅ Register page has consistent styling
- ✅ Form labels exist for accessibility
- ✅ Form elements are properly spaced and visible

#### 6. Edge Cases & Robustness Tests (6 tests)

- ✅ Can reload register page multiple times
- ✅ Can switch between register and login pages
- ✅ Back button navigation works
- ✅ Form inputs persist during page interactions
- ✅ Form is interactive and not stuck loading
- ✅ Page responds to rapid user input

#### 7. Full User Flow Tests (11 tests)

- ✅ Complete user registration flow
- ✅ User can login after registration
- ✅ Registered user can create a character
- ✅ Multiple characters can be created
- ✅ User can create a party
- ✅ Party with different member counts can be created
- ✅ User can import monsters from file
- ✅ User can create an encounter
- ✅ User can open combat screen for an encounter
- ✅ Combat screen displays required UI elements
- ✅ Complete end-to-end flow from registration to combat

**Total: 38 regression tests** run via `npm run test:regression`.
The full E2E suite (`npm run test:e2e`) additionally includes
`registration.spec.ts` and `logout.spec.ts`.

### Test Categories

| Category | Count | Coverage |
| -------- | ----- | -------- |
| Registration page | 9 | Page load, form structure, field interaction |
| Login page | 3 | Page load, fields, submit button |
| Navigation | 2 | Page accessibility, routing, console errors |
| Form interaction | 4 | Field fills/clears, input masking, responsiveness |
| UI consistency | 3 | Styling, labels, element spacing |
| Edge cases | 6 | Reloading, navigation, back button, persistence |
| Full user flows | 11 | Registration -> login -> character -> party -> encounter -> combat |
| **TOTAL** | **38** | **Full regression coverage** |

### Running Specific Test

```bash

# Run only registration tests

npx playwright test regression.spec.ts -g "Registration"

# Run only form tests

npx playwright test regression.spec.ts -g "Form"
```

## Viewing Test Results

### HTML Report

After running tests, view the interactive HTML report:

```bash
npx playwright show-report
```

Or open the report directly:

```bash
open playwright-report/index.html
```

The report shows:

- ✅ Passing tests
- ❌ Failed tests with traces
- ⏱️ Test duration
- 📸 Screenshots
- 🎬 Video recordings (if enabled)

### CI Artifacts

In GitHub Actions, Playwright reports are uploaded as artifacts on all runs:

```text
playwright-report/
test-results/
```

Download from the Actions tab to view locally.

## Configuration

### playwright.config.ts

Key settings:

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.REGRESSION_WORKERS
    ? parseInt(process.env.REGRESSION_WORKERS, 10)
    : process.env.CI
      ? 1
      : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Environment Variables

- `REGRESSION_WORKERS` - Number of parallel workers (defaults to Playwright auto-detection locally, 1 in CI)
- `MONGODB_URI` - MongoDB connection string (set to `mongodb://localhost:27017` in CI)
- `MONGODB_DB` - Test database name (set to `session-combat-e2e` in CI)
- `CHROMIUM_ONLY` - Set to `'true'` in CI to run the Chromium-specific regression path
- `CI` - Set by GitHub Actions; triggers single worker + 2 retries

## Running in CI

Regression tests run automatically in GitHub Actions:

### Workflow: `.github/workflows/build-test.yml`

```yaml

- name: Install Playwright browsers with system dependencies

  run: npx playwright install --with-deps

- name: Run Playwright regression tests

  run: |
    set -uo pipefail
    start_ts=$(date +%s)
    finish() {
      status=$?
      end_ts=$(date +%s)
      elapsed=$((end_ts - start_ts))
      echo "Regression browser scope: chromium"
      echo "Regression workers: ${REGRESSION_WORKERS:-unset}"
      echo "Regression duration (seconds): ${elapsed}"
      exit $status
    }
    trap finish EXIT
    npm run test:regression -- --project=chromium 2>&1 | tee /dev/stderr
  env:
    REGRESSION_WORKERS: '2'
    MONGODB_URI: mongodb://localhost:27017
    MONGODB_DB: session-combat-e2e
    CHROMIUM_ONLY: 'true'

- name: Upload Playwright HTML report

  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Best Practices

### Writing Tests

1. **Use data-driven approach**: Load test data from JSON fixtures (Phase 2+)
2. **Generate unique identifiers**: Use `generateUniqueEmail()` for each test
3. **Wait for elements properly**: Use Playwright's auto-waiting; avoid fixed `waitForTimeout()`
4. **Clear cookies before each test**: Ensures test isolation
5. **Use specific selectors**: Prefer IDs and `data-testid` attributes over flaky class names or placeholders

### Database Isolation

The regression suite uses namespace-based isolation rather than global collection wipes:

- Each test clears browser cookies in `beforeEach()`
- Each stateful test creates a unique user identity and scoped labels for created data
- Characters, parties, encounters, combat state, and uploaded monsters remain
  isolated because the backing APIs are already user-scoped
- Global database deletion is intentionally avoided during Playwright runs so
  parallel workers cannot erase each other's state

If you need to inspect or reset the test database manually between repeated
local runs, use a disposable test database name via `MONGODB_DB`.

### Reliability

- **Aim for <2% flakiness**: Repeat test runs to verify stability
- **Avoid hard sleeps**: Use Playwright's auto-waiting (`waitForLoadState()`, locator waits, `waitForURL()`)
- **Handle flaky tests**: Configure retries in `playwright.config.ts`:

  ```typescript
  retries: process.env.CI ? 2 : 0,  // 2 retries in CI, 0 locally
  ```

- **Parallel safe**: Each test should be independent; no shared destructive cleanup
- **Isolate data**: Use unique user identities and scoped names to prevent collisions between parallel tests

### Selector Stability

- **Prefer ID selectors**: `#email`, `#password` (most stable)
- **Then data-testid**: `[data-testid="character-name"]` (explicit test selectors)
- **Avoid placeholders**: `input[placeholder*="Name"]` (fragile; breaks on text change)
- **Avoid type selectors**: `input[type="email"]` (fragile; multiple elements possible)

### Performance

- **Chromium CI budget**: The primary runtime target applies to the Chromium-specific CI path
- **Phase one goal**: Establish robust parallel execution first, then continue tuning toward the final runtime budget
- **Tune for CI**: 2 workers for GitHub Actions runners unless runtime or stability data suggests a safer setting
- **Timing evidence**: CI logs emit browser scope, worker count, and elapsed regression duration for each run

## Troubleshooting

### Tests hang or timeout

**Cause**: Dev server not running or not responding
**Fix**: Ensure `npm run dev` is running in another terminal:

```bash
npm run dev

# Should see: ready - started server on 0.0.0.0:3000

```

### "Browser is not installed"

**Cause**: Playwright browsers haven't been downloaded
**Fix**: Install browsers:

```bash
npx playwright install
```

### Tests fail locally but pass in CI

**Possible causes**:

- Dev server using different port
- Database connection issues (in helpers)
- Browser version differences

**Debug**: Run in headed mode to see what's happening:

```bash
npm run test:e2e:ui
```

Or collect trace for failed test:

```bash
npx playwright test --trace on
```

### Flaky tests

**Cause**: Relying on fixed timeouts or DOM timing

**Fix**:

- Replace hard sleeps with Playwright's built-in waits
- Use `waitForLoadState()` for network waits
- Use locator waits for DOM element readiness
- Use `waitForURL()` for navigation
- Add retries to `playwright.config.ts` for unreliable tests
- Check Network tab in devtools for slow/failing requests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright Debugging](https://playwright.dev/docs/debug)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Next Steps

Future improvements to the regression suite are tracked in GitHub issues:

### Phase 2: Character & Party Management (Issue #51)

- Add character creation tests (≥5 tests)
- Add party creation tests (≥4 tests)
- Use fixtures: `characters.json`, `parties.json`
- Use helpers: `createCharacter()`, `createParty()`

### Phase 3a: Monster Import & Encounters (Issue #52)

- Add monster import tests (≥5 tests)
- Add encounter creation tests (≥3 tests)
- Use fixtures: `import-monster-variants.json`
- Use helpers: `importMonster()`, `createEncounter()`

### Phase 3b: Combat Screen (Issue #53)

- Add combat screen initialization tests (≥3 tests)
- Add combat action execution tests (≥4 tests)
- Add combat UI interaction tests (≥3 tests)
- Use helpers: `openCombat()`, `verifyCombatScreenElements()`

### Other improvements

- Cross-browser validation: Ensure UI works across all browsers
- Mobile testing: Test on mobile viewports
- Visual regression: Compare screenshots across runs
- Performance monitoring: Track test duration trends
- Accessibility checks: Validate WCAG compliance
