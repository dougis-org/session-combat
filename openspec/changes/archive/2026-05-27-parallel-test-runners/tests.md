---
name: tests
description: Tests for the parallel-test-runners change
---

# Tests

## Overview

This change is entirely configuration-driven (no new application logic). Tests are manual verification commands rather than new automated test cases. Each test maps to a task in `tasks.md` and a scenario in `specs/parallel-runners.md`.

## Testing Steps

For each task, verify behavior before and after the config change using the commands below.

---

## Test Cases

### Task 1 — jest.integration.config.js

- [ ] **TC-1.1 — Valid env var:** Run `INTEGRATION_WORKERS=4 npm run test:integration`. Verify Jest output shows `--maxWorkers=4` or equivalent multi-worker indicator. All tests pass.
  - Spec scenario: "Valid INTEGRATION_WORKERS value"

- [ ] **TC-1.2 — Invalid env var falls back gracefully:** Run `INTEGRATION_WORKERS=banana npm run test:integration`. Verify stderr contains `Invalid INTEGRATION_WORKERS="banana"; falling back to default` and tests still complete successfully.
  - Spec scenario: "Invalid INTEGRATION_WORKERS value"

- [ ] **TC-1.3 — No env var uses Jest default:** Run `npm run test:integration` with no `INTEGRATION_WORKERS` set. Verify tests run (no crash), no warning is printed, and Jest selects its own worker count.
  - Spec scenario: "INTEGRATION_WORKERS not set (local default)"

- [ ] **TC-1.4 — Escape hatch:** Run `INTEGRATION_WORKERS=1 npm run test:integration`. Verify sequential execution (equivalent to old behavior). All tests pass.

- [ ] **TC-1.5 — Parallel isolation check:** Run `INTEGRATION_WORKERS=4 npm run test:integration` three consecutive times. All three runs pass with no flaky failures.
  - Spec scenario: "Parallel integration tests remain data-isolated"

### Task 2 — playwright.config.ts

- [ ] **TC-2.1 — No env var uses Playwright default:** Run `npm run test:regression` without `REGRESSION_WORKERS` set. On a machine with ≥4 logical CPUs, Playwright should report using 2+ workers. All tests pass.
  - Spec scenario: "REGRESSION_WORKERS not set on local machine"

- [ ] **TC-2.2 — Escape hatch still works:** Run `REGRESSION_WORKERS=1 npm run test:regression`. Playwright uses exactly 1 worker. All tests pass.
  - Spec scenario: "REGRESSION_WORKERS explicitly set to 1"

- [ ] **TC-2.3 — Invalid env var falls back gracefully:** Run `REGRESSION_WORKERS=notanumber npm run test:regression`. Verify warning is printed and tests still run (existing behavior, unchanged by this task — confirm still works).

### Task 3 — .github/workflows/build-test.yml

- [ ] **TC-3.1 — Integration workers set in CI:** After pushing, CI `integration-tests` job log shows Jest running with 4 workers (visible in test output or timing).

- [ ] **TC-3.2 — Regression workers updated in CI:** After pushing, CI `regression-tests` job log shows line `Regression workers: 4` (logged by the existing `finish` trap).

- [ ] **TC-3.3 — All CI checks green:** Full CI run passes on the feature branch — lint, unit, integration, regression all green.
  - Spec scenario: "CI regression job"
