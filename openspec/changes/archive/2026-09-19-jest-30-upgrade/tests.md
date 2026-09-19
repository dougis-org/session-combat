---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `jest-30-upgrade` change. Because this change
is a dependency/config bump with no new application behavior, "TDD" here means: each
check below must demonstrably fail against the pre-upgrade repo state (red) and pass
only once the corresponding `tasks.md` step is complete (green). The project's existing
`tests/unit` and `tests/integration` suites serve as the regression net — they must
stay green throughout, per specs/test-infrastructure/spec.md.

## Testing Steps

For each task in `tasks.md`:

1.  **Confirm the check fails pre-upgrade (red):** run the verification command against `main` (pre-change) to confirm it currently fails or is inapplicable — e.g. `@swc/jest` is present, `--testPathPattern` is the flag in use.
2.  **Apply the task's change:** make the minimal `package.json`/`package-lock.json`/config edit described in `tasks.md`.
3.  **Confirm the check passes (green):** re-run the verification command and confirm it now passes.
4.  **Refactor/cleanup:** re-run the full `test:unit`/`test:integration`/`lint`/`typecheck` suite to confirm no regression, per the Validation section of `tasks.md`.

## Test Cases

### Dependency baseline (spec: MODIFIED Test Dependency Baseline)

- [ ] **Case 1 — Jest 30 line installed** (task: bump jest/jest-environment-jsdom/@types/jest): `npm ls jest jest-environment-jsdom @types/jest` shows versions `^30.x` for each. Red: pre-upgrade shows `29.x`. Green: post-upgrade shows `30.x`.
- [ ] **Case 2 — jest-dom 7.x installed** (task: bump @testing-library/jest-dom): `npm ls @testing-library/jest-dom` shows `^7.x`. Red: pre-upgrade shows `6.9.1`. Green: post-upgrade shows `7.x`.
- [ ] **Case 3 — install is clean** (task: `npm install`, scenario "Install upgraded dependencies without conflicts"): `npm ci` exits 0 with no unresolved peer-dependency errors referencing `jest` or `ts-jest`.
- [ ] **Case 4 — @swc/jest removed** (task: remove @swc/jest, scenario "Unused transform dependency removed"): `grep -c '"@swc/jest"' package.json package-lock.json` returns 0 for both files; `npm ls @swc/jest` exits non-zero ("not found"). Red: pre-upgrade `npm ls @swc/jest` resolves to `0.2.39` with no consumers. Green: post-upgrade it's absent.
- [ ] **Case 5 — ts-jest compatible** (task: conditionally bump ts-jest): if `npm install` reported a peer conflict, confirm the bumped `ts-jest` version resolves it (Case 3 passes); if no conflict was reported, confirm `ts-jest` version in `package.json` is unchanged from `^29.4.12`.

### Unit test script (spec: MODIFIED Unit Test Script Path Filtering)

- [ ] **Case 6 — test:unit uses plural flag** (task: rename `--testPathPattern` to `--testPathPatterns`): `grep -n "testPathPatterns" package.json` matches the `test:unit` script line; `grep -n "testPathPattern='"` (singular, exact) does not match. Red: pre-upgrade has the singular flag. Green: post-upgrade has the plural flag.
- [ ] **Case 7 — test:unit selects correct scope** (same task): `npm run test:unit -- --listTests` (or equivalent dry run) lists only files under `tests/unit`, matching the same file count/list as the pre-upgrade run modulo any test-file fixes from Case 9.

### Full suite regression (spec: scenarios "Existing unit/integration test suite passes under Jest 30")

- [ ] **Case 8 — unit suite green:** `npm run test:unit` exits 0 with all specs passing.
- [ ] **Case 9 — integration suite green:** `npm run test:integration` exits 0 with all specs passing.
- [ ] **Case 10 — no jsdom-breakage fixes touched application code:** `git diff --stat origin/main -- app lib` is empty. If Case 8 required jsdom-related fixes, confirm those fixes are confined to files under `tests/`.

### Non-functional checks

- [ ] **Case 11 — coverage output intact** (NFAC: Reliability): after `npm run test:unit`, `coverage/lcov.info` exists and is non-empty; after `npm run test:integration -- --coverage`, `coverage/lcov.info` exists and is non-empty.
- [ ] **Case 12 — lint and typecheck clean** (Gate, proposal.md): `npm run lint` and `npm run typecheck` both exit 0.
- [ ] **Case 13 — no application code changed** (NFAC: Operability): `git diff --name-only origin/main` contains only `package.json`, `package-lock.json`, and optionally `jest.config.js`/`jest.integration.config.js` — no paths under `app/` or `lib/`.
