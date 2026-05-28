---
name: tests
description: RTL test cases for LegendaryActionsPanel, LairActionsSlot, InitiativeEntry, CombatInfoIcon, and Modal coverage
---

# Tests

## Overview

All tests live in `tests/unit/components/` — one new file per component. All follow the PR 272 pattern: `@jest-environment jsdom`, Next.js mocks before imports, BASE fixture, `renderX(overrides)` helper, `userEvent.setup()` for interactions, `localStorage.clear()` in `beforeEach`.

Each task uses TDD: write a failing test first, make it pass against existing production code, then refactor for clarity.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Write the RTL test before anything else. Run `npm run test:unit -- --testPathPattern=<ComponentName>` and confirm it fails.
2. **Write code to pass:** Since this is test-only work, "implementation" means writing the test correctly to pass against existing production code. No production changes.
3. **Refactor:** Consolidate shared setup (fixtures, helpers) and remove duplication between test cases.

## Test Cases

### T1 — LegendaryActionsPanel (`tests/unit/components/LegendaryActionsPanel.test.tsx`)

- [x] `renders remaining count when legendaryActionsRemaining is 2` → spec: legendary-actions-panel renders remaining count (happy path)
- [x] `renders null when legendaryActions is empty` → spec: legendary-actions-panel returns null
- [x] `shows zero when legendaryActionsRemaining is 0` → spec: legendary-actions-panel zero state
- [x] `spend button click calls onUpdate with decremented remaining` → spec: legendary-actions-panel spend button
- [x] `spend at zero does not call onUpdate with negative remaining` → spec: legendary-actions-panel spend at zero
- [x] `Restore All button calls onUpdate with full count` → spec: legendary-actions-panel restore button

### T2 — LairActionsSlot (`tests/unit/components/LairActionsSlot.test.tsx`)

- [x] `inactive: renders combatant name` → spec: lair-actions-slot inactive pill shows name
- [x] `inactive: renders initiative` → spec: lair-actions-slot inactive pill shows initiative
- [x] `inactive: no Restore All button` → spec: lair-actions-slot inactive has no action buttons
- [x] `active: renders combatant name in expanded panel` → spec: lair-actions-slot active panel shows name
- [x] `active: lair-action-restore-all button present` → spec: lair-actions-slot active panel shows restore button
- [x] `active: Restore All click calls onUpdate with restored charges` → spec: lair-actions-slot restore all charges

### T3 — InitiativeEntry (`tests/unit/components/InitiativeEntry.test.tsx`)

- [x] `roll mode: Roll button calls onSet with valid { roll, bonus, total, method: "rolled" }` → spec: initiative-entry roll mode calls onSet
- [x] `roll mode: dex modifier +2 visible in UI` → spec: initiative-entry dex modifier displayed (positive)
- [x] `roll mode: advantage toggle changes UI state` → spec: initiative-entry advantage toggle
- [x] `dice mode: valid value 12 calls onSet with roll: 12` → spec: initiative-entry dice mode valid roll
- [x] `dice mode: value 0 triggers alert, onSet not called` → spec: initiative-entry dice mode value below 1
- [x] `dice mode: value 21 triggers alert, onSet not called` → spec: initiative-entry dice mode value above 20
- [x] `total mode: entering 15 calls onSet with total: 15` → spec: initiative-entry total mode direct value
- [x] `Escape key calls onClose when initiativeRoll is set` → spec: initiative-entry escape closes when initiative exists
- [x] `Escape key does NOT call onClose when no initiativeRoll` → spec: initiative-entry escape does nothing
- [x] `dex modifier -1 visible when dexterity is 8` → spec: initiative-entry dex modifier displayed (negative)

### T4 — CombatInfoIcon (`tests/unit/components/CombatInfoIcon.test.tsx`)

- [x] `icon/button element present on mount` → spec: combat-info-icon renders icon button
- [x] `tooltip panel not in DOM before any click` → spec: combat-info-icon tooltip hidden by default
- [x] `clicking icon shows tooltip panel` → spec: combat-info-icon clicking shows tooltip
- [x] `clicking icon twice hides tooltip panel` → spec: combat-info-icon clicking again hides tooltip
- [x] `alive player name visible after click` → spec: combat-info-icon player combatant shown in panel
- [x] `monster name visible after click` → spec: combat-info-icon monster combatant shown in panel
- [x] `dead combatant (hp: 0) in fallen section after click` → spec: combat-info-icon dead combatant grouped separately

### T5 — Modal (`tests/unit/components/Modal.test.tsx`)

- [x] `children rendered when isOpen: true` → spec: modal renders children when open
- [x] `title visible when title prop provided` → spec: modal renders title when provided
- [x] `close button click calls onClose once` → spec: modal close button calls onClose
- [x] `content NOT in DOM when isOpen: false` → spec: modal hides content when isOpen is false
