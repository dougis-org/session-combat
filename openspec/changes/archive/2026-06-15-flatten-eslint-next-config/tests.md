---
name: tests
description: Tests for the flatten-eslint-next-config change
---

# Tests

## Overview

This document outlines the tests for the `flatten-eslint-next-config` change. This is a pure configuration refactor — no application code changes — so tests are verification commands rather than unit test files. Each test maps to a task in `tasks.md` and an acceptance scenario in `specs/eslint-config/spec.md`.

All work follows a strict TDD (Test-Driven Development) process: capture a failing baseline first (step 1), apply the change (step 2), then verify all checks pass (step 3).

## Testing Steps

### Phase 1 — Establish failing baseline (before any code changes)

These commands confirm the current broken state (Codacy fails) and capture a known-good local baseline to diff against after the change.

- [ ] **TC-1.1** Confirm `eslint-config-next` is currently imported: `grep 'eslint-config-next' eslint.config.mjs` — must match
  - Maps to: Task 3 (Rewrite eslint.config.mjs)
  - Spec scenario: Config loads in sandboxed environment

- [ ] **TC-1.2** Capture resolved-config baseline: `npx eslint --print-config src/app/page.tsx > /tmp/eslint-before.json`
  - Maps to: Task 1 (Capture pre-change ESLint baseline)
  - Spec scenario: Resolved config matches pre-change baseline

- [ ] **TC-1.3** Capture lint-findings baseline: `npx eslint . 2>&1 | tee /tmp/eslint-findings-before.txt`
  - Maps to: Task 1
  - Spec scenario: ESLint run produces no new findings

### Phase 2 — Implement the change (Tasks 2 & 3)

Write the change, then verify each test goes from fail → pass.

### Phase 3 — Verify all tests pass (after change)

- [ ] **TC-3.1** `eslint-config-next` import is gone: `grep 'eslint-config-next' eslint.config.mjs` — must produce no output
  - Maps to: Task 3
  - Spec scenario: Config loads in sandboxed environment

- [ ] **TC-3.2** All seven plugins are directly imported: `grep -E '@next/eslint-plugin-next|eslint-plugin-react|eslint-plugin-react-hooks|typescript-eslint|eslint-plugin-import|eslint-plugin-jsx-a11y|globals' eslint.config.mjs | wc -l` — must be ≥ 7
  - Maps to: Task 3
  - Spec scenario: Config loads in sandboxed environment

- [ ] **TC-3.3** `npm install` exits 0 after `package.json` changes: `npm install` — exit code must be 0
  - Maps to: Task 2 (Add direct devDependencies)
  - Spec scenario (NFAC): `npm install` succeeds after dependency changes

- [ ] **TC-3.4** Seven new deps appear in `package.json` devDependencies: `node -e "const d=require('./package.json').devDependencies; ['@next/eslint-plugin-next','eslint-plugin-react','eslint-plugin-react-hooks','typescript-eslint','eslint-plugin-import','eslint-plugin-jsx-a11y','globals'].forEach(p => console.log(p, d[p] || 'MISSING'))"` — all must show a version, none `MISSING`
  - Maps to: Task 2
  - Spec scenario (NFAC): `npm install` succeeds after dependency changes

- [ ] **TC-3.5** `eslint-config-next` is absent from `package.json` devDependencies: `node -e "console.log(require('./package.json').devDependencies['eslint-config-next'] || 'absent')"` — must print `absent`
  - Maps to: Task 2
  - Spec scenario: REMOVED — implicit dependency on eslint-config-next

- [ ] **TC-3.6** ESLint loads without missing-package error: `npx eslint . 2>&1 | grep -c 'Cannot find package\|MODULE_NOT_FOUND'` — must print `0`
  - Maps to: Task 3
  - Spec scenario: No missing-package error in local environment

- [ ] **TC-3.7** Resolved config is identical to baseline: `npx eslint --print-config src/app/page.tsx > /tmp/eslint-after.json && diff /tmp/eslint-before.json /tmp/eslint-after.json` — diff must be empty
  - Maps to: Task 4 (Validate against baseline)
  - Spec scenario: Resolved config matches pre-change baseline for a TS file

- [ ] **TC-3.8** No new lint findings introduced: `npx eslint . 2>&1 | tee /tmp/eslint-findings-after.txt && diff /tmp/eslint-findings-before.txt /tmp/eslint-findings-after.txt` — diff must be empty
  - Maps to: Task 4
  - Spec scenario: ESLint run produces no new findings

- [ ] **TC-3.9** Previously ignored paths are still ignored — `npx eslint coverage/` reports no files matched, same for `npx eslint .next/` and `npx eslint docs/`
  - Maps to: Task 4
  - Spec scenario: Previously ignored paths remain ignored

- [ ] **TC-3.10** `no-restricted-imports` rule is still active for test files: create a temp file `tests/tmp-lint-test.ts` containing `import {} from '@jest/globals';`, run `npx eslint tests/tmp-lint-test.ts`, confirm it reports the restriction error, then delete the temp file
  - Maps to: Task 3 (preserve existing rule)
  - Spec scenario: `no-restricted-imports` rule preserved for test files

- [ ] **TC-3.11** Build passes: `npm run build` — must exit 0
  - Maps to: Validation
  - Spec scenario (NFAC): Operability — `npm install` / build succeeds
