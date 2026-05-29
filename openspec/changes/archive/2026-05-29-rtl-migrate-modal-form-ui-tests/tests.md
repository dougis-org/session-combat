---
name: tests
description: Test cases for rtl-migrate-modal-form-ui-tests
---

# Tests

## Overview

This change IS the test migration — the "tests" are the migrated test files themselves. The TDD workflow here means: rewrite each test file in RTL, run it (it should pass immediately since the component behavior hasn't changed), and fix any failures before proceeding to the next file.

The verification command for each group of test cases is the same: `npm test -- --testPathPattern="<file>.test"`.

## Testing Steps (per file)

1. **Rewrite the file in RTL** — remove all legacy imports and patterns; write RTL equivalents.
2. **Run the tests** — they should pass immediately (behavior unchanged). If any fail, treat the failure as a red state and fix before proceeding.
3. **Run the full suite** — `npm test` — to verify no regressions.

## Test Cases

### File 1: `tests/unit/components/ui.test.tsx`

Mapped to: tasks.md → "File 1: Migrate ui.test.tsx" | spec: `specs/ui-primitives/spec.md`

- [ ] `ErrorBanner` — renders nothing when `message` is null (RTL: `queryByText` / empty document)
- [ ] `ErrorBanner` — renders message text when provided (`getByText`)
- [ ] `ValidationError` — renders nothing when `message` is null
- [ ] `ValidationError` — renders message text when provided
- [ ] `LoadingState` — renders label text (`getByText`)
- [ ] `FormField` — renders label text (`getByText`)
- [ ] `FormField` — wires `htmlFor` to label so `getByLabelText` resolves
- [ ] `FormField` — renders children
- [ ] `EditorShell` — renders title as heading (`getByRole('heading')`)
- [ ] `EditorShell` — save button shows `saveLabel` when `saving={false}` (`getByRole('button', {name: /save/i})`)
- [ ] `EditorShell` — save button shows "Saving..." and is disabled when `saving={true}`
- [ ] `EditorShell` — save button disabled when `canSave={false}`
- [ ] `EditorShell` — cancel button disabled when `saving={true}`
- [ ] `EditorShell` — clicking save button calls `onSave` (async `userEvent`)
- [ ] `EditorShell` — clicking cancel button calls `onCancel` (async `userEvent`)
- [ ] `EditorShell` — renders validation error text when `validationError` is set
- [ ] `EditorShell` — renders children
- [ ] `textInputClass` — returns expected CSS string (pure function, no RTL needed)
- [ ] `TextInputField` — renders label text
- [ ] `TextInputField` — `getByLabelText` resolves to the input (label `htmlFor` wired)
- [ ] `TextInputField` — input has the provided `value`
- [ ] `TextInputField` — typing calls `onChange` (`userEvent.type`)
- [ ] `TextInputField` — `disabled={true}` disables the input
- [ ] `TextInputField` — `placeholder` prop is reflected on the input
- [ ] `TextInputField` — `id` prop wires both the input `id` and label `htmlFor`

### File 2: `tests/unit/components/TargetActionModal.test.tsx`

Mapped to: tasks.md → "File 2: Migrate TargetActionModal.test.tsx" | spec: `specs/target-action-modal/spec.md`

- [ ] Initial screen — `getByText('Goblin Target')` present
- [ ] Initial screen — "HP: 7/7" text visible
- [ ] Initial screen — "AC: 13" text visible
- [ ] Initial screen — "Apply Damage" button present (`getByRole('button', {name: /apply damage/i})`)
- [ ] Initial screen — "Add Condition" button present
- [ ] Initial screen — "Cancel" button present
- [ ] Cancel — clicking Cancel calls `onClose` once
- [ ] Damage flow — clicking "Apply Damage" removes initial buttons from DOM
- [ ] Damage flow — damage amount input appears (`getByPlaceholderText('Damage amount')`)
- [ ] Damage flow — damage type combobox appears (`getByRole('combobox', {name: /damage type/i})`)
- [ ] Damage flow — typing "5" and selecting "fire" updates Apply button label to include "(fire)"
- [ ] Damage flow — clicking Apply calls `onApplyDamage(5, 'fire')`
- [ ] Damage flow — no type selected: clicking Apply calls `onApplyDamage(3, '')`
- [ ] Condition flow — clicking "Add Condition" removes initial buttons from DOM
- [ ] Condition flow — condition name input appears (`getByPlaceholderText('Condition name')`)
- [ ] Condition flow — duration input appears (`getByPlaceholderText('Duration in rounds (optional)')`)
- [ ] Condition flow — typing name + duration and clicking Add calls `onAddCondition('Stunned', 3)`
- [ ] Condition flow — no duration: calls `onAddCondition('Blinded', undefined)`

### File 3: `tests/unit/components/CreatureStatsForm.test.tsx`

Mapped to: tasks.md → "File 3: Migrate CreatureStatsForm.test.tsx" | spec: `specs/creature-stats-form/spec.md`

- [ ] Default render — no checkboxes present (`queryAllByRole('checkbox')` returns `[]`)
- [ ] After expand — `getAllByRole('checkbox')` returns exactly 39 elements
- [ ] After expand with no resistances — all 39 checkboxes are unchecked
- [ ] Pre-selected resistances — exactly 2 checkboxes are checked across the form
- [ ] Pre-selected resistances — "fire" checkbox is checked within "Damage Resistances" section (`within()`)
- [ ] Pre-selected resistances — "cold" checkbox is checked within "Damage Resistances" section
- [ ] Toggle resistance on — clicking unchecked "fire" in Damage Resistances calls `onChange` with `damageResistances` containing `'fire'`
- [ ] Toggle resistance off — clicking checked "fire" calls `onChange` with `damageResistances` falsy
- [ ] Toggle immunity on — clicking "poison" in Damage Immunities calls `onChange` with `damageImmunities` containing `'poison'`
- [ ] Remove last vulnerability — clicking "cold" in Damage Vulnerabilities calls `onChange` with `damageVulnerabilities === undefined`

### Cleanup: `tests/unit/helpers/reactRoot.ts`

Mapped to: tasks.md → "Cleanup: Delete reactRoot.ts helper if unused"

- [ ] `grep -r "reactRoot" tests/` returns no matches after migration (conditional — only if #260 is also complete)
- [ ] If deleted: `npm test` still passes with no import errors
