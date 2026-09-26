---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `consume-dice-preferences` change. All work should
follow a strict TDD (Test-Driven Development) process.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Task 1.1–1.8 — `lib/preferences/schema.ts` (`tests/unit/lib/preferences/schema.test.ts`)

- [ ] `isValidPreferenceValue('dice.color', { foreground: '#000', background: '#ff0000' })` → `true` — spec: profile-settings "Save valid color preference"
- [ ] `isValidPreferenceValue('dice.color', null)` → `true` — spec: profile-settings "Save valid color preference"
- [ ] `isValidPreferenceValue('dice.color', { foreground: '#000' })` (missing `background`) → `false` — spec: profile-settings "Invalid dice color object is rejected"
- [ ] `isValidPreferenceValue('dice.color', { foreground: 'red', background: '#fff' })` (invalid hex) → `false` — spec: profile-settings "Invalid dice color object is rejected"
- [ ] `isValidPreferenceValue('dice.color', '#ff0000')` (old string shape) → `false` — spec: profile-settings "Invalid dice color object is rejected"
- [ ] `isValidPreferenceValue('dice.surface', 'wood-table')` / `'wood-tray'` / `'green-felt'` / `'metal'` → `true` — spec: profile-settings "Save valid surface preference"
- [ ] `isValidPreferenceValue('dice.surface', null)` → `true` — spec: profile-settings "Save valid surface preference"
- [ ] `isValidPreferenceValue('dice.surface', 'stone')` (old, now-unsupported value) → `false` — spec: profile-settings "Reject unsupported surface value"
- [ ] `isValidPreferenceValue('dice.material', 'glass')` / `'none'` / `'metal'` / `'wood'` → `true` — spec: profile-settings "Save valid material preference"
- [ ] `isValidPreferenceValue('dice.material', null)` → `true` — spec: profile-settings "Save valid material preference"
- [ ] `isValidPreferenceValue('dice.material', 'plastic')` (label, not the engine value `'none'`) → `false` — spec: profile-settings "Reject unsupported material value"
- [ ] `resolvePreferences({ dice: { color: { foreground: '#000' } } })` → resolved `dice.color` is `null` (repaired, no throw) — spec: profile-settings "Malformed stored dice preference degrades to default"
- [ ] `resolvePreferences({ dice: { surface: 'stone' } })` → resolved `dice.surface` is `null` — spec: profile-settings "Malformed stored dice preference degrades to default"
- [ ] `resolvePreferences({ dice: { material: 'unknown' } })` → resolved `dice.material` is `null` — spec: profile-settings "Malformed stored dice preference degrades to default"
- [ ] `validatePreferencePatch({ dice: { color: { foreground: '#000', background: 'nothex' } } })` → `{ ok: false, ... }`, no partial write — spec: profile-settings "Invalid dice color object is rejected"
- [ ] `validatePreferencePatch({ dice: { surface: 'felt' } })` (old unsupported value) → `{ ok: false, ... }` — spec: profile-settings "Reject unsupported surface value"
- [ ] `validatePreferencePatch({ dice: { material: 'wood' } })` → `{ ok: true, values: { dice: { material: 'wood' } } }` — spec: profile-settings "Save valid material preference"
- [ ] `sparseKnownValues({ dice: { material: 'metal' } })` includes `dice.material` — supports task 1.9
- [ ] `partitionPreferenceDelta({ dice: { material: null } })` routes `dice.material` to `$unset` (matches default) — regression coverage for the new key alongside existing `color`/`surface` behavior
- [ ] `PREFERENCE_PATHS` / `ALL_PATHS` (in `usePreferences.tsx`) includes `'dice.material'` — supports task 1.9

### Task 2.1–2.3 — `lib/dice/useDiceAnimation.ts` (existing suite + `diceBoxMockFactory` harness)

