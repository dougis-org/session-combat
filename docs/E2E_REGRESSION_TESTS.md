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
│   │   ├── users.json              # User test data (Phase 2+)
│   │   ├── characters.json         # Character templates (Phase 2)
│   │   ├── parties.json            # Party templates (Phase 2)
│   │   └── import-monster-variants.json  # Monster variants (Phase 3a)
│   └── helpers/
│       ├── actions.ts              # Reusable UI actions
│       └── db.ts                   # Database test helpers (optional)
```

### Test Fixtures

Test data is provided in JSON format under `tests/e2e/fixtures/` for Phase 2 and 3 implementation:

#### users.json (Phase 2+)

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

#### characters.json & parties.json (Phase 2)

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

Reusable UI action functions (Phase 1 implemented, Phase 2+ functions prepared):

```typescript
import {
  generateUniqueEmail,
  registerUser,
  loginUser,
  createCharacter,        // Phase 2+
  createParty,            // Phase 2+
  importMonster,          // Phase 3a+
  createEncounter,        // Phase 3a+
  openCombat              // Phase 3b+
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

The regression suite (`tests/e2e/regression.spec.ts`) includes **31 parallel smoke tests** covering:

#### 1. Registration Page Tests (10 tests)
- ✅ Register page loads and displays form
- ✅ Register form has all required input fields
- ✅ Register form has submit button
- ✅ Email input accepts valid email format
- ✅ Password input accepts text input
- ✅ Confirm password input accepts text input
- ✅ Password requirements are displayed
- ✅ Password requirements update based on input
- ✅ Can link to login page from register
- ✅ Form is interactive and not stuck loading

#### 2. Login Page Tests (3 tests)
- ✅ Login page loads and displays form
- ✅ Login form has email and password fields
- ✅ Login form has submit button

#### 3. Navigation & Routing Tests (2 tests)
- ✅ Register and login pages are accessible
- ✅ Navigation does not produce console errors

#### 4. Form Interaction Tests (5 tests)
- ✅ Form fields can be filled and cleared
- ✅ Password inputs mask character entry
- ✅ Form shows/hides elements appropriately
- ✅ Page remains responsive after user input
- ✅ Page responds to rapid user input

#### 5. UI Consistency Tests (3 tests)
- ✅ Register page has consistent styling
- ✅ Form labels exist for accessibility
- ✅ Form elements are properly spaced and visible

#### 6. Edge Cases & Robustness Tests (7 tests)
- ✅ Can reload register page multiple times
- ✅ Can switch between register and login pages
- ✅ Back button navigation works
- ✅ Form inputs persist during page interactions
- ✅ Application loads without critical errors
- ✅ Form is interactive and not stuck loading
- ✅ Page responds to rapid user input

#### 7. Integration Sanity Checks (2 tests)
- ✅ Application loads without critical errors
- ✅ Form is interactive and not stuck loading

**Total: 31 parallel regression tests** covering registration, login, navigation, and form interaction flows (Phase 1).

### Test Categories

| Category | Count | Coverage | Approach |
|----------|-------|----------|----------|
| Registration page | 10 | Page load, form structure, field interaction | Smoke checks for form presence and input handling |
| Login page | 3 | Page load, fields, submit button | Direct UI assertions |
| Navigation | 2 | Page accessibility, routing, console errors | Navigation flow validation |
| Form interaction | 5 | Field fills/clears, input masking, responsiveness | Form field interaction testing |
| UI consistency | 3 | Styling, labels, element spacing | Accessibility and layout validation |
| Edge cases | 7 | Page reloading, switching, back button, persistence | Robustness under various user scenarios |
| Integration | 2 | Error detection, interactivity | Sanity checks for overall app health |
| **TOTAL** | **31** | **Core UI smoke coverage (Phase 1)** | **Parallel workers** |

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
    REGRESSION_WORKERS: 2
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

1. **Use data-driven approach**: Load test data from JSON fixtures (Phase 2+)
2. **Generate unique identifiers**: Use `generateUniqueEmail()` for each test
3. **Wait for elements properly**: Use Playwright's auto-waiting; avoid fixed `waitForTimeout()`
4. **Clear cookies before each test**: Ensures test isolation
5. **Use specific selectors**: Prefer IDs and `data-testid` attributes over flaky class names or placeholders

### Database Isolation

**Phase 1 (Registration & Login):**
- Tests achieve isolation through cookie clearing (`beforeEach` hook)
- Unique email generation prevents data collisions
- No database persistence required; tests interact with UI only

**Phase 2+ (Character, Party, Monster, Combat):**
- Optional DB cleanup via `clearTestCollections()` helper
- Can be called in `beforeEach()` or `afterEach()` hooks
- Security safeguard: Requires `MONGODB_DB` to contain 'test' or 'e2e' string
- Prevents accidental deletion from production databases

### Reliability

- **Aim for <2% flakiness**: Repeat test runs to verify stability
- **Avoid hard sleeps**: Use Playwright's auto-waiting (`waitForLoadState()`, locator waits, `waitForURL()`)
- **Handle flaky tests**: Configure retries in `playwright.config.ts`:
  ```typescript
  retries: process.env.CI ? 2 : 0,  // 2 retries in CI, 0 locally
  ```
- **Parallel safe**: Each test should be independent; no shared state
- **Isolate data**: Use unique emails, IDs to prevent collisions between parallel tests

### Selector Stability

- **Prefer ID selectors**: `#email`, `#password` (most stable)
- **Then data-testid**: `[data-testid="character-name"]` (explicit test selectors)
- **Avoid placeholders**: `input[placeholder*="Name"]` (fragile; breaks on text change)
- **Avoid type selectors**: `input[type="email"]` (fragile; multiple elements possible)

### Performance

- **Default 4 workers**: Balances speed vs. resource usage
- **Tune for CI**: 2 workers for GitHub Actions runners (resource constrained)
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
