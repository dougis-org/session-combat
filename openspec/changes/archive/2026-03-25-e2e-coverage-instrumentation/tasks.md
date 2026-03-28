## 1. Install Dependency

- [x] 1.1 Install `@bgotink/playwright-coverage` as a devDependency, verifying it is compatible with the installed `@playwright/test` version (`^1.57.0`)

## 2. Source Map Configuration

- [x] 2.1 Update `next.config.js` to set `productionBrowserSourceMaps: process.env.GENERATE_SOURCE_MAPS === 'true'`

## 3. Playwright Coverage Integration

- [x] 3.1 Update `tests/e2e/fixtures.ts` to import `test` from `@bgotink/playwright-coverage` instead of `@playwright/test`
- [x] 3.2 Update `playwright.config.ts` to configure the `@bgotink/playwright-coverage` reporter to write LCOV output to `coverage-e2e/`

## 4. CI Updates

- [x] 4.1 Add `GENERATE_SOURCE_MAPS: 'true'` to the `env` block of the `Build application` step in the `regression-tests` job in `.github/workflows/build-test.yml`
- [x] 4.2 Update the `Upload E2E coverage to Codacy` step in the `regression-tests` job to check for `coverage-e2e/lcov.info` and upload with `--partial`, following the same pattern as unit and integration jobs

## 5. Verification

- [x] 5.1 Run `npm run test:regression` locally (or in CI) and confirm `coverage-e2e/lcov.info` is produced
- [x] 5.2 Confirm the CI `regression-tests` job uploads the partial report without error on a PR
