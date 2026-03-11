## Why

The CI pipeline currently runs integration and E2E regression tests but omits unit tests and does not report any code coverage to Codacy, leaving the project without visibility into overall test quality. Adding unit tests and combined coverage reporting closes this gap and gives the team actionable quality data on every push and pull request.

## What Changes

- Rename `.github/workflows/integration-tests.yml` → `.github/workflows/build-test.yml` (and rename the workflow display name to "Build & Test")
- Add a `unit-tests` job to the workflow that runs `jest` using the default `jest.config.js` with coverage enabled
- Add a coverage upload step (using the Codacy coverage reporter shell script) to each test job — unit, integration, and E2E — using `--partial` uploads and a final `final` call
- Add a `test:unit` npm script to `package.json` for running unit tests with coverage (e.g. `jest --coverage`)

## Capabilities

### New Capabilities
- `ci-build-test`: Unified CI workflow (build-test.yml) that runs unit tests, integration tests, and Playwright E2E regression tests, then reports combined LCOV coverage to Codacy

### Modified Capabilities
<!-- No existing spec-level behavior is changing -->

## Impact

- `.github/workflows/integration-tests.yml` — replaced by `build-test.yml`
- `package.json` — new `test:unit` script added
- Requires `CODACY_API_TOKEN` secret to be set in the GitHub repository settings (already present per issue)
- Codacy project name: `session-combat` under org `dougis-org`