- [ ] Given `appearance = { customColorset: { foreground: '#000', background: '#f00' }, material: null, surface: null }`, `run()` constructs `DiceBox` with `theme_customColorset: { foreground: '#000', background: '#f00' }` and no `theme_colorset` key — spec: dice-appearance "Custom dice color is applied at DiceBox construction"
- [ ] Given `appearance = { customColorset: null, material: null, surface: 'wood-tray' }`, constructed config includes `theme_surface: 'wood-tray'` — spec: dice-appearance "Custom dice surface is applied at DiceBox construction"
- [ ] Given `appearance = { customColorset: null, material: 'metal', surface: null }`, constructed config includes `theme_material: 'metal'` — spec: dice-appearance "Custom dice material is applied at DiceBox construction"
- [ ] Given `appearance = { customColorset: null, material: null, surface: null }` (all unset), constructed config has no `theme_customColorset`, `theme_material`, or `theme_surface` keys — spec: dice-appearance "Unset dice preferences omit the corresponding engine options"
- [ ] Constructed config never includes a `theme_colorset` key regardless of `appearance` — spec: dice-appearance "Custom dice color is applied at DiceBox construction"
- [ ] Existing lazy-load timing test (`import('@drdreo/dice-box-threejs')` only triggered by `run()`) still passes unchanged with the reshaped `appearance` prop — spec: dice-appearance "Appearance mapping does not affect lazy-load timing"

### Task 2.4 — `lib/components/GlobalDiceFab.tsx`

- [ ] Given `preferences.dice = { color: {...}, material: 'wood', surface: 'metal', ... }`, `GlobalDiceFab` calls `useDiceAnimation` with `{ customColorset: preferences.dice.color, material: 'wood', surface: 'metal' }` (component/integration test mocking `useDiceAnimation` and `usePreferences`) — supports design.md Decision 5

### Task 3.1–3.5 — retire the LocalStore gallery path

- [ ] `useDiceFabPreferences()` no longer exposes `diceColorset`, `setDiceColorset`, `diceMaterial`, or `setDiceMaterial` on its return type/object (type-level + runtime check) — supports task 3.1
- [ ] `GlobalDiceFab` render output contains no element with accessible name "Dice appearance" — spec: dice-appearance "Dice fab panel has no appearance control"
- [ ] `GlobalDiceFab` never renders `DiceAppearanceModal` (no matching test id / role dialog for it) even when the dice panel is open — spec: dice-appearance "Dice fab panel has no appearance control"
- [ ] `lib/components/dice/DiceAppearanceModal.tsx` file no longer exists (build/lint passes with no dangling references) — supports task 3.3
- [ ] No remaining source file imports `DICE_COLORSETS`, `DICE_COLORSET_CATEGORIES`, `DICE_MATERIALS`, or `resolveDiceAppearance` from `lib/dice/diceAppearance` — supports task 3.4
- [ ] `localStorage` keys `dice-fab-colorset` / `dice-fab-material` are never read or written anywhere in the codebase (grep-level check in CI or a dedicated regression test) — supports task 3.1, 3.4

### Task 4.1–4.4 — `/profile` UI (`app/profile/page.tsx` tests)

- [ ] Filling in a valid foreground hex and background hex commits `setPreference('dice.color', { foreground, background })` — spec: profile-settings "Edit dice appearance preferences"
- [ ] Clearing both foreground and background fields commits `setPreference('dice.color', null)` — spec: profile-settings "Edit dice appearance preferences"
- [ ] Entering an invalid hex in either field shows `aria-invalid` + `role="alert"` and does not call `setPreference` — spec: profile-settings "Invalid dice color object is rejected" (UI-level counterpart)
- [ ] "Dice Surface" `<select>` renders exactly the options `green-felt` / `wood-table` / `wood-tray` / `metal` (plus "Default") and selecting one calls `setPreference('dice.surface', <value>)` — spec: profile-settings "Save valid surface preference"
- [ ] "Dice Material" `<select>` renders exactly the options `glass` / `none` / `metal` / `wood` (plus "Default") and selecting one calls `setPreference('dice.material', <value>)` — spec: profile-settings "Save valid material preference"
- [ ] Page no longer renders a "Dice Color (Hex)" single-field input (old shape) — supports task 4.2

### Task 5.1 — manual verification (not automated)

- [ ] Manual smoke check performed and confirmed: setting a custom color/surface/material on `/profile` visibly changes the rendered die/tray on the next roll via the dice fab.
