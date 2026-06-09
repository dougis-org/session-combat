---
name: tests
description: Tests for the migrate-toast-to-shared-component change
---

# Tests

## Overview

Test coverage for migrating inline toast implementations in `useCombat`, `ActiveCombatView`, and `QuickCombatantModal` to the shared `useToast()` + `<Toast>` from `lib/components/Toast.tsx`.

All work follows TDD: write a failing test → implement → pass → refactor.

Spec reference: `openspec/changes/migrate-toast-to-shared-component/specs/toast-migration/spec.md`

---

## Test Cases

### Task 1 + Task 2 — `useCombat` and `ActiveCombatView`

Test file: `tests/unit/components/ActiveCombatView.test.tsx`
Fixture: `tests/unit/fixtures/useCombat.ts`

- [ ] **TC-1: `ActiveCombatView` renders `role="status"` element when toast is set**
  - Spec scenario: "Toast is shown when toast state is set"
  - Setup: render `ActiveCombatView` with `makeCombat({ combatState: makeCombatState(), toast: { type: 'success', message: 'Combat saved!' } })`
  - Assert: `screen.getByRole('status')` contains text `'Combat saved!'`
  - TDD: test already exists (line 38–39 in `ActiveCombatView.test.tsx`); confirm it still passes after replacing the inline div with `<Toast>`

- [ ] **TC-2: `ActiveCombatView` shows no toast when `toast` is null**
  - Spec scenario: "No toast shown when toast is null"
  - Setup: render with `toast: null`
  - Assert: `screen.queryByRole('status')` is null
  - TDD: verify existing test coverage or add if absent

- [ ] **TC-3: `UseCombatReturn` fixture has `showToast`, not `setToast`**
  - Spec scenario: "`showToast` function is available on the combat hook return"
  - Setup: inspect `makeUseCombat()` return value
  - Assert: `result.showToast` is a function; `result.setToast` is undefined
  - TDD: update fixture (`setToast` → `showToast`); existing tests referencing `setToast` now fail → fix them

---

### Task 3 — `QuickCombatantModal`

Test file: `tests/unit/components/QuickCombatantModal.test.tsx`

- [ ] **TC-4: Toast shown after monster successfully added (default `enableToast`)**
  - Spec scenario: "Toast shown after monster added successfully"
  - Setup: render modal without `enableToast` prop; click "Add" on a monster
  - Assert: `screen.getByRole('status')` appears containing the monster name and "added successfully"
  - TDD: existing test at line 256 covers this; update `showToast` prop reference to `enableToast` if present

- [ ] **TC-5: Toast shown after character successfully added**
  - Spec scenario: "Toast shown after character added successfully"
  - Setup: render modal on characters tab; click "Add" on a character
  - Assert: `screen.getByRole('status')` appears with character name
  - TDD: existing test at line 335; update prop reference if needed

- [ ] **TC-6: No success toast when `enableToast={false}`**
  - Spec scenario: "Success toast suppressed when `enableToast` is false"
  - Setup: render modal with `enableToast={false}`; click "Add" on a monster
  - Assert: `screen.queryByRole('status')` is null (no success toast)
  - TDD: existing test at line 263 uses `showToast={false}`; rename prop to `enableToast={false}` — test fails before fix, passes after

- [ ] **TC-7: Error toast fires regardless of `enableToast`**
  - Spec scenario: "Toast shown on add error regardless of `enableToast`"
  - Setup: mock `onAddMonster` to throw; render with `enableToast={false}`; click "Add"
  - Assert: `screen.getByRole('status')` contains `'Failed to add monster'`
  - TDD: write this test if not already covered; it fails before the `setToast` → `showToast` migration, passes after

---

## Test Execution Commands

```bash
# Run unit tests
npm run test:unit

# Run only affected test files
npm run test:unit -- --testPathPattern="ActiveCombatView|QuickCombatantModal"

# Type check
npx tsc --noEmit
```

## Coverage Notes

- No new test files are needed — all cases map to existing test files
- The `Toast` component itself already has its own tests in `tests/unit/components/Toast.test.tsx`; no changes needed there
- `useToast()` timer behaviour (rapid-click stacking) is covered by `Toast.test.tsx`; no duplication needed here
