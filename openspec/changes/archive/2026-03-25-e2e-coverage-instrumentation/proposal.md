## Why

Codacy currently receives coverage from unit and integration tests only — the Playwright E2E suite exercises real browser flows but contributes zero to the coverage metric. This means CI gates can pass while entire client-side interaction paths have no coverage signal, and Codacy's view of the codebase is structurally incomplete.

## What Changes

- Install `@bgotink/playwright-coverage` as a dev dependency
- Swap the `test` import in `tests/e2e/fixtures.ts` from `@playwright/test` to `@bgotink/playwright-coverage` (zero spec files change)
- Configure `playwright.config.ts` to output LCOV coverage to `coverage-e2e/` via `defineCoverageReporterConfig`
- Enable production source maps in CI only via `GENERATE_SOURCE_MAPS` env var in `next.config.js` so coverage maps to source files rather than minified bundles
- Update the `regression-tests` CI job to set `GENERATE_SOURCE_MAPS: true` on its build step and upload `coverage-e2e/lcov.info` as a partial Codacy report
- The existing `finalize-coverage` job already waits on all three test jobs — no changes needed there

## Capabilities

### New Capabilities

- `e2e-coverage-instrumentation`: Browser-side JavaScript coverage collection from Playwright E2E tests via Chromium V8 coverage API, producing LCOV output for Codacy upload

### Modified Capabilities

- `ci-build-test`: The regression-tests job gains a real E2E coverage upload step (replacing the current no-op stub). The existing requirement "Playwright browser coverage is collected in a separate Chromium-only job" is fulfilled by this change — the regression-tests job already runs Chromium-only in CI.
- `coverage-improvement-plan`: E2E coverage is now an active contributor. The plan's requirement that "Existing E2E routes are credited through browser coverage" becomes satisfied.

## Impact

- **`package.json`**: New devDependency `@bgotink/playwright-coverage`
- **`tests/e2e/fixtures.ts`**: Import source change only
- **`playwright.config.ts`**: Wrapped with `defineCoverageReporterConfig`; adds LCOV reporter
- **`next.config.js`**: Adds `productionBrowserSourceMaps` gated on `GENERATE_SOURCE_MAPS` env var
- **`.github/workflows/build-test.yml`**: Regression build step gains `GENERATE_SOURCE_MAPS: true`; E2E coverage upload step updated to use `coverage-e2e/lcov.info`
- **Coverage scope**: Only browser-executed client-side JS is credited. Server-side code (`app/api/**`, MongoDB logic) is not covered by E2E instrumentation — that remains the domain of unit/integration tests.
- **CI time**: Negligible overhead; V8 coverage collection is built into Chromium

## Risks

- **Source map accuracy**: If Next.js bundles introduce source map gaps (e.g., inlined vendor code), some coverage lines may map to unexpected files. Acceptable — Codacy will simply show those as uncovered, not cause incorrect numbers.
- **`@bgotink/playwright-coverage` compatibility**: Must be version-compatible with the installed `@playwright/test` version (`^1.57.0`). Verify during install.
- **Coverage-e2e/ path in CI**: The `coverage-e2e/` directory must exist after Playwright runs before the upload step executes. The reporter creates it — but if no tests run (e.g., job skipped), the upload step must handle the missing file gracefully (already the pattern in other jobs).

## Non-Goals

- This does not add E2E coverage to the local dev workflow beyond what Playwright already provides
- This does not instrument server-side code (API routes, DB layer) via E2E tests
- This does not change which browsers the regression suite uses for behavior validation
- This does not modify the unit or integration coverage pipelines

## Open Questions

None — scope is fully defined from exploration.

---

*If scope changes after approval, proposal, design, specs, and tasks must be updated before apply proceeds.*
