---
name: tests
description: Tests for the migrate-combatant-card-tests-rtl change
---

# Tests

## Overview

This change is itself a test migration — the deliverable IS the tests. The TDD workflow here means each new test file is written in its final RTL form, run to confirm it passes, before the legacy file is deleted.

## Testing Steps

For each execution task (E1–E6):

1. **Write the RTL test file** (or update the existing file) per the task spec
2. **Run it in isolation** — confirm all tests in that file pass: `jest <filename>`
3. **Run the full suite** — confirm nothing regressed: `npm run test:unit`
4. **Delete the legacy file** (E6) only after all new files are green

## Test Cases

### E1 — Shared test helpers

- [ ] `CombatantCard.test-helpers.ts` compiles with no TypeScript errors (`npx tsc --noEmit`)
- [ ] `BASE` exported from helpers matches the fixture used in current test files (same shape, same values)
- [ ] `renderCard({})` renders `CombatantCard` into jsdom without throwing
  - Spec: `specs/test-migration/spec.md` — "renderCard is importable and functional"

### E2 — CombatantCard.hp.test.tsx (Undo HP addition)

- [ ] All pre-existing tests in `CombatantCard.hp.test.tsx` still pass after adding imports from shared helpers
- [ ] `CombatantCard – Undo HP button: Undo HP button is disabled when history is empty` — passes
- [ ] `CombatantCard – Undo HP button: Undo HP button is enabled after applying damage` — passes
- [ ] `CombatantCard – Undo HP button: Undo HP button stays disabled when immune combatant receives typed damage` — passes
- [ ] `CombatantCard – Undo HP button: clicking Undo HP calls onUpdate with the previous hp/tempHp snapshot` — passes
- [ ] `CombatantCard – Undo HP button: Undo HP button becomes disabled again after undo exhausts history` — passes
- [ ] `CombatantCard – Undo HP button: Undo HP does not push a new history entry` — passes
  - Spec: `specs/test-migration/spec.md` — "Undo HP tests use RTL async pattern"

### E3 — CombatantCard.badges.test.tsx

- [ ] `CombatantCard – stat damage modifier badges: renders without crash for base combatant` — passes
- [ ] `CombatantCard – stat damage modifier badges: no damage modifier section shown when no resistances/effects` — passes
- [ ] `CombatantCard – stat damage modifier badges: shows immunity badge for each stat immunity` — passes
- [ ] `CombatantCard – stat damage modifier badges: shows resistance badge for each stat resistance` — passes
- [ ] `CombatantCard – stat damage modifier badges: shows vulnerability badge for each stat vulnerability` — passes
- [ ] `CombatantCard – stat damage modifier badges: shows active effect badge with label and remove button` — passes
- [ ] `CombatantCard – stat damage modifier badges: active effect badge shows IMM prefix for immunity kind` — passes
- [ ] `CombatantCard – stat damage modifier badges: active effect badge shows VULN prefix for vulnerability kind` — passes
- [ ] `CombatantCard – remove active effect: clicking remove button calls onUpdate with effect removed` — passes
- [ ] No `createRoot` import present in file (`grep "createRoot" tests/unit/components/CombatantCard.badges.test.tsx` returns nothing)
  - Spec: `specs/test-migration/spec.md` — "All badge tests pass with RTL queries"

### E4 — CombatantCard.effects-panel.test.tsx

- [ ] `CombatantCard – effects panel toggle: effects panel is collapsed by default` — passes
- [ ] `CombatantCard – effects panel toggle: + Add effect button visible when stat modifiers present` — passes
- [ ] `CombatantCard – effects panel toggle: clicking + Add effect shows preset panel` — passes
- [ ] `CombatantCard – effects panel toggle: clicking Hide effects collapses panel` — passes
- [ ] `CombatantCard – preset application: preset panel lists Rage preset` — passes
- [ ] `CombatantCard – preset application: clicking Rage preset calls onUpdate with B/P/S resistances` — passes
- [ ] `CombatantCard – preset application: clicking Rage preset closes the effects panel` — passes
- [ ] `CombatantCard – preset application: clicking Protection from Energy opens type picker` — passes
- [ ] `CombatantCard – preset application: type picker only shows elemental choices` — passes
- [ ] `CombatantCard – preset application: selecting a type calls onUpdate with the chosen effect` — passes
- [ ] `CombatantCard – preset application: selecting a type closes both picker and panel` — passes
- [ ] `CombatantCard – preset application: clicking Back returns to preset list` — passes
- [ ] `CombatantCard – preset application: Absorb Elements offers all 13 damage types` — passes
- [ ] No `createRoot` import present in file
  - Spec: `specs/test-migration/spec.md` — "All effects-panel tests pass with RTL queries"

### E5 — CombatantCard.callbacks.test.tsx

- [ ] `CombatantCard – detail/remove callbacks: detail toggle triggers onShowDetails with id and position` — passes
- [ ] `CombatantCard – detail/remove callbacks: remove button triggers onShowRemoveConfirm with id and position` — passes
- [ ] `CombatantCard – damage type select: damage type select renders with grouped options` — passes
- [ ] `CombatantCard – damage type select: damage type select has empty default option` — passes
- [ ] `CombatantCard – damage type select: Damage button applies typed damage when type is selected` — passes
- [ ] `CombatantCard – damage type select: Damage button applies untyped damage when no type selected` — passes
- [ ] No `createRoot` import present in file
  - Spec: `specs/test-migration/spec.md` — "All callback and damage tests pass with RTL queries"

### E6 — Legacy file deletion

- [ ] `tests/unit/components/CombatantCard.test.tsx` does not exist
- [ ] `grep -r "createRoot" tests/unit/components/CombatantCard` — zero results
- [ ] `grep -r "IS_REACT_ACT_ENVIRONMENT" tests/unit/components/CombatantCard` — zero results
- [ ] `npm run test:unit` — all tests pass (35 migrated + all existing hp tests)
  - Spec: `specs/test-migration/spec.md` — "REMOVED CombatantCard.test.tsx"

### Full suite regression

- [ ] `npm run test:unit -- --coverage` — `CombatantCard.tsx` coverage ≥ pre-migration baseline
  - Spec: `specs/test-migration/spec.md` — "Coverage gate"
- [ ] `grep -r "const BASE" tests/unit/components/CombatantCard` — exactly one result (in `test-helpers.ts`)
  - Spec: `specs/test-migration/spec.md` — "BASE fixture is the single source of truth"
