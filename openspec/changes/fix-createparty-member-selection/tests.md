---
name: tests
description: Tests for the fix-createparty-member-selection change
---

# Tests

## Overview

This change is itself a test refactor — the "implementation" IS the tests. TDD here means:
1. Update the `createParty` signature (T1) — TypeScript compilation is the failing "test" until all callers are updated.
2. Update callers (T2, T3) — Playwright E2E tests are the failing tests until the new signature works end-to-end.
3. Add new tests (T4) — write the new member management tests first (they'll fail because `createParty` still has the old signature), then land T1 to make them pass.

## Testing Steps

Work through tasks in order: T1 → T2 → T3 → T4.

After T1, `npx tsc --noEmit` will report errors at every stale caller — these are the "failing tests" that drive T2 and T3.
After T2 and T3, all type errors are resolved and existing E2E tests should pass.
After T4, three new E2E tests are added; they should pass immediately since the helper is already correct.

## Test Cases

### T1 — `createParty` signature refactor

- [ ] **TC1.1** `npx tsc --noEmit` reports errors at all `memberCount` call sites after signature change (confirms old callers are caught)
- [ ] **TC1.2** After T2+T3 caller updates, `npx tsc --noEmit` reports zero errors
- [ ] **TC1.3** `npx playwright test tests/e2e/parties.spec.ts -g "create party"` — existing creation tests pass with `memberNames: []`

### T2 — `parties.spec.ts` existing callers

- [ ] **TC2.1** `npx playwright test tests/e2e/parties.spec.ts` — all existing tests pass after `memberCount: 0` → `memberNames: []` updates
- [ ] **TC2.2** "party with no members saves and shows 'Members: 0'" passes (confirms `memberNames: []` creates empty party)

### T3 — `combat.spec.ts` party tests

- [ ] **TC3.1** `npx playwright test tests/e2e/combat.spec.ts -g "user can create a party"` — passes and "Members: 4" visible
- [ ] **TC3.2** `npx playwright test tests/e2e/combat.spec.ts -g "party with different member counts"` — passes; "Members: 2" and "Members: 6" each visible
- [ ] **TC3.3** `npx playwright test tests/e2e/combat.spec.ts -g "complete end-to-end flow"` — passes with `memberNames: ["Thorin"]`
- [ ] **TC3.4** Verify parallel run safety: `npx playwright test tests/e2e/combat.spec.ts --workers=4` — all tests pass without cross-test interference

### T4 — New `"Party member management"` tests

- [ ] **TC4.1** "add a member to existing party increases member count" — "Members: 2" visible after adding `charB` to a party that had only `charA`
- [ ] **TC4.2** "remove a member from existing party decreases member count" — "Members: 1" visible after unchecking `charA` from a 2-member party
- [ ] **TC4.3** "party card shows correct member names after member changes" — `charB` visible, `charA` not visible after removal
- [ ] **TC4.4** `npx playwright test tests/e2e/parties.spec.ts -g "Party member management" --workers=4` — all 3 tests pass in parallel (thread-safety)

### Full regression

- [ ] **TC5.1** `npm run test:unit` — all unit tests pass (no regression from test-only change)
- [ ] **TC5.2** `npx playwright test tests/e2e/` — full E2E suite passes

## Spec Traceability

| Test Case | Task | Spec Scenario |
|-----------|------|---------------|
| TC1.2, TC1.3 | T1 | `createparty-helper/spec.md` — Members selected by name |
| TC2.2 | T2 | `createparty-helper/spec.md` — Empty member list |
| TC1.3 edge | T1 | `createparty-helper/spec.md` — Name not found fails loudly |
| TC3.1 | T3 | `combat-party-tests/spec.md` — Party created with 4 seeded members |
| TC3.2 | T3 | `combat-party-tests/spec.md` — Small/Large party scenarios |
| TC3.3 | T3 | `combat-party-tests/spec.md` — End-to-end flow |
| TC4.1 | T4 | `party-member-management-tests/spec.md` — Add member |
| TC4.2 | T4 | `party-member-management-tests/spec.md` — Remove member |
| TC4.3 | T4 | `party-member-management-tests/spec.md` — Names correct after changes |
| TC3.4, TC4.4 | T3, T4 | Both specs — Parallel test isolation |
