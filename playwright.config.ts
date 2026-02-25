import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global.setup.ts",
  globalTeardown: "./tests/e2e/global.teardown.ts",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI: 2 retries for better flakiness tolerance */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: (() => {
    const value = process.env.REGRESSION_WORKERS;
    if (!value) return process.env.CI ? 1 : undefined;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      console.warn(
        `Invalid REGRESSION_WORKERS="${value}"; falling back to ${process.env.CI ? "1" : "undefined"}`,
      );
      return process.env.CI ? 1 : undefined;
    }
    return parsed;
  })(),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html"],
    ["list"], // Also output list format for CI logs
    ["json", { outputFile: "test-results.json" }],
  ],
  /* Timeout settings for better stability */
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for expect assertions
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Screenshot on failure for debugging */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: (() => {
    const allProjects = [
      {
        name: "chromium",
        use: { ...devices["Desktop Chrome"] },
      },

      {
        name: "firefox",
        use: { ...devices["Desktop Firefox"] },
      },

      {
        name: "webkit",
        use: { ...devices["Desktop Safari"] },
      },
    ];

    // Run only chromium for debugging
    if (process.env.CHROMIUM_ONLY) {
      console.log("✅ Running regression tests with chromium only");
      return allProjects.filter((p) => p.name === "chromium");
    }

    // In CI environment, run only webkit due to system dependency issues with chromium/firefox
    if (process.env.SKIP_CHROMIUM_FIREFOX) {
      console.log(
        "✅ Running regression tests with webkit only (chromium/firefox skipped)",
      );
      return allProjects.filter((p) => p.name === "webkit");
    }

    // Default: chromium + firefox. Webkit is deferred until Safari traffic
    // warrants the additional CI overhead and dependency complexity.
    // Enable webkit via CHROMIUM_ONLY=false (or remove this filter) when ready.
    console.log(
      "✅ Running regression tests with chromium + firefox (webkit deferred)",
    );
    return allProjects.filter((p) => p.name !== "webkit");
  })(),

  /* Test against mobile viewports. */
  // {
  //   name: 'Mobile Chrome',
  //   use: { ...devices['Pixel 5'] },
  // },
  // {
  //   name: 'Mobile Safari',
  //   use: { ...devices['iPhone 12'] },
  // },

  /* Test against branded browsers. */
  // {
  //   name: 'Microsoft Edge',
  //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
  // },
  // {
  //   name: 'Google Chrome',
  //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
  // },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
