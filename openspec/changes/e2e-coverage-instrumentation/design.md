## Context

The project runs three test suites in CI, each uploading LCOV coverage to Codacy as a partial report before a shared `finalize-coverage` job commits the combined result. Unit and integration tests already produce real coverage data. The regression-tests job has had a stub upload step since the CI was restructured, waiting for E2E instrumentation to be added.

`@bgotink/playwright-coverage` wraps the Playwright `test` function to hook into Chromium's V8 Coverage API, collecting per-file JS execution data across each test and aggregating it into standard report formats (LCOV, HTML, etc.) at the end of the run. The approach is transparent to individual spec files when the swap happens at the shared `fixtures.ts` re-export point.

Because the Next.js production build minifies and bundles JS by default, source maps are required for coverage to be attributed to source files rather than bundle artifacts. Source maps must be enabled only for the CI E2E build to avoid exposing source structure in production deployments.

## Goals / Non-Goals

**Goals:**
- Produce a valid `coverage-e2e/lcov.info` artifact from each Playwright run in CI
- Upload that artifact as a partial Codacy report so the finalize step sees all three test suites
- Keep spec files unchanged — the `fixtures.ts` seam absorbs the import swap
- Source maps active only in CI regression builds, not production

**Non-Goals:**
- Server-side coverage from E2E (API routes, DB calls run in Node — V8 browser coverage does not reach them)
- Changing browser scope for behavior testing (regression remains Chromium-only in CI for its own reasons)
- Local developer coverage workflow changes

## Decisions

### 1. `fixtures.ts` as the import swap point

Both spec files already import `test` from `./fixtures`. Swapping the upstream in `fixtures.ts` from `@playwright/test` to `@bgotink/playwright-coverage` requires one line change and zero spec file edits. If more spec files are added in future, they inherit coverage automatically.

### 2. `coverage-e2e/` output directory (not `coverage/`)

Unit and integration tests output to `coverage/lcov.info`. Using a distinct path for E2E avoids any ambiguity about which suite produced which artifact, makes the CI upload steps self-documenting, and future-proofs against running multiple suites in the same job.

### 3. Source maps via `GENERATE_SOURCE_MAPS` env var

`next.config.js` will gate `productionBrowserSourceMaps` on `process.env.GENERATE_SOURCE_MAPS === 'true'`. The regression-tests CI job sets this on its build step. No separate build script is needed, and the default (unset) remains source-map-off for all other contexts including `npm run build` locally and the deploy workflow.

### 4. `defineCoverageReporterConfig` wraps the existing `defineConfig`

The `@bgotink/playwright-coverage` API requires wrapping the Playwright config. The existing `defineConfig(...)` call becomes the inner argument. The coverage reporter config specifies LCOV format and `outputDirectory: 'coverage-e2e'`. HTML output can be added for local debugging if desired but is not required for CI.

### 5. No change to `finalize-coverage` job

The job already has `needs: [unit-tests, integration-tests, regression-tests]` and runs `if: always()`. Once the regression job produces a real partial upload, finalization automatically incorporates it — no structural CI changes needed beyond the regression job itself.

## Risks / Trade-offs

- **Playwright version compatibility**: `@bgotink/playwright-coverage` must match the installed `@playwright/test` version. Pin or check compatibility at install time.
- **Missing coverage-e2e/ on test skip**: If Playwright exits before any test completes (e.g., build failure, setup error), no `coverage-e2e/lcov.info` is written. The upload step already follows the pattern of other jobs (check file exists, log and skip if absent) — maintain that pattern.
- **Source map size in CI**: Enabling `productionBrowserSourceMaps` increases the Next.js build artifact size and build time slightly. Acceptable tradeoff for accurate coverage attribution.
- **V8 coverage and bundled code**: Some vendor/framework code bundled into the app's JS chunks may appear in coverage output. Codacy's file matching should naturally exclude files not in the repo tree, but this should be verified post-implementation.
