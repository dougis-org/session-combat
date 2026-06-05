---
name: tests
description: Tests for the extract-combatant-grouping-util change
---

# Tests

## Overview

This document outlines the tests for the `extract-combatant-grouping-util` change. All work follows strict TDD: write a failing test first, then implement the minimum code to pass it, then refactor.

This is a pure refactor — the existing `CombatInfoIcon.test.tsx` suite is the primary regression guard. The TDD work here focuses on new unit tests for `groupCombatantsForDisplay` itself, which are written before the function is extracted.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test:** Before writing any implementation code, write a test that captures the requirements. Run it and confirm it fails.
2. **Write code to pass the test:** Write the simplest code to make the test pass.
3. **Refactor:** Improve structure while keeping tests green.

## Test Cases

### Task: Add `groupCombatantsForDisplay` to `lib/utils/combat.ts`

Test file: `tests/unit/utils/groupCombatantsForDisplay.test.ts` (new)

- [ ] **Alive/dead split — mixed input:** Given combatants with `hp > 0` and `hp <= 0`, alive combatants appear only in `alive.*` and dead appear only in `dead.*`
- [ ] **Alive/dead split — boundary `hp === 0`:** A combatant with `hp === 0` appears in `dead.*`, not `alive.*`
- [ ] **Type routing — players go to `alive.players`:** Given alive players, they appear in `alive.players` and not in `alive.monsters`
- [ ] **Type routing — monsters go to `alive.monsters`:** Given alive monsters, they appear in `alive.monsters` and not in `alive.players`
- [ ] **Grouping by name — same name → single Map key:** Two alive monsters named "Goblin" produce `alive.monsters.get("Goblin")` with length 2
- [ ] **Grouping by name — different names → separate keys:** Two alive monsters with different names produce two separate Map entries
- [ ] **Totals count alive combatants only:** 2 alive players + 1 dead player → `totals.players === 2`
- [ ] **Totals count alive monsters only:** 1 alive monster + 2 dead monsters → `totals.monsters === 1`
- [ ] **Empty input:** Empty array → all Maps empty, both totals 0
- [ ] **All dead:** Array with all `hp <= 0` → `alive.*` Maps empty, `totals` both 0, `dead.*` Maps populated

### Task: Refactor `CombatInfoIcon` to call utility

No new tests for this task — the existing `tests/unit/components/CombatInfoIcon.test.tsx` suite provides full regression coverage. All tests must pass after the refactor without modification.

- [ ] **Regression: existing CombatInfoIcon tests pass unchanged** — run `npm test -- --testPathPattern CombatInfoIcon`; all 18 tests green

## Spec Traceability

| Test case | Spec scenario | Task |
|---|---|---|
| Alive/dead split — mixed input | specs/grouping.md — Alive/dead split on hp boundary | Add `groupCombatantsForDisplay` |
| Alive/dead split — boundary `hp === 0` | specs/grouping.md — Alive/dead split on hp boundary | Add `groupCombatantsForDisplay` |
| Type routing — players | specs/grouping.md — Grouping by type | Add `groupCombatantsForDisplay` |
| Type routing — monsters | specs/grouping.md — Grouping by type | Add `groupCombatantsForDisplay` |
| Grouping by name — same name | specs/grouping.md — Grouping by name within type | Add `groupCombatantsForDisplay` |
| Totals count alive only | specs/grouping.md — Totals count alive combatants only | Add `groupCombatantsForDisplay` |
| Empty input | specs/grouping.md — Empty input | Add `groupCombatantsForDisplay` |
| All dead | specs/grouping.md — All combatants dead | Add `groupCombatantsForDisplay` |
| Regression: CombatInfoIcon suite | specs/grouping.md — Render output unchanged after refactor | Refactor `CombatInfoIcon` |
