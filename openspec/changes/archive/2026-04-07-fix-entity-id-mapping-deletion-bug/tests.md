---
name: tests
description: Tests for the fix-entity-id-mapping-deletion-bug change
---

# Tests

## Overview

This change is a four-line fix in `lib/storage.ts`. The existing E2E suite provides the primary regression guard. All work follows TDD: confirm the test fails with the bug present, apply the fix, confirm the test passes.

## Testing Steps

For each test case:

1. **Write/confirm failing test** — run the test before the fix and verify it fails
2. **Apply the fix** — change the one line in the relevant loader
3. **Refactor** — update the comment on the same line for consistency
4. **Verify** — re-run the test and confirm it passes

## Test Cases

### Party Deletion (maps to `tasks.md` — TDD Phase)

- [ ] **E2E: Deleted party disappears from list (existing test, should fail before fix)**
  - File: `tests/e2e/parties.spec.ts`
  - Describe: `Party deletion`
  - Test: `deleted party disappears from list`
  - Run: `npx playwright test tests/e2e/parties.spec.ts --grep "Party deletion"`
  - Expected before fix: FAIL (party reappears after delete)
  - Expected after fix: PASS (party is absent after delete)
  - Maps to spec: `specs/party-deletion/spec.md` — Scenario: Confirmed deletion removes party from list
  - Maps to task: Fix `loadParties` in `lib/storage.ts:114`

- [ ] **E2E: Deleting one party does not remove others (existing multi-party coverage via isolation)**
  - Verified by: each E2E test creates isolated data via `createTestIdentity`; no cross-test interference expected
  - Maps to spec: `specs/party-deletion/spec.md` — Scenario: Deletion of one party does not affect other parties

- [ ] **E2E: Declining the dialog cancels deletion (existing dialog handling coverage)**
  - Verified by: the existing `page.once("dialog", ...)` pattern already confirms dialog interaction
  - No new test needed; dialog cancellation path is confirmed by absence of DELETE request

### Encounter Deletion (maps to `tasks.md` — Fix `loadEncounters`)

- [ ] **Manual smoke: Create encounter → delete → confirm gone**
  - No E2E automation for encounter deletion currently; manual verification acceptable per proposal
  - Steps: run `npm run dev`, create an encounter, delete it, hard-refresh, confirm absent
  - Maps to spec: `specs/encounter-deletion/spec.md` — Scenario: Confirmed deletion removes encounter

### Monster Template Deletion (maps to `tasks.md` — Fix `loadMonsterTemplates`)

- [ ] **Manual smoke: Create custom monster template → delete → confirm gone**
  - Steps: run `npm run dev`, create a custom monster template, delete it, hard-refresh, confirm absent
  - Maps to spec: `specs/monster-template-deletion/spec.md` — Scenario: Confirmed deletion removes user monster template

### Regression — Existing flows must be unaffected

- [ ] **E2E: Full suite passes after fix**
  - Run: `npx playwright test`
  - Expected: all previously passing tests continue to pass
  - This covers: party create, party edit, party member display, character regression tests, auth tests, combat tests

### Type Safety

- [ ] **Type check passes after fix**
  - Run: `npx tsc --noEmit`
  - Expected: no new type errors (the fix does not change types, only operand ordering)

### Build

- [ ] **Build succeeds after fix**
  - Run: `npm run build`
  - Expected: clean build with no errors

## TDD Red-Green-Refactor Summary

| Step | Action | Verification |
|------|--------|-------------|
| Red | Run E2E party deletion test before fix | Test fails — party reappears |
| Green | Apply fix to `lib/storage.ts` (4 lines) | Test passes — party absent |
| Refactor | Update loader comments for consistency | Comments match `loadCharacters` style |
| Full regression | Run `npx playwright test` | All tests pass |
