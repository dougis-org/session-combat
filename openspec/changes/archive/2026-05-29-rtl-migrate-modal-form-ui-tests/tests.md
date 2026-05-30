---
name: tests
description: Test cases for rtl-migrate-modal-form-ui-tests
---

# Tests

## Overview

This change IS the test migration — the "tests" are the migrated test files themselves. The TDD workflow here means: rewrite each test file in RTL, run it (it should pass immediately since the component behavior hasn't changed), and fix any failures before proceeding to the next file.

The verification command for each group of test cases is the same: `npm run test:unit -- --testPathPattern="<file>.test"`.

## Testing Steps (per file)

1. **Rewrite the file in RTL** — remove all legacy imports and patterns; write RTL equivalents.
2. **Run the tests** — they should pass immediately (behavior unchanged). If any fail, treat the failure as a red state and fix before proceeding.
3. **Run the full suite** — `npm run test:unit` — to verify no regressions.

## Test Cases

### File 1: `tests/unit/components/ui.test.tsx`

Mapped to: tasks.md → "File 1: Migrate ui.test.tsx" | spec: `specs/ui-primitives/spec.md`

- [x] `ErrorBanner` — renders nothing when `message` is null (RTL: `queryByText` / empty document)
- [x] `ErrorBanner` — renders message text when provided (`getByText`)
- [x] `ValidationError` — renders nothing when `message` is null
- [x] `ValidationError` — renders message text when provided
- [x] `LoadingState` — renders label text (`getByText`)
- [x] `FormField` — renders label text (`getByText`)
- [x] `FormField` — wires `htmlFor` to label so `getByLabelText` resolves
- [x] `FormField` — renders children
- [x] `EditorShell` — renders title as heading (`getByRole('heading')`)
- [x] `EditorShell` — save button shows `saveLabel` when `saving={false}` (`getByRole('button', {name: /save/i})`)
- [x] `EditorShell` — save button shows "Saving..." and is disabled when `saving={true}`
- [x] `EditorShell` — save button disabled when `canSave={false}`
- [x] `EditorShell` — cancel button disabled when `saving={true}`
- [x] `EditorShell` — clicking save button calls `onSave` (async `userEvent`)
- [x] `EditorShell` — clicking cancel button calls `onCancel` (async `userEvent`)
- [x] `EditorShell` — renders validation error text when `validationError` is set
- [x] `EditorShell` — renders children
- [x] `textInputClass` — returns expected CSS string (pure function, no RTL needed)
- [x] `TextInputField` — renders label text
- [x] `TextInputField` — `getByLabelText` resolves to the input (label `htmlFor` wired)
- [x] `TextInputField` — input has the provided `value`
- [x] `TextInputField` — typing calls `onChange` (`userEvent.type`)
- [x] `TextInputField` — `disabled={true}` disables the input
- [x] `TextInputField` — `placeholder` prop is reflected on the input
- [x] `TextInputField` — `id` prop wires both the input `id` and label `htmlFor`

### File 2: `tests/unit/components/TargetActionModal.test.tsx`

Mapped to: tasks.md → "File 2: Migrate TargetActionModal.test.tsx" | spec: `specs/target-action-modal/spec.md`

- [x] Initial screen — `getByText('Goblin Target')` present
- [x] Initial screen — "HP: 7/7" text visible
- [x] Initial screen — "AC: 13" text visible
- [x] Initial screen — "Apply Damage" button present (`getByRole('button', {name: /apply damage/i})`)
- [x] Initial screen — "Add Condition" button present
- [x] Initial screen — "Cancel" button present
- [x] Cancel — clicking Cancel calls `onClose` once
- [x] Damage flow — clicking "Apply Damage" removes initial buttons from DOM
- [x] Damage flow — damage amount input appears (`getByPlaceholderText('Damage amount')`)
- [x] Damage flow — damage type combobox appears (`getByRole('combobox', {name: /damage type/i})`)
- [x] Damage flow — typing "5" and selecting "fire" updates Apply button label to include "(fire)"
- [x] Damage flow — clicking Apply calls `onApplyDamage(5, 'fire')`
- [x] Damage flow — no type selected: clicking Apply calls `onApplyDamage(3, '')`
- [x] Condition flow — clicking "Add Condition" removes initial buttons from DOM
- [x] Condition flow — condition name input appears (`getByPlaceholderText('Condition name')`)
- [x] Condition flow — duration input appears (`getByPlaceholderText('Duration in rounds (optional)')`)
- [x] Condition flow — typing name + duration and clicking Add calls `onAddCondition('Stunned', 3)`
- [x] Condition flow — no duration: calls `onAddCondition('Blinded', undefined)`

### File 3: `tests/unit/components/CreatureStatsForm.test.tsx`

Mapped to: tasks.md → "File 3: Migrate CreatureStatsForm.test.tsx" | spec: `specs/creature-stats-form/spec.md`

- [x] Default render — no checkboxes present (`queryAllByRole('checkbox')` returns `[]`)
- [x] After expand — `getAllByRole('checkbox')` returns exactly 39 elements
- [x] After expand with no resistances — all 39 checkboxes are unchecked
- [x] Pre-selected resistances — exactly 2 checkboxes are checked across the form
- [x] Pre-selected resistances — "fire" checkbox is checked within "Damage Resistances" section (`within()`)
- [x] Pre-selected resistances — "cold" checkbox is checked within "Damage Resistances" section
- [x] Toggle resistance on — clicking unchecked "fire" in Damage Resistances calls `onChange` with `damageResistances` containing `'fire'`
- [x] Toggle resistance off — clicking checked "fire" calls `onChange` with `damageResistances` falsy
- [x] Toggle immunity on — clicking "poison" in Damage Immunities calls `onChange` with `damageImmunities` containing `'poison'`
- [x] Remove last vulnerability — clicking "cold" in Damage Vulnerabilities calls `onChange` with `damageVulnerabilities === undefined`

### Cleanup: `tests/unit/helpers/reactRoot.ts`

Mapped to: tasks.md → "Cleanup: Delete reactRoot.ts helper if unused"

- [x] `grep -r "reactRoot" tests/` returns no matches after migration (conditional — only if #260 is also complete)
- [x] If deleted: `npm run test:unit` still passes with no import errors
