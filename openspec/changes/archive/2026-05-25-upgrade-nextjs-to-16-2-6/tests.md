---
name: tests
description: Tests for the Next.js 16.2.6 upgrade
---

# Tests

## Overview

This document outlines the validation tests for the `upgrade-nextjs-to-16-2-6` change. For a dependency upgrade, the "tests" are integration and verification tests run during the Execution and Validation phases in `tasks.md`. All validations are automated and run as part of the standard CI/CD pipeline.

## Testing Strategy

For a security patch upgrade with no application code changes:

1. **No new unit tests required** — existing 116 unit tests exercise all application behavior
2. **Validation is via existing test suites** — run all tests to detect any incompatibility
3. **Success criteria** — all tests pass, build succeeds, npm audit clean

Mapping to tasks in `tasks.md`:

| Task       | Validation Test                                     | Command                               | Expected Output          |
|------------|-----------------------------------------------------|---------------------------------------|--------------------------|
| T4         | npm audit clean (Next.js CVEs removed)             | `npm audit --omit=dev`              | 0 high/moderate Next.js  |
| T5         | TypeScript compilation succeeds                    | `npx tsc --noEmit`                   | Exit code 0              |
| T6         | ESLint linting passes                              | `npm run lint`                        | Exit code 0              |
| T7         | 116 unit tests pass                                | `npm run test:unit`                   | "116 passed"             |
| T8         | 23 integration tests pass                          | `npm run test:integration`            | "23 passed", exit code 0 |
| T9         | 11 E2E tests pass                                  | `npx playwright test tests/e2e/`      | "11 passed"              |
| T10        | Build completes without errors                     | `npm run build`                       | Exit code 0              |

## Test Cases

### T4 — npm audit Validation

- [ ] **Case: npm audit clean (Next.js)**
  - **Setup:** Run `npm install` after version bump
  - **Test:** Execute `npm audit --omit=dev` and parse output
  - **Assertion:** No entries for "next" in vulnerabilities section; all 13 pre-existing CVEs are gone
  - **Maps to:** Spec requirement "Security Vulnerabilities Resolved"

### T5 — TypeScript Compilation

- [ ] **Case: TypeScript compilation succeeds**
  - **Setup:** All dependencies installed, source code unchanged
  - **Test:** Execute `npx tsc --noEmit`
  - **Assertion:** Exit code is 0, no type errors in output
  - **Maps to:** Spec requirement "Build Validation"

### T6 — ESLint Linting

- [ ] **Case: ESLint passes with no new errors**
  - **Setup:** All dependencies installed, source code unchanged
  - **Test:** Execute `npm run lint`
  - **Assertion:** Exit code is 0, no new linting errors introduced by eslint-config-next upgrade
  - **Maps to:** Spec requirement "Build Validation"

### T7 — Unit Test Suite

- [ ] **Case: All 116 unit tests pass**
  - **Setup:** Next.js 16.2.6 installed, test environment initialized
  - **Test:** Execute `npm run test:unit`
  - **Assertion:** Exit code is 0, output includes "116 passed" or "PASS", coverage reports generated
  - **Maps to:** Spec requirement "Unit Test Suite Validation"

- [ ] **Case: No new test flakes introduced**
  - **Setup:** Unit tests passing once
  - **Test:** Execute `npm run test:unit` three times in succession
  - **Assertion:** All 116 tests pass consistently across all 3 runs (no intermittent failures)
  - **Maps to:** Spec requirement "Unit Test Suite Validation"

### T8 — Integration Test Suite

- [ ] **Case: All 23 integration tests pass with containers**
  - **Setup:** Docker/Testcontainers environment ready; MongoDB and PostgreSQL containers available
  - **Test:** Execute `npm run test:integration`
  - **Assertion:** Exit code is 0, output includes "23 passed" or test count matches expected, no container errors
  - **Maps to:** Spec requirement "Integration Test Suite Validation"

### T9 — E2E Test Suite

- [ ] **Case: All 11 E2E tests pass**
  - **Setup:** App runnable; Playwright configured; e2e test fixtures available
  - **Test:** Execute `npx playwright test tests/e2e/`
  - **Assertion:** Exit code is 0, output includes "11 passed", no timeout or connection errors
  - **Maps to:** Spec requirement "E2E Test Suite Validation"

### T10 — Build Validation

- [ ] **Case: Build completes without errors**
  - **Setup:** Next.js 16.2.6 installed, environment variables (MONGODB_URI, etc.) configured
  - **Test:** Execute `npm run build`
  - **Assertion:** Exit code is 0, `.next/` directory created with expected app router structure, no build errors in output
  - **Maps to:** Spec requirement "Build Validation"

- [ ] **Case: Build artifact is deployable**
  - **Setup:** Successful build completed
  - **Test:** Start the app with `npm start` (or `next start`) and make HTTP request to health endpoint
  - **Assertion:** App starts without errors, health check endpoint responds (HTTP 200), app listens on configured port
  - **Maps to:** Spec requirement "Build Validation (Non-Functional: Operability)"

## CI Pipeline Integration

All tests above are automated in `.github/workflows/build-test.yml`:

1. **Lint job** — runs T5 & T6 (TypeScript + ESLint)
2. **Unit tests job** — runs T7 (Jest unit suite)
3. **Integration tests job** — runs T8 (Jest integration suite with testcontainers)
4. **E2E tests job** — (implicit in CI; run manually with T9 command)
5. **Build job** — runs T10 (Next.js build)

No new tests are added to the CI pipeline; all validations use existing test infrastructure. The upgrade is complete when all existing tests pass.

## Manual Verification Checklist

Before opening the PR, verify locally:

- [ ] `npm audit --omit=dev` shows zero Next.js CVEs
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
- [ ] `npm run test:unit` passes (116 tests)
- [ ] `npm run test:integration` passes (23 tests)
- [ ] `npx playwright test tests/e2e/` passes (11 tests)
- [ ] `npm run build` succeeds
