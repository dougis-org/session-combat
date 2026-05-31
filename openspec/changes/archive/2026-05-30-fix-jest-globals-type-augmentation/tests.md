---
name: tests
description: Verification test plan for fix-jest-globals-type-augmentation
---

# Tests

## Overview

This change is a tooling/configuration fix — it adds no new application logic and modifies only test files, `jest.setup.ts`, ESLint config, and documentation. There are no new unit tests to write. Verification is done by running the existing suites and validating tool outputs at each step.

All steps follow a fail → fix → verify cycle consistent with TDD principles applied to configuration changes.

## Testing Steps

### Task 1 — jest.setup.ts patch

**Before (confirm the failure exists):**
- [ ] Run `npm run typecheck`
- [ ] Confirm ≥ 29 TS2339 errors across the 5 affected files

**After (confirm the fix works):**
- [ ] Run `npm run typecheck`
- [ ] Confirm 0 TS2339 errors in `AlignmentSelect.test.tsx`, `CreatureStatBlock.test.tsx`, `NavBar.test.tsx`, `TargetActionModal.test.tsx`, `ui.test.tsx`
- [ ] Spec scenario covered: "Typecheck passes with no jest-dom matcher errors"

---

### Task 2 — Remove @jest/globals imports

**Before (confirm state):**
- [ ] `grep -rl "from '@jest/globals'" tests/` — confirm the 5 files are listed

**After:**
- [ ] `grep -r "from '@jest/globals'" tests/` — confirm no output
- [ ] `npm run test:unit` — confirm exits 0, ≥ 1776 tests pass
- [ ] `npm run typecheck` — still 0 errors
- [ ] Spec scenario covered: "Previously failing file now typechecks cleanly"
- [ ] Spec scenario covered: "All unit tests pass after import stripping"

---

### Task 3 — ESLint gate

**Canary (confirm the rule fires):**
- [ ] Temporarily add `import { expect } from '@jest/globals'` to `tests/unit/components/NavBar.test.tsx`
- [ ] Run `npm run lint`
- [ ] Confirm ESLint exits non-zero with a `no-restricted-imports` error pointing at `NavBar.test.tsx`
- [ ] Revert the temporary change

**Clean state:**
- [ ] `npm run lint` — exits 0 on the clean codebase
- [ ] Spec scenario covered: "ESLint flags a @jest/globals import in a test file"
- [ ] Spec scenario covered: "ESLint passes when no @jest/globals imports exist"

---

### Task 4 — docs/TESTING.md

**Existence check:**
- [ ] `ls docs/TESTING.md` — file exists

**Content check (manual):**
- [ ] File contains sections: jest.setup.ts architecture, import convention, ESLint gate description, escape hatch, running tests
- [ ] Spec scenario covered: "New contributor reads TESTING.md and understands the pattern"

---

### Task 5 — CONTRIBUTING.md reference

**Content check:**
- [ ] `grep -i "TESTING.md" CONTRIBUTING.md` — returns a match
- [ ] Spec scenario covered: "CONTRIBUTING.md links to TESTING.md"

---

### Full suite regression (Task 6)

- [ ] `npm run typecheck` — exits 0
- [ ] `npm run test:unit` — exits 0, ≥ 1776 tests pass
- [ ] `npm run test:ci` — exits 0, 180 integration tests pass
- [ ] `npm run lint` — exits 0
- [ ] `npm run build` — exits 0
- [ ] `diff package.json` — no new dependencies
- [ ] Spec scenario covered: "package.json unchanged"

## Test Cases Summary

- [ ] Typecheck exits 0 after `jest.setup.ts` patch (Task 1)
- [ ] No `@jest/globals` imports remain in `tests/` (Task 2)
- [ ] Unit tests all pass after import stripping (Task 2)
- [ ] ESLint errors on `@jest/globals` import in test file (canary) (Task 3)
- [ ] ESLint passes on clean codebase (Task 3)
- [ ] `docs/TESTING.md` exists and covers all documented items (Task 4)
- [ ] `CONTRIBUTING.md` references `docs/TESTING.md` (Task 5)
- [ ] Full suite (typecheck + unit + integration + lint + build) green (Task 6)
