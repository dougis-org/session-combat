---
name: tests
description: Tests for the concentration-tracking change
---

# Tests

## Overview

This document outlines the tests for the `concentration-tracking` change. All work should follow a strict TDD (Test-Driven Development) process: write failing tests first, then implement against them, then refactor.

Testing framework: Jest + React Testing Library (matching existing project patterns)

## Test Cases

### Task 1: Add concentration field to CombatantState type

- [ ] `concentrationSpell` field is optional on `CombatantState`
- [ ] TypeScript compilation succeeds with new field
- [ ] Field persists through combat state save/load cycle

### Task 2: Add concentration state management in CombatantCard

- [ ] **Given** a combatant with `concentrationSpell: "Hold Person"`
- [ ] **When** the `CombatantCard` renders
- [ ] **Then** a concentration indicator (🔮 icon) and "Hold Person" text appear in the row

- [ ] **Given** a combatant with `concentrationSpell` set
- [ ] **When** the [End] button is clicked
- [ ] **Then** `concentrationSpell` is cleared and a toast appears

### Task 3: Add DC badge display logic

- [ ] **Given** a combatant concentrating on "Hold Person" with 45 HP
- [ ] **When** 24 damage is dealt
- [ ] **Then** DC badge shows "⚠️ DC 12 (took 24 dmg)" where dc = max(10, floor(24/2)) = 12

- [ ] **Given** a combatant with existing DC badge showing DC 10 (took 20 dmg)
- [ ] **When** an additional 8 damage is dealt
- [ ] **Then** DC badge updates to "DC 14 (took 28 dmg)"

- [ ] **Given** a combatant not concentrating
- [ ] **When** 20 damage is dealt
- [ ] **Then** No DC badge appears

### Task 4: Add auto-clear on 0 HP logic

- [ ] **Given** a combatant concentrating on "Hold Person" with 5 HP
- [ ] **When** 10 damage is dealt (reducing HP to 0)
- [ ] **Then** `concentrationSpell` is cleared, and a toast appears: "[Name] lost concentration on Hold Person"

- [ ] **Given** a combatant concentrating on "Hold Person" with 30 HP and 5 temp HP
- [ ] **When** 10 damage is dealt (temp HP absorbs 5, actual HP drops to 25, not 0)
- [ ] **Then** Concentration persists (HP is not 0)

### Task 5: Clear DC badge on turn advance

- [ ] **Given** a combatant with visible DC badge
- [ ] **When** `nextTurn()` is called
- [ ] **Then** DC badge is no longer visible

### Task 6: Add concentration field to detail popup

- [ ] **Given** any combatant
- [ ] **When** the detail popup is opened
- [ ] **Then** a "Concentration" text input field is visible

- [ ] **Given** a combatant with `concentrationSpell: "Hold Person"`
- [ ] **When** the detail popup is opened
- [ ] **Then** the concentration field shows "Hold Person"

- [ ] **Given** a combatant with empty concentration field in detail popup
- [ ] **When** user types "Hold Person" and blurs
- [ ] **Then** `concentrationSpell` is set to "Hold Person" and row shows indicator

### Task 7: Toast notifications

- [ ] **Given** [End] button clicked on concentrating combatant
- [ ] **When** handler executes
- [ ] **Then** toast shows "[Name] ended concentration on [Spell]" and auto-dismisses after 3 seconds

- [ ] **Given** combatant at 0 HP with active concentration
- [ ] **When** damage causes HP to reach 0
- [ ] **Then** toast shows "[Name] lost concentration on [Spell]" and auto-dismisses after 3 seconds

## Traceability

| Test Case | Task | Spec Scenario |
|-----------|------|---------------|
| concentration indicator in row | Task 2 | ADDED Combatant Concentration State - scenario 1 |
| End button clears and toasts | Task 2 | ADDED Combatant Concentration State - scenario 2 |
| DC badge appears on damage | Task 3 | ADDED Concentration DC Reminder - scenario 1 |
| DC badge updates on subsequent damage | Task 3 | ADDED Concentration DC Reminder - scenario 2 |
| No badge for non-concentrator | Task 3 | Implicit (no spec scenario but required) |
| Auto-clear at 0 HP with toast | Task 4 | ADDED Concentration Auto-Clear - scenario 1 |
| Concentration persists with temp HP | Task 4 | ADDED Concentration Auto-Clear - scenario 2 |
| DC badge clears on turn advance | Task 5 | ADDED Concentration DC Reminder - scenario 3 |
| Detail popup has concentration field | Task 6 | ADDED Concentration Field in Detail Popup - scenario 1 |
| Detail popup pre-fills with spell | Task 6 | ADDED Concentration Field in Detail Popup - scenario 2 |
| Detail popup can set new spell | Task 6 | ADDED Concentration Field in Detail Popup - scenario 3 |
| Manual end toast | Task 7 | Derived from ADDED Combatant Concentration State |
| Auto-clear toast | Task 7 | Derived from ADDED Concentration Auto-Clear |

## Testing Strategy

1. **Unit tests** for pure functions (DC calculation, auto-clear logic)
2. **Component tests** for `CombatantCard` rendering (with/without concentration)
3. **Integration tests** for turn advance clearing DC badge

## Edge Cases to Test

- Damage exactly equals temp HP + HP (e.g., 5 temp, 5 HP, 10 damage → HP=0, not temp HP)
- Multiple damage events same turn
- Setting same spell name (no-op)
- Empty string concentration (should clear indicator)