---
name: tests
description: Verification plan for the rtl-migrate-page-tests migration
---

# Tests

## Overview

This change is a test-file refactor — no new production behavior is added, only the test implementation changes. The TDD workflow here means: run existing tests before migration (they pass), migrate the file, run again (they must still pass with zero new warnings). The "failing test" phase is implicit — if the migration is wrong, the existing test cases will fail.

Each migration task maps to a verification command. All commands must be run in the project root.

## Testing Steps

For each file migration:

1. **Baseline (before migrating):** Run the file's tests and record the passing count.
2. **Migrate:** Apply all RTL pattern changes from `tasks.md`.
3. **Verify (after migrating):** Run the file's tests — same count must pass, zero `act()` warnings.
4. **Grep check:** Confirm no old-pattern imports or globals remain.

## Test Cases

### SessionsPage.test.tsx

- [ ] **Baseline:** `npm run test:unit -- --testPathPattern="SessionsPage" --verbose` — note passing count
- [ ] **Post-migration:** `npm run test:unit -- --testPathPattern="SessionsPage" --verbose` — same count passes, zero act() warnings
  - Spec: `specs/sessions-page.md` → Scenario: Component renders without old boilerplate
  - Spec: `specs/sessions-page.md` → Scenario: Test count unchanged
- [ ] **Grep check:** `grep -n "createRoot\|IS_REACT_ACT\|@jest-environment" tests/unit/components/SessionsPage.test.tsx` returns no matches
  - Spec: `specs/sessions-page.md` → Scenario: Component renders without old boilerplate
- [ ] **Button query check:** Confirm "New Session" button test uses `screen.getByRole('button', { name: /new session/i })`
  - Spec: `specs/sessions-page.md` → Scenario: Button queries use role
- [ ] **Text assertion check:** Confirm session data assertions use `screen.getByText(...)` + `.toBeInTheDocument()`
  - Spec: `specs/sessions-page.md` → Scenario: Text assertions use screen matchers
- [ ] **Click check:** Confirm all click interactions use `await userEvent.click(...)`
  - Spec: `specs/sessions-page.md` → Scenario: Button click uses userEvent

### PartiesPage.test.tsx

- [ ] **Baseline:** `npm run test:unit -- --testPathPattern="PartiesPage" --verbose` — note passing count
- [ ] **Post-migration:** `npm run test:unit -- --testPathPattern="PartiesPage" --verbose` — same count passes, zero act() warnings
  - Spec: `specs/parties-page.md` → Scenario: Component renders without old boilerplate
  - Spec: `specs/parties-page.md` → Scenario: Test count unchanged
- [ ] **Grep check:** `grep -n "createRoot\|IS_REACT_ACT\|@jest-environment\|setupUiTest" tests/unit/components/PartiesPage.test.tsx` returns no matches
- [ ] **aria-label element count check:** The `getAllBy` RTL query returns the same number of elements as the old `querySelectorAll('[aria-label^="Member section:"]')` for the same fixture
  - Spec: `specs/parties-page.md` → Scenario: Element count from aria-label query preserved
- [ ] **Text assertion check:** Member name assertions use `screen.getByText(...)`
  - Spec: `specs/parties-page.md` → Scenario: Text content assertions use screen matchers

### CampaignsPage.test.tsx

- [ ] **Baseline:** `npm run test:unit -- --testPathPattern="CampaignsPage" --verbose` — note passing count
- [ ] **Post-migration:** `npm run test:unit -- --testPathPattern="CampaignsPage" --verbose` — same count passes, zero act() warnings
  - Spec: `specs/campaigns-page.md` → Scenario: Component renders without old boilerplate
  - Spec: `specs/campaigns-page.md` → Scenario: Test count unchanged
- [ ] **Grep check:** `grep -n "createRoot\|IS_REACT_ACT\|@jest-environment" tests/unit/components/CampaignsPage.test.tsx` returns no matches
- [ ] **Async fetch test check:** Tests that wait for fetched content use `await screen.findByText(...)` — no nested `act()` chains
  - Spec: `specs/campaigns-page.md` → Scenario: Async fetch tests use findBy
- [ ] **Loading state check:** "Copying..." button test uses `await screen.findByRole('button', { name: /copying/i })`
  - Spec: `specs/campaigns-page.md` → Scenario: Loading state test
- [ ] **Negative assertion check:** `not.toContain` patterns replaced with `queryByText` + `.not.toBeInTheDocument()`
  - Spec: `specs/campaigns-page.md` → Scenario: Negative text assertions use queryBy
- [ ] **Button query check:** "Copy" button found via `screen.getByRole('button', { name: /copy/i })`
  - Spec: `specs/campaigns-page.md` → Scenario: Button queries use role

### Full suite regression

- [ ] **Full unit suite:** `npm run test:unit` — all tests pass (not just the three migrated files)
  - Confirms no regressions in files that still use `uiTestSetup.ts`
- [ ] **Type check:** `npx tsc --noEmit` — no type errors
- [ ] **Build:** `npm run build` — succeeds with no errors
- [ ] **Reliability (async):** Run `npm run test:unit -- --testPathPattern="CampaignsPage"` three times; all runs pass (no flaky timeouts)
  - Spec: `specs/campaigns-page.md` → Non-Functional: Async tests are not flaky
