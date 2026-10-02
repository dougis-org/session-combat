---
name: tests
description: Tests for the auto-end-combat-prompt change
---

# Tests

## Overview

This document outlines the tests for the `auto-end-combat-prompt` change. All work follows strict TDD: write a failing test, make it pass, refactor.

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** that captures the task's requirement; run it and confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping tests green.

## Test Cases

Helper: `tests/unit/combat/combatEnd.test.ts` (Task 2)

- [ ] All monsters `hp <= 0`, one player alive → `'monsters-defeated'` (spec: Monsters defeated prompt)
- [ ] One monster alive → `null`
- [ ] Players-only combat → `null` (spec: Players-only combat does not prompt)
- [ ] All players `lifeState: 'dead'`, monster alive → `'players-down'` (spec: TPK prompt)
- [ ] Players at 0 HP `dying` or `stable` → `null` (spec: Dying players do not trigger)
- [ ] Player at `hp 0` with no `lifeState` → `null`
- [ ] Lair with `hp > 0` ignored; all monsters down → `'monsters-defeated'` (spec: Lair ignored)
- [ ] Both sides finished → `'monsters-defeated'`
- [ ] Empty combatant list → `null`

Component: `tests/unit/components/ActiveCombatView.test.tsx` (Tasks 3, 4, 5)

- [ ] Prompt appears when last monster drops to 0 HP (Task 3; Monsters defeated prompt)
- [ ] Prompt appears on initial render of an already-finished combat (Task 5)
- [ ] Yes calls `endCombat` exactly once and the "End Combat?" dialog never opens (Task 4; Confirm ends combat)
- [ ] No closes the prompt; a subsequent HP edit with condition unchanged does not re-prompt (Task 4; Dismissal respected)
- [ ] Escape dismisses and behaves as No (Task 4; Keyboard dismissal)
- [ ] After No, adding a living monster then defeating all again re-prompts (Task 3; Re-arm)
- [ ] Manual End Combat button still opens its own confirm dialog (regression)
