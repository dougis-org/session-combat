---
name: tests
description: Tests for the jest-env-boilerplate-cleanup change
---

# Tests

## Overview

This change is a pure dead-code removal with no behavioral changes. There are no new functions, modules, or logic to unit-test. Verification is done via grep assertions and the existing test suite.

This is a case where TDD is inverted: the "tests" are the existing suite passing after removal, plus shell assertions confirming the boilerplate is gone.

## Testing Steps

Since this is mechanical cleanup with no new code, each verification step replaces the traditional "write a failing test → pass → refactor" cycle:

1. **Assert boilerplate exists (pre-condition):** Confirm grep finds the patterns before removal.
2. **Apply removal (implementation):** Remove the docblocks and IS_REACT_ACT_ENVIRONMENT lines.
3. **Assert boilerplate gone (post-condition):** Confirm grep finds no matches after removal.
4. **Assert test suite still passes:** Run `npm test` to confirm no regressions.

## Test Cases

### Removal of @jest-environment jsdom docblocks

- [ ] **Pre-condition:** `grep -r "@jest-environment jsdom" tests/ tests/unit/helpers/reactRoot.ts` returns ≥ 1 match before cleanup
- [ ] **Post-condition:** `grep -r "@jest-environment jsdom" tests/` returns 0 matches after cleanup
  - Maps to: tasks.md "Remove @jest-environment jsdom docblocks"
  - Maps to: specs/cleanup.md Scenario "No per-file jest-environment docblocks remain"

### Removal of per-file IS_REACT_ACT_ENVIRONMENT assignments

- [ ] **Pre-condition:** `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/` returns ≥ 1 match before cleanup
- [ ] **Post-condition:** `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/` returns 0 matches after cleanup
  - Maps to: tasks.md "Remove per-file IS_REACT_ACT_ENVIRONMENT assignments"
  - Maps to: specs/cleanup.md Scenario "No per-file IS_REACT_ACT_ENVIRONMENT assignments remain"

### jest.setup.ts global assignment preserved

- [ ] `grep "IS_REACT_ACT_ENVIRONMENT" jest.setup.ts` returns exactly 1 match after cleanup
  - Maps to: specs/cleanup.md Scenario "jest.setup.ts retains global IS_REACT_ACT_ENVIRONMENT"

### jest.config.js global environment preserved

- [ ] `grep "testEnvironment" jest.config.js` returns `testEnvironment: "jsdom"` after cleanup
  - Maps to: specs/cleanup.md Scenario "jest.config.js retains testEnvironment: jsdom"

### Full test suite regression check

- [ ] `npm test` exits with code 0 after all cleanup is applied
  - Maps to: tasks.md Validation step "Run npm test"
  - Maps to: specs/cleanup.md Scenario "Full test suite passes after cleanup"
