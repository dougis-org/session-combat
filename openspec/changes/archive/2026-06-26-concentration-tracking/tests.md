---
name: tests
description: Tests for the concentration-tracking change
---

# Tests

## Overview

This document outlines the tests for the `concentration-tracking` change. All work must follow strict TDD: write a failing test first, make it pass with the minimum code, then refactor.

All unit tests use `npm run test:unit`. Integration tests use `npm run test:integration`.

---

## Test Cases

### Task 2 — `calcConSaveDC` (lib/utils/combat.ts)

Test file: new or existing combat utils test in `tests/unit/utils/`

- [ ] **T2.1** `calcConSaveDC(0)` returns `10`
  - Spec: `calcConSaveDC` Requirement (edge — zero damage)
  - TDD: Write test → fails → implement helper → passes

- [ ] **T2.2** `calcConSaveDC(14)` returns `10` (floor(14/2)=7, max(10,7)=10)
  - Spec: "Damage below threshold" scenario

- [ ] **T2.3** `calcConSaveDC(19)` returns `10` (floor(19/2)=9, max(10,9)=10)
  - Spec: "Odd damage" scenario

- [ ] **T2.4** `calcConSaveDC(20)` returns `10` (floor(20/2)=10, max(10,10)=10)
  - Spec: "Damage at threshold" scenario

- [ ] **T2.5** `calcConSaveDC(21)` returns `10` (floor(21/2)=10)
  - Spec: "Damage above threshold" scenario

- [ ] **T2.6** `calcConSaveDC(50)` returns `25`
  - Spec: "High damage" scenario

---

### Task 3 — Damage handler concentration check (CombatantCard.tsx)

Test file: `tests/unit/components/CombatantCard.concentration.test.tsx` (new)

- [ ] **T3.1** Damage to a concentrating combatant with `effectiveDamage > 0` calls `onUpdate` with `pendingConSaveDC` set to the correct DC value
  - Spec: "DC prompt appears after damage" scenario

- [ ] **T3.2** Damage with `effectiveDamage = 0` (immunity) on a concentrating combatant does NOT call `onUpdate` with `pendingConSaveDC` set
  - Spec: "DC prompt absent when damage is fully absorbed by immunity" scenario

- [ ] **T3.3** Damage that reduces HP to 0 on a concentrating combatant calls `onUpdate` with `concentratingOn: undefined` and `pendingConSaveDC: undefined`
  - Spec: "Auto-clear at 0 HP" scenario

- [ ] **T3.4** Non-lethal damage on a concentrating combatant preserves `concentratingOn` in the `onUpdate` call
  - Spec: "Concentration preserved when HP > 0 after damage" scenario

- [ ] **T3.5** Damage on a non-concentrating combatant (`concentratingOn` undefined) does not set `pendingConSaveDC`
  - Spec: "DC prompt absent when no concentration" scenario

---

### Task 4 — CON save notification (`onConSaveRequired` callback + `ActiveCombatView` handler)

Test files:
- `tests/unit/components/CombatantCard.concentration.test.tsx` (extend) — callback firing
- `tests/unit/components/ActiveCombatView.test.tsx` (extend or new) — message dispatch

- [ ] **T4.1** `onConSaveRequired` mock is called with the correct DC when a concentrating player-type combatant takes `effectiveDamage > 0`
  - Spec: "Notification fires for player combatant" scenario

- [ ] **T4.2** `onConSaveRequired` is NOT called when `effectiveDamage = 0` (immunity)
  - Spec: "No notification when damage is zero" scenario

- [ ] **T4.3** `onConSaveRequired` is NOT called when `concentratingOn` is undefined
  - Spec: "DC prompt absent when no concentration" scenario (notification corollary)

- [ ] **T4.4** In `ActiveCombatView`, when `onConSaveRequired` fires for a player-type combatant (`id: "character-abc123"`), `fetch` is called with a POST body containing `visibility: { scope: "direct"; toUserId: "<expected-userId>" }`
  - Spec: "Notification fires for player combatant" scenario

- [ ] **T4.5** In `ActiveCombatView`, when `onConSaveRequired` fires for a monster-type combatant, no `fetch` with `scope: "direct"` is made
  - Spec: "No player message for monster combatant" scenario

---

### Task 5 — Card UI badge and DC prompt (CombatantCard.tsx)

Test file: `tests/unit/components/CombatantCard.concentration.test.tsx` (extend)

- [ ] **T5.1** Card renders a badge/pill with the spell name when `concentratingOn` is set
  - Spec: "Concentration badge visible" scenario

- [ ] **T5.2** No concentration badge in the DOM when `concentratingOn` is undefined
  - Spec: "No badge when not concentrating" scenario

- [ ] **T5.3** DC prompt renders with the correct DC value when `pendingConSaveDC` is set
  - Spec: "DC prompt appears after damage" scenario (render assertion)

- [ ] **T5.4** No DC prompt when `pendingConSaveDC` is undefined
  - Spec: "DC prompt absent when no concentration" scenario

- [ ] **T5.5** Clicking the dismiss (×) button calls `onUpdate` with `pendingConSaveDC: undefined`
  - Spec: "DC prompt dismissed" scenario

---

### Task 6 — Detail panel set/end concentration (CombatantDetailPanel.tsx)

Test file: `tests/unit/components/CombatantDetailPanel.test.tsx` (new or extend)

- [ ] **T6.1** Text input is pre-filled with `concentratingOn` when the combatant is concentrating
  - Spec: Set Concentration requirement (input pre-fill)

- [ ] **T6.2** Entering a spell name and saving calls `onUpdate` with `concentratingOn: "Bless"`
  - Spec: "New spell overwrites old" scenario

- [ ] **T6.3** "End Concentration" button is visible when `concentratingOn` is set
  - Spec: "End Concentration button clears fields" scenario

- [ ] **T6.4** "End Concentration" button is absent when `concentratingOn` is undefined
  - Spec: "No badge when not concentrating" (parallel for panel)

- [ ] **T6.5** Clicking "End Concentration" calls `onUpdate` with `concentratingOn: undefined` and `pendingConSaveDC: undefined`
  - Spec: "End Concentration button clears fields" scenario

- [ ] **T6.6** Entering a second spell name after the first calls `onUpdate` with the new name only (single-spell enforcement)
  - Spec: "New spell overwrites old" scenario

---

### Task 1 — Type model (lib/types.ts)

Validated by TypeScript compiler and all existing tests continuing to pass — no dedicated test file needed.

- [ ] **T1.1** `npx tsc --noEmit` produces zero errors after adding the two new optional fields
  - Spec: "Existing combatant construction is unchanged" scenario

- [ ] **T1.2** All existing `CombatantCard` and `CombatantDetailPanel` tests still pass (no regressions from new optional fields)
  - Spec: "Existing combatant construction is unchanged" scenario
