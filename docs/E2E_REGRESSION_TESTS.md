# End-to-End Regression Tests with Playwright

This guide covers how to run and write Playwright-based end-to-end (E2E) regression tests for the session-combat application.

## Overview

**Playwright** is a modern testing framework for end-to-end testing of web applications. Our regression test suite validates critical user flows in parallel, ensuring UI consistency and behavior across releases.

## Why Playwright?

- **Real Browser Testing**: Tests run in real browsers (Chromium, Firefox, WebKit)
- **Parallel Execution**: Multiple tests run simultaneously for faster feedback
- **Reliable Waits**: Automatic waiting for elements and network conditions
- **Trace/Debug**: Built-in debugging and trace capabilities
- **Cross-Browser**: Single test suite runs against multiple browsers

## Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Version 7 or higher
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

```
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

This runs tests with 4 parallel workers by default. Control workers with the environment variable:

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

```
tests/
├── e2e/
│   ├── regression.spec.ts          # Main regression test suite
│   ├── registration.spec.ts        # Existing registration tests
│   ├── fixtures/
│   │   ├── users.json              # User test data (5 variants)
│   │   ├── characters.json         # Character templates
│   │   ├── parties.json            # Party templates
│   │   └── import-monster-variants.json
│   └── helpers/
│       ├── actions.ts              # Reusable UI actions
│       └── db.ts                   # Database test helpers (optional)
```

### Test Fixtures

Test data is provided in JSON format under `tests/e2e/fixtures/`:

#### users.json

5 variants for parametrized user tests:
- **3 happy-path variants**: Valid email + strong passwords
- **2 error-case variants**: Invalid email, weak password

```json
[
  {
    "email": "{{UUID}}@dougis.com",
    "password": "SecurePass123!",
    "variant": "happy_path_1"
  },
  {
    "email": "invalid-email",
    "password": "SecurePass123!",
    "variant": "error_invalid_email"
  }
]
```

UUID substitution happens at runtime via `generateUniqueEmail()`.

#### characters.json & parties.json

Provide test data for character and party creation flows:

```json
[
  {
    "name": "Aragorn",
    "class": "Fighter",
    "race": "Human"
  }
]
```

## Test Helpers

### `tests/e2e/helpers/actions.ts`

Reusable UI action functions:

```typescript
import {
  generateUniqueEmail,
  registerUser,
  loginUser,
  createCharacter,
  createParty,
  importMonster,
  createEncounter,
  openCombat
} from './helpers/actions';

// Generate unique email for registration
const email = generateUniqueEmail();

// Complete registration flow
await registerUser(page, email, password);

// Login
await loginUser(page, email, password);

// Create character
await createCharacter(page, { name: 'Aragorn', class: 'Fighter', race: 'Human' });
```

### `tests/e2e/helpers/db.ts` (Optional)

Database helpers for test cleanup (only used when `MONGODB_DB` environment variable is set):

```typescript
import { clearTestCollections, disconnectDB } from './helpers/db';

// Clear collections before test scenario
await clearTestCollections();

// Disconnect after tests
await disconnectDB();
```

## Regression Test Suite

### What Gets Tested

The regression suite (`tests/e2e/regression.spec.ts`) includes:

#### 1. Registration & Authentication (5 tests)
- ✅ Register with valid email + strong password (3 variants)
- ✅ Reject invalid email format
- ✅ Reject weak password
- ✅ Navigate to login page

#### 2. Navigation & UI (3 tests)
- ✅ Display loading state on register page
- ✅ Display required form fields
- ✅ Display password requirements

#### 3. Form Interaction (2 tests)
- ✅ Allow user to fill all fields correctly
- ✅ Verify submit button presence and label

**Total: 10+ parallel test scenarios**

### Test Categories

| Category | Count | Approach |
|----------|-------|----------|
| Reg & Auth | 5 | Data-driven with fixture variants |
| Navigation | 3 | Direct UI assertions |
| Forms | 2 | Form field interaction |
| **Total** | **10+** | **Parallel workers** |

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

In GitHub Actions, Playwright reports are uploaded as artifacts on failure:

```
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

- `REGRESSION_WORKERS` - Number of parallel workers (default: 4)
- `MONGODB_DB` - Test database name (set to `session-combat-e2e` in CI)
- `CI` - Set by GitHub Actions; triggers single worker + 2 retries

## Running in CI

Regression tests run automatically in GitHub Actions:

### Workflow: `.github/workflows/integration-tests.yml`

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run Playwright regression tests
  env:
    MONGODB_DB: session-combat-e2e
    REGRESSION_WORKERS: 4
  run: npm run test:regression

- name: Upload Playwright report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30
```

## Best Practices

### Writing Tests

1. **Use data-driven approach**: Load test data from JSON fixtures
2. **Generate unique identifiers**: Use `generateUniqueEmail()` for each test
3. **Wait for elements properly**: Use Playwright's auto-waiting; avoid fixed `waitForTimeout()`
4. **Clear cookies before each test**: Ensures test isolation
5. **Use specific selectors**: Prefer IDs, data-testid over flaky class names

### Reliability

- **Aim for <2% flakiness**: Repeat test runs to verify stability
- **Avoid hard sleeps**: Use `waitForURL()`, locator waits
- **Parallel safe**: Each test should be independent; no shared state
- **Isolate data**: Use unique emails, IDs to prevent collisions

### Performance

- **Default 4 workers**: Balances speed vs. resource usage
- **Tune for CI**: Adjust workers based on runner resources
- **Report generation**: HTML report builds as tests run

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
- Use Playwright's built-in waits instead of fixed `waitForTimeout()`
- Add retries for unreliable tests: `test.only(async () => { ... })`
- Check Network tab in devtools for slow/failing requests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test Configuration](https://playwright.dev/docs/test-configuration)
- [Playwright Debugging](https://playwright.dev/docs/debug)
- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Best Practices](https://playwright.dev/docs/best-practices)

## Next Steps

Future improvements to the regression suite:

1. **Add more flows**: Character creation, party management, monster import
2. **Cross-browser validation**: Ensure UI works across all browsers
3. **Mobile testing**: Test on mobile viewports
4. **Visual regression**: Compare screenshots across runs
5. **Performance monitoring**: Track test duration trends
6. **Accessibility checks**: Validate WCAG compliance
