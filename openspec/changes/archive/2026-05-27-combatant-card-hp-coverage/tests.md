---
name: tests
description: RTL test cases for CombatantCard HP display, damage application, temp HP, and conditions coverage
---

# Tests

## Overview

All tests live in `tests/unit/components/CombatantCard.hp.test.tsx`. This is a new file (RTL pattern) separate from the existing `CombatantCard.test.tsx` (legacy createRoot pattern). All work follows TDD: write a failing test → implement → confirm passing.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Write the RTL test against the unimplemented behavior. Run `npm test -- --testPathPattern=CombatantCard.hp` and confirm it fails.
2. **Write code to pass:** Since this is test-only work, "implementation" means writing the test correctly so it passes against the existing production code.
3. **Refactor:** Consolidate shared setup (fixtures, `renderCard` helper) and remove duplication between test cases.

## Test Cases

### T1 — HP Display

- [x] `health-bar width is 100% when hp equals maxHp` → spec: hp-display full HP scenario
- [x] `health-bar width is ~50% when hp is half maxHp` → spec: hp-display half HP scenario
- [x] `health-bar width is <25% when hp is near zero` → spec: hp-display near-zero scenario
- [x] `skull emoji appears in heading when hp is 0` → spec: hp-display dead state (hp=0)
- [x] `skull emoji absent from heading when hp is positive` → spec: hp-display dead state (hp=1)
- [x] `temp-hp-bar is present when tempHp > 0` → spec: hp-display temp HP bar present
- [x] `temp-hp-bar is absent when tempHp is 0` → spec: hp-display temp HP bar absent

### T2 — Damage Application

- [x] `normal damage reduces hp by full amount` → spec: damage-application normal damage
- [x] `fire resistance halves damage (rounded down)` → spec: damage-application resistance scenario
- [x] `fire resistance — 1 damage becomes 0 (floor)` → spec: damage-application resistance floor scenario
- [x] `fire immunity — hp unchanged, onUpdate not called` → spec: damage-application immunity scenario
- [x] `fire vulnerability — damage doubled` → spec: damage-application vulnerability scenario
- [x] `vulnerability — hp floored at 0, not negative` → spec: damage-application vulnerability floor scenario

### T3 — Temp HP Drain

- [x] `damage ≤ tempHp — real hp unchanged, tempHp reduced` → spec: temp-hp drain absorbed
- [x] `damage > tempHp — temp HP zeroed, excess hits real HP` → spec: temp-hp drain spillover
- [x] `tempHp: 0 — all damage hits real HP` → spec: temp-hp zero temp scenario

### T4 — Conditions

- [x] `"Conditions (1)" button present when combatant has one condition` → spec: conditions display count
- [x] `no Conditions button when combatant has no conditions` → spec: conditions absent
- [x] `clicking Conditions button expands condition list` → spec: conditions expand on click
- [x] `clicking Remove on only condition calls onUpdate with empty array` → spec: conditions remove only
- [x] `clicking Remove on one of two conditions preserves the other` → spec: conditions remove one of many

### T5 — Coverage Gate

- [x] `branch coverage for CombatantCard.tsx ≥ 65% with all test files combined` → coverage report confirms target
