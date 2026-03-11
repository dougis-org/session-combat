## Context

The project uses GitHub Actions for CI with two existing jobs in `integration-tests.yml`:
1. `integration-tests` — builds the app and runs `jest.integration.config.js` (no coverage output)
2. `regression-tests` — runs Playwright E2E tests against a live MongoDB service

There is a default `jest.config.js` that covers all non-e2e tests (unit + integration in scope) and is configured with `collectCoverageFrom` pointing at `app/**` and `lib/**`. No unit test job exists in CI, and no coverage data is sent to Codacy today.

Codacy is already configured for the repo; the pattern for uploading coverage via the Codacy shell reporter is established in the sibling `cookbook-tanstack` project (see issue #70 for the reference snippet).

## Goals / Non-Goals

**Goals:**
- Rename workflow file and job names to `build-test` for clarity
- Add a `unit-tests` job that runs all Jest unit tests with LCOV coverage output
- Pipe LCOV coverage from unit, integration, and E2E jobs to Codacy using `--partial` uploads + `final`
- Add a `test:unit` npm script for local parity with CI

**Non-Goals:**
- Changing any test files, test configurations, or coverage collection rules
- Setting up Playwright coverage instrumentation (Playwright does not natively produce LCOV; E2E coverage upload is best-effort/conditional)
- Merging all test jobs into a single job (parallel jobs are better for CI speed)

## Decisions

### Decision: Three separate jobs, each uploading partial coverage
**Rationale**: Unit, integration, and E2E tests run in different environments (unit/integration need no service; E2E needs MongoDB + Playwright). Keeping them parallel preserves current CI speed. Each job uploads a partial coverage report; Codacy merges them server-side after the `final` call.

**Alternative considered**: A single sequential job — rejected because it serializes tests unnecessarily and increases total CI time.

### Decision: Codacy shell reporter (curl-based) over the GitHub Action
**Rationale**: The issue explicitly references the shell script approach (`curl -Ls https://coverage.codacy.com/get.sh`) as the approved pattern used in the sibling project. Using the same pattern keeps org-wide consistency and avoids pinning to a specific action version.

**Alternative considered**: `codacy/codacy-coverage-reporter-action` — rejected per the reference pattern in the issue.

### Decision: Upload `final` only from the last job (unit-tests)
**Rationale**: Codacy requires exactly one `final` call after all partials are uploaded. Since the jobs run in parallel, the `final` call must be sent after all partials arrive. We use a dedicated `finalize-coverage` job that depends on all test jobs, ensuring it only runs after all partials are uploaded.

### Decision: Add `test:unit` npm script using default `jest.config.js`
**Rationale**: The default `jest.config.js` already scopes to non-e2e tests with the right `collectCoverageFrom` settings. A simple `jest --coverage` invocation against it is sufficient — no new jest config file needed.

## Risks / Trade-offs

- **E2E coverage gap** → Playwright does not produce LCOV by default. The regression job will upload nothing or an empty report; Codacy will still show unit + integration coverage. Mitigation: skip the upload step gracefully if `coverage/lcov.info` does not exist.
- **Parallel partial uploads** → If jobs finish at different times, Codacy may process partials out of order. Mitigation: the `finalize-coverage` job only sends `final` after all upstream jobs complete, which is the correct Codacy usage pattern.
- **Secret availability** → `CODACY_API_TOKEN` must be present in the repo secrets. If absent, coverage upload fails silently (jobs still pass). Mitigation: document in the PR description.
