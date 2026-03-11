## 1. npm Script

- [x] 1.1 Add `test:unit` script to `package.json` that runs `jest --testPathPattern='tests/unit' --coverage` (scoped to unit tests only to avoid running integration tests without MongoDB)

## 2. Workflow File

- [x] 2.1 Create `.github/workflows/build-test.yml` with workflow name "Build & Test" and the same `on:` triggers as the current file
- [x] 2.2 Add `unit-tests` job to `build-test.yml` that checks out code, sets up Node 20, installs deps, runs `npm run test:unit`, and uploads coverage as a partial to Codacy
- [x] 2.3 Migrate existing `integration-tests` job into `build-test.yml`, adding a coverage upload step (partial) after tests run
- [x] 2.4 Migrate existing `regression-tests` job (Playwright/MongoDB) into `build-test.yml` with a conditional coverage upload step (partial, if `coverage/lcov.info` exists)
- [x] 2.5 Add `finalize-coverage` job to `build-test.yml` that depends on all three test jobs (`needs: [unit-tests, integration-tests, regression-tests]`), runs `if: always()`, and calls the Codacy reporter `final` command
- [x] 2.6 Delete `.github/workflows/integration-tests.yml`

## 3. Verification

- [x] 3.1 Confirm `npm run test:unit` runs successfully locally and produces `coverage/lcov.info`
- [ ] 3.2 Open a PR and confirm the `Build & Test` workflow appears in GitHub Actions with all four jobs (unit-tests, integration-tests, regression-tests, finalize-coverage)
- [ ] 3.3 Confirm Codacy shows combined coverage from the PR run
