---
name: tests
description: Tests for the fix-lint-workflow change
---

# Tests

## Overview

This is a configuration and CI infrastructure change — there are no application unit tests to write. Validation is through command-line verification and file inspection. Each test case maps to a task in `tasks.md` and an acceptance scenario in the specs.

The TDD workflow here means: verify the _current_ state fails the criterion first (red), apply the change, then verify it passes (green).

## Test Cases

### Task 1 — Fix `eslint.config.mjs`

- [ ] **TC1.1 — Flat config loads without error**
  - Pre-condition (red): current `eslint.config.mjs` may error or produce warnings
  - Command: `npm ci && npm run lint`
  - Expected (green): exits 0, no "Cannot find flat config" or spread errors
  - Maps to: `specs/lint-config/spec.md` FR1 — "Clean run on a violation-free codebase"

- [ ] **TC1.2 — Build output is excluded**
  - Pre-condition: `.next/` directory exists from a build
  - Command: `npm run build && npm run lint 2>&1 | grep ".next"` — should return nothing
  - Expected: no lint output references `.next/` paths
  - Maps to: `specs/lint-config/spec.md` FR2 — "Build output is excluded from lint scope"

- [ ] **TC1.3 — Test files are included**
  - Pre-condition: introduce a deliberate violation in `tests/unit/` (e.g., `var x = 1` if `no-var` is enabled, or a console.log if configured)
  - Command: `npm run lint 2>&1 | grep "tests/"` — should report the violation
  - Expected: lint reports the violation in the test file
  - Revert the deliberate violation after confirming
  - Maps to: `specs/lint-config/spec.md` FR2 — "Test files are included in lint scope"

### Task 2 — Update lint script in `package.json`

- [ ] **TC2.1 — No `--ext` flag in lint output**
  - Pre-condition: `package.json` lint script still has `--ext`
  - Command: `npm run lint 2>&1 | grep "ext"` — before change, may show flag warning
  - Expected (green after change): no warning about `--ext`; `npm run lint` exits 0
  - Maps to: `specs/lint-config/spec.md` — MODIFIED lint script requirement

### Task 3 — Delete `.eslintrc.json`

- [ ] **TC3.1 — Legacy config file is absent**
  - Command: `ls .eslintrc* 2>&1`
  - Expected: "No such file or directory" or empty output — file does not exist
  - Maps to: `specs/lint-config/spec.md` — REMOVED legacy config requirement

### Task 4 — Add `lint` CI job to `build-test.yml`

- [ ] **TC4.1 — Lint job is present in workflow YAML**
  - Command: inspect `.github/workflows/build-test.yml` — look for `lint:` job definition with steps: checkout, setup-node, `npm ci`, `npm run lint`
  - Expected: all four steps present under the `lint` job
  - Maps to: `specs/ci-lint-gate/spec.md` FR1 — "Lint passes — test jobs proceed"

### Task 5 — Wire `needs: [lint]` onto test jobs

- [ ] **TC5.1 — `unit-tests` declares lint as prerequisite**
  - Command: inspect `.github/workflows/build-test.yml` — `unit-tests.needs` contains `lint`
  - Expected: `needs: [lint]` present on `unit-tests`
  - Maps to: `specs/ci-lint-gate/spec.md` — MODIFIED test job prerequisites

- [ ] **TC5.2 — `integration-tests` declares lint as prerequisite**
  - Command: inspect `.github/workflows/build-test.yml` — `integration-tests.needs` contains `lint`
  - Expected: `needs: [lint]` present on `integration-tests`
  - Maps to: `specs/ci-lint-gate/spec.md` — MODIFIED test job prerequisites

- [ ] **TC5.3 — `regression-tests` declares lint as prerequisite**
  - Command: inspect `.github/workflows/build-test.yml` — `regression-tests.needs` contains `lint`
  - Expected: `needs: [lint]` present on `regression-tests`
  - Maps to: `specs/ci-lint-gate/spec.md` — MODIFIED test job prerequisites

- [ ] **TC5.4 — `finalize-coverage` still needs all three test jobs (unchanged)**
  - Command: inspect `.github/workflows/build-test.yml` — `finalize-coverage.needs` still contains `unit-tests`, `integration-tests`, `regression-tests`
  - Expected: no regression in finalize-coverage dependencies
  - Maps to: design Decision 4 (finalize-coverage implicitly gated)

### Task 6 — Full end-to-end lint verification

- [ ] **TC6.1 — `npm run lint` exits 0 on a clean codebase**
  - Command: `npm ci && npm run lint`
  - Expected: exit code 0, no error output
  - Maps to: `specs/lint-config/spec.md` FR1 and NFR1

- [ ] **TC6.2 — CI lint job blocks test jobs on a lint violation (smoke test)**
  - Method: Push a branch with a deliberate lint violation; observe GitHub Actions
  - Expected: `lint` job fails; `unit-tests`, `integration-tests`, `regression-tests` show "skipped" or "waiting" and do not run
  - Revert the violation after confirming
  - Maps to: `specs/ci-lint-gate/spec.md` FR1 — "Lint fails — test jobs are blocked"
