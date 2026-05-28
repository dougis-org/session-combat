---
name: tests
description: Test plan for QuickCombatantModal unit test suite
---

# Tests

## Overview

All test cases live in `tests/unit/components/QuickCombatantModal.test.tsx`. This is a pure unit test change — no production code is modified. Because the test file IS the deliverable, the TDD cycle is: write test → run and confirm it fails (component behavior already exists) → confirm it passes with real component → verify coverage target met.

Each test maps to a `tasks.md` section and a spec scenario.

## Test Cases

### §1 — Render and navigation (`tasks.md §1`)

Spec: `specs/render-and-navigation.md`

- [ ] **Modal renders with monsters tab active** — `screen.getByRole('tab', { name: 'Monsters' })` has `aria-selected="true"`; Party Members and Create New have `aria-selected="false"`; heading "Add Combatant" is visible
- [ ] **Close button calls onClose** — `userEvent.click` the `aria-label="Close modal"` button; `onClose` called once
- [ ] **Backdrop click calls onClose** — `userEvent.click` the `role="dialog"` element directly; `onClose` called once
- [ ] **Inner modal click does NOT call onClose** — `userEvent.click` the inner card `div`; `onClose` not called
- [ ] **Switch to Party Members tab** — `userEvent.click('Party Members' tab)`; Party Members has `aria-selected="true"`, Monsters has `aria-selected="false"`
- [ ] **Switch to Create New tab** — `userEvent.click('Create New' tab)`; custom form "Add Combatant" submit button is visible
- [ ] **Tab switch resets search and filter** — type "Goblin", click "My" filter, then click Party Members tab; switch back to Monsters tab; search input is empty and "All" filter is active

### §2 — Monster tab states (`tasks.md §2`)

Spec: `specs/search-and-filter.md`

- [ ] **Loading state** — render with `loadingTemplates=true`; "Loading templates..." visible; search input absent
- [ ] **Empty templates** — render with `monsterTemplates=[]`; "No monster templates available" visible; "Create one" link present

### §3 — Monster search and filter (`tasks.md §3`)

Spec: `specs/search-and-filter.md`

- [ ] **All monsters visible initially** — Goblin, Orc, Troll all in document
- [ ] **Search filters to matching monster** — `userEvent.type` "Goblin" → Goblin visible, Orc and Troll absent
- [ ] **Clear search restores full list** — after searching "Goblin", `userEvent.clear` → all three visible
- [ ] **No-match search shows empty state** — type "zzznomatch" → "No monsters match your search and filter criteria" visible
- [ ] **"My" filter shows only user's monster** — click "My" button → Orc visible, Goblin and Troll absent
- [ ] **"Global" filter shows only global monster** — click "Global" button → Goblin visible, Orc and Troll absent
- [ ] **"Other" filter shows only shared monster** — click "Other" button → Troll visible, Goblin and Orc absent
- [ ] **"All" filter restores all** — click "Global", then "All" → Goblin, Orc, Troll all visible

### §4 — Monster selection (`tasks.md §4`)

Spec: `specs/selection.md`

- [ ] **Add calls onAddMonster with correct payload** — click `aria-label="Add Goblin to encounter"`; `onAddMonster` called with `{ id: 'test-uuid', templateId: 'g1', name: 'Goblin', ... }` (spread fields)
- [ ] **Success toast shown (showToast=true)** — toast "Goblin added successfully" visible after add
- [ ] **No toast when showToast=false** — render with `showToast=false`, click Add; no toast element rendered
- [ ] **Modal stays open after add** — heading "Add Combatant" still visible; `onClose` not called
- [ ] **(Global) badge** — Goblin row contains "(Global)" text
- [ ] **(Mine) badge** — Orc row contains "(Mine)" text
- [ ] **(Shared) badge** — Troll row contains "(Shared)" text

### §5 — Character tab (`tasks.md §5`)

Spec: `specs/search-and-filter.md`, `specs/selection.md`

- [ ] **Loading state on characters tab** — render `loadingTemplates=true`, switch to Party Members tab; "Loading characters..." visible
- [ ] **Empty characters** — render `characterTemplates=[]`, switch to Party Members tab; "No party members available" visible
- [ ] **Characters render when present** — switch to Party Members; "Aria" and "Bron" visible
- [ ] **Search filters characters** — type "Aria" → Aria visible, Bron absent
- [ ] **Add character calls onAddCharacter** — click `aria-label="Add Aria to combat"`; `onAddCharacter` called with Aria character object
- [ ] **Character add shows toast** — "Aria added successfully" visible after add

### §6 — Custom form (`tasks.md §6`)

Spec: `specs/custom-form.md`

- [ ] **Form fields render** — Name, Dexterity, AC, Max HP, Current HP, Initiative inputs and "Add Combatant" / "Cancel" buttons present
- [ ] **Happy path — no initiative** — fill Name="Dragon", leave Initiative blank, submit; `onAddMonster` called with payload without `initiative` key; `onClose` called
- [ ] **Happy path — initiative set** — fill Name="Dragon", set Initiative=18, submit; `onAddMonster` payload includes `{ initiative: 18 }`
- [ ] **Dexterity modifier display** — set Dexterity to 14; "+2" modifier text visible
- [ ] **Validation: empty name** — submit with blank Name; "Name is required" visible; `onAddMonster` not called
- [ ] **Validation: dexterity=0** — submit with Dexterity=0; dexterity range error visible; `onAddMonster` not called
- [ ] **Validation: dexterity=31** — submit with Dexterity=31; dexterity range error visible; `onAddMonster` not called
- [ ] **Validation: AC=0** — submit with AC=0; "AC must be at least 1" visible; `onAddMonster` not called
- [ ] **Validation: maxHp=0** — submit with Max HP=0; "Max HP must be at least 1" visible; `onAddMonster` not called
- [ ] **Validation: hp > maxHp** — submit with Max HP=10, Current HP=11; "Current HP must be between 0 and Max HP" visible; `onAddMonster` not called
- [ ] **Validation error clears on tab switch** — trigger "Name is required", switch to Monsters tab, switch back to Create New; error no longer visible
- [ ] **Cancel calls onClose** — click "Cancel"; `onClose` called once

## Coverage Target Verification

After all test cases pass, run:

```bash
npx jest --coverage \
  --collectCoverageFrom='lib/components/QuickCombatantModal.tsx' \
  tests/unit/components/QuickCombatantModal.test.tsx
```

Expected:
- Statement coverage: ≥ 70%
- Branch coverage: ≥ 55%

If below target, identify uncovered branches via the coverage report and add targeted tests before opening the PR.
