---
name: tests
description: Tests for the extract-monster-stat-editor change
---

# Tests

## Overview

Test plan for the `extract-monster-stat-editor` change. All work follows strict TDD: write a failing test, make it pass, then refactor.

Test files:
- `tests/unit/components/MonsterStatEditor.test.tsx` — new
- `tests/unit/components/MonsterEditor.test.tsx` — updated
- `tests/unit/components/MonsterTemplateEditor.test.tsx` — updated

All tests run via `npm run test:unit`. Use RTL (`render`, `screen`) and `userEvent.setup()` instance pattern.

## Test Cases

### Task 1 — MonsterEditableFields type (lib/types.ts)

- [ ] **Type assignability: Monster → MonsterEditableFields** — Compile-only check; `tsc --noEmit` must pass with a `Monster` value used as `MonsterEditableFields`
  - Spec: ADDED MonsterEditableFields type / "Monster is assignable to MonsterEditableFields"
- [ ] **Type assignability: MonsterTemplate → MonsterEditableFields** — Compile-only check; `tsc --noEmit` must pass with a `MonsterTemplate` value used as `MonsterEditableFields`
  - Spec: ADDED MonsterEditableFields type / "MonsterTemplate is assignable to MonsterEditableFields"

### Task 2 — MonsterStatEditor component (tests/unit/components/MonsterStatEditor.test.tsx)

- [ ] **Renders all header fields** — Mount `MonsterStatEditor` with a `MonsterEditableFields` value; assert inputs for name, size, type, speed, challengeRating, source, description are in the DOM; assert alignment selector is present
  - Spec: ADDED MonsterStatEditor / "Renders all header fields"
- [ ] **Renders CreatureStatsForm** — Mock `CreatureStatsForm`; mount `MonsterStatEditor`; assert the mock is called with `stats` matching the `CreatureStats` portion of the value
  - Spec: ADDED MonsterStatEditor / "Renders the stat block form"
- [ ] **Header field change calls onChange** — Mount with an `onChange` spy; change the name input; assert `onChange` is called with a `MonsterEditableFields` object containing the updated name
  - Spec: ADDED MonsterStatEditor / "Header field change propagates via onChange"
- [ ] **Stat block change calls onChange** — Mock `CreatureStatsForm`; capture its `onChange` prop; invoke it with updated stats; assert outer `onChange` is called with a merged `MonsterEditableFields`
  - Spec: ADDED MonsterStatEditor / "Stat block change propagates via onChange"

### Task 3 — MonsterEditor refactor (tests/unit/components/MonsterEditor.test.tsx)

- [ ] **Full stat block rendered** — Mock `MonsterStatEditor`; mount `MonsterEditor` with a `Monster`; assert `MonsterStatEditor` is rendered (not the old 5-field inputs)
  - Spec: MODIFIED MonsterEditor / "Full stat block is present"
- [ ] **onSave receives merged Monster** — Mount with an `onSave` spy and a `Monster`; simulate a field change via `MonsterStatEditor`'s `onChange`; click Save; assert `onSave` receives a `Monster` with the updated field merged onto the original
  - Spec: MODIFIED MonsterEditor / "Save callback receives fully merged Monster"
- [ ] **Cancel fires onCancel** — Mount with an `onCancel` spy; click Cancel; assert `onCancel` is called once
  - Spec: MODIFIED MonsterEditor / "Cancel fires onCancel"

### Task 4 — MonsterTemplateEditor refactor (tests/unit/components/MonsterTemplateEditor.test.tsx)

- [ ] **MonsterStatEditor receives correct value** — Mock `MonsterStatEditor`; mount `MonsterTemplateEditor` with a `MonsterTemplate`; assert `MonsterStatEditor` receives `value` equal to the editable fields of the template
  - Spec: MODIFIED MonsterTemplateEditor / "MonsterStatEditor receives correct value"
- [ ] **Validation error on empty name** — Simulate clearing name via `MonsterStatEditor`'s `onChange`; click Save; assert validation error message is shown and `fetch` is not called
  - Spec: MODIFIED MonsterTemplateEditor / "Validation error shown on empty name"
- [ ] **Async save calls fetch and fires onSave** — Mock `fetch` to resolve successfully; mount with an `onSave` spy; click Save; assert `fetch` is called with the correct endpoint and body; assert `onSave` is called
  - Spec: MODIFIED MonsterTemplateEditor / "Async save calls API and fires onSave"
- [ ] **isGlobal styling applied** — Mount with `isGlobal={true}`; assert the global styling indicator element is in the DOM
  - Spec: MODIFIED MonsterTemplateEditor / "isGlobal styling applied"
- [ ] **isNew shows Create label** — Mount with `isNew={true}`; assert the save button text is "Create"
  - Spec: MODIFIED MonsterTemplateEditor / "isNew shows Create button label"
- [ ] **Not isNew shows Save label** — Mount with `isNew={false}`; assert the save button text is "Save"
  - Spec: MODIFIED MonsterTemplateEditor / "Not isNew shows Save button label"
