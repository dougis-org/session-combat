---
name: tests
description: Tests for the combat-info-icon-test-coverage change
---

# Tests

## Overview

This document outlines the test cases for the `combat-info-icon-test-coverage` change. All work should follow a strict TDD process: write a failing test first, then make it pass, then refactor if needed.

Because this change is _test-only_ (adding tests to `tests/unit/components/CombatInfoIcon.test.tsx` with no implementation changes), the TDD cycle here means:

1. Write the new test case — it may pass immediately if the component already implements the behaviour, or fail if a selector is wrong.
2. Confirm the test correctly targets the intended rendered output.
3. Refactor selector/fixture if the assertion was imprecise.

## Test Cases

### Column layout and headings (maps to Execution task: "Add `describe('Column layout and headings')`")

- [x] After hover, `screen.getByText(/PLAYERS \(1\)/)` is in the document — one alive player, one alive monster
- [x] After hover, `screen.getByText(/MONSTERS \(1\)/)` is in the document — one alive player, one alive monster
- [x] After hover with one alive player + one dead monster: `PLAYERS (1)` appears and `MONSTERS (0)` appears
  - Spec: "Dead combatants excluded from header count"

### ×N grouping (maps to Execution task: "Add `describe('×N grouping')`")

- [x] Two monsters named "Goblin": after hover, `screen.getByText('Goblin')` is in the document and `screen.getByText('×2')` is in the document
  - Spec: "Two same-name monsters grouped with ×2"
- [x] One monster named "Dragon": after hover, `screen.queryByText(/×/)` returns null
  - Spec: "Single combatant renders without multiplier"

### Status conditions (maps to Execution task: "Add `describe('Status conditions')`")

- [x] Player with `{ name: 'Poisoned', duration: 3 }`: after hover, `screen.getByText('• Poisoned (3)')` is in the document
  - Spec: "Condition with duration renders correctly"
- [x] Player with `{ name: 'Blinded', duration: undefined }`: after hover, `screen.getByText('• Blinded')` is in the document and `screen.queryByText(/Blinded \(/)` returns null
  - Spec: "Condition without duration renders name only"

### DEFEATED section (maps to Execution task: "Add `describe('DEFEATED section')`")

- [x] One dead monster: after hover, `screen.getByText(/DEFEATED/i)` is in the document
  - Spec: "DEFEATED label present when dead combatant exists"
- [x] All alive combatants: after hover, `screen.queryByText(/DEFEATED/i)` returns null
  - Spec: "DEFEATED label absent when all combatants alive"

### Strikethrough (maps to Execution task: "Add `describe('Strikethrough on dead combatants')`")

- [x] One dead monster "Goblin": after hover, `screen.getByText('Goblin').closest('.line-through')` is not null
  - Spec: "Dead combatant name's ancestor has class line-through"

### "None" fallback (maps to Execution task: "Add `describe('\"None\" fallback text')`")

- [x] Only monsters (no players): after hover, `screen.getByText('None')` is in the document (Players column)
  - Spec: "Players column shows 'None' when only monsters present"
- [x] Only players (no monsters): after hover, `screen.getByText('None')` is in the document (Monsters column)
  - Spec: "Monsters column shows 'None' when only players present"

### Independent columns (maps to Execution task: "Add `describe('Independent column sections')`")

- [x] One alive player + one dead monster: after hover, `screen.getByText(/DEFEATED/i)` is in the document AND `screen.getByText(alivePlayerName)` is in the document with no line-through on it
  - Spec: "Players column has no DEFEATED, Monsters column does"

### Empty state (maps to Execution task: "Add `describe('Empty state')`")

- [x] Empty array `[]`: after hover, `screen.getByText(/No combatants/i)` is in the document and no error is thrown
  - Spec: "Empty combatant array renders gracefully"
