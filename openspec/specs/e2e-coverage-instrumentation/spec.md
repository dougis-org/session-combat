# e2e-coverage-instrumentation Specification

## Purpose
Defines requirements for collecting browser-side JavaScript coverage from Playwright E2E tests via Chromium's V8 Coverage API and producing LCOV output for Codacy upload.

## Requirements

### Requirement: @bgotink/playwright-coverage is installed
The project SHALL include `@bgotink/playwright-coverage` as a dev dependency compatible with the installed `@playwright/test` version.

#### Scenario: Package is available
- **WHEN** a developer runs `npm ci`
- **THEN** `@bgotink/playwright-coverage` is installed and importable

### Requirement: E2E test import uses coverage-aware test function
The `tests/e2e/fixtures.ts` file SHALL import `test` from `@bgotink/playwright-coverage` instead of `@playwright/test`, so all spec files using the shared fixture automatically participate in coverage collection.

#### Scenario: Spec files unchanged
- **WHEN** a spec file imports `test` from `./fixtures`
- **THEN** coverage collection is active without any change to the spec file itself

### Requirement: Playwright config emits LCOV coverage to coverage-e2e/
The `playwright.config.ts` SHALL be wrapped with `defineCoverageReporterConfig` and configured to write LCOV output to the `coverage-e2e/` directory.

#### Scenario: LCOV file produced after test run
- **WHEN** the Playwright test suite completes with at least one test executed
- **THEN** the file `coverage-e2e/lcov.info` exists

#### Scenario: Output directory is distinct from Jest coverage
- **WHEN** both Jest and Playwright coverage are collected in the same job context
- **THEN** Playwright coverage writes to `coverage-e2e/` and Jest coverage writes to `coverage/`
- **AND** neither overwrites the other

### Requirement: Production source maps are enabled only in CI for the E2E build
The `next.config.js` SHALL enable `productionBrowserSourceMaps` only when the `GENERATE_SOURCE_MAPS` environment variable is set to `'true'`, so coverage data maps to source file lines rather than minified bundle output in CI, without exposing source maps in production deployments.

#### Scenario: Source maps enabled in CI
- **WHEN** the app is built with `GENERATE_SOURCE_MAPS=true`
- **THEN** the Next.js build produces source maps for browser JS bundles

#### Scenario: Source maps absent in production
- **WHEN** the app is built without `GENERATE_SOURCE_MAPS` set (or set to any value other than `'true'`)
- **THEN** the Next.js build does NOT produce browser source maps
