---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `add-dice-appearance-gallery` change. All work follows strict TDD (fail → pass → refactor). Each case maps to a task in `tasks.md` and an acceptance scenario in `specs/**/spec.md`.

Legend: **Cap** = `da` (`dice-appearance`), `gdf` (`global-dice-fab`).

## Testing Steps

For each task in `tasks.md`:

1. **Write a failing test** capturing the task's requirement; run it and confirm it fails.
2. **Write the simplest code** to make it pass.
3. **Refactor** while keeping it green.

## Test Cases

### Task 1.1 — Engine-facts fixture

- [ ] 1.1-a Fixture file lists a colorset id → texture-name(s) map and the material-preset key set; a test asserts the fixture's material keys equal `{glass, metal, perfectmetal, wood, none}`. _(Scenario: da / "Materials are limited to the confirmed engine preset keys")_
- [ ] 1.1-b Test asserts every colorset id used by `DICE_COLORSETS` is present as a key in the fixture map. _(Scenario: da / "All registry colorset textures exist on disk")_

### Task 2.1 / 2.2 — Registry contents (`lib/dice/diceAppearance.ts`)

- [ ] 2.1-a `DICE_COLORSETS` — every entry `category ∈ {Colors, Damage Types, Custom Sets}`. _(da / "Registry exposes only non-licensed, non-novelty colorsets")_
- [ ] 2.1-b `DICE_COLORSETS` — no id matches `/^(swrpg_|swa_|swl_|xwing_)/` nor `∈ {test, tigerking, acleaf, isabelle, thecage}`. _(da / same)_
- [ ] 2.1-c `DICE_COLORSETS` — contains the expected ~20 ids (Colors: white/black/rainbow; Damage Types: radiant/fire/ice/poison/acid/thunder/lightning/air/water/earth/force/psychic/necrotic; Custom Sets: breebaby/pinkdreams/inspired/bloodmoon/starynight/glitterparty/astralsea/bronze). _(da / same)_
- [ ] 2.1-d Each entry has non-empty `name`, `category`, and `swatch.fg` / `swatch.bg` as CSS color strings. _(gdf / "Opening the appearance modal from the dice panel")_
- [ ] 2.1-e `DICE_MATERIALS` ids are exactly `{glass, none, metal, wood}`; the `none` entry's `name` is `"Plastic"`. _(da / "Materials are limited to the confirmed engine preset keys")_
- [ ] 2.1-f `DEFAULT_COLORSET === 'white'` and `DEFAULT_MATERIAL === 'glass'`. _(da / "Registry exposes only non-licensed..."; gdf / "First-time user gets the default appearance")_

### Task 2.3 — Asset existence (`diceAppearance.assets.test.ts`)

- [ ] 2.3-a For every `DICE_COLORSETS` entry, each engine texture name it maps to (via the 1.1 fixture) exists as `public/dice-box-threejs/textures/<name>.webp`. Missing file → test fails. _(da / "All registry colorset textures exist on disk")_
- [ ] 2.3-b Negative control: a deliberately fake colorset id fed through the same check fails, proving the assertion is real.

### Task 2.4 — `resolveDiceAppearance`

- [ ] 2.4-a Valid pair `('fire','metal')` → `{colorset:'fire', material:'metal'}` unchanged. _(da / "Selected appearance is applied to the 3D roll animation" → "DiceBox is constructed with the persisted theme options")_
- [ ] 2.4-b Unknown colorset string `'nope'` → `colorset:'white'`. _(da / "Unknown stored colorset id falls back to the default")_
- [ ] 2.4-c Unknown material, wrong types (`42`, `{}`, `[]`), `undefined`, `null` → defaults; function never throws. _(da / same)_
- [ ] 2.4-d Partial validity: valid colorset + invalid material → colorset kept, material defaulted (and vice versa). _(da / same)_

### Task 3.1 / 3.2 — Persisted preference (`useDiceFabPreferences.test.ts`)

- [ ] 3.2-a Empty storage → `diceColorset === 'white'`, `diceMaterial === 'glass'`. _(gdf / "First-time user gets the default appearance")_
- [ ] 3.2-b `setDiceColorset('bloodmoon')` then re-init → `diceColorset === 'bloodmoon'`; `LocalStore.set` called with key `dice-fab-colorset` and value `'bloodmoon'`. _(gdf / "Selecting an option persists it immediately"; "Appearance survives a reload and reaches the engine")_
- [ ] 3.2-c Same for `setDiceMaterial('metal')` / key `dice-fab-material`.
- [ ] 3.2-d Storage contains junk (`dice-fab-colorset = "bogus"`, `dice-fab-material = 7`) → resolved values are the defaults; no throw. _(da / "Unknown stored colorset id falls back to the default")_
- [ ] 3.2-e `LocalStore.get` throws → hook still initializes to defaults, exactly one `console.warn` mentioning the key. _(da / "Storage unavailable degrades to an in-session default")_
- [ ] 3.2-f `LocalStore.set` throws on `setDiceColorset` → no throw to caller, one `console.warn`, in-session `diceColorset` still reflects the new value. _(da / same)_
- [ ] 3.2-g Existing `sendToChat` / `disableAnimation` behavior unchanged (regression). _(existing gdf requirements)_

### Task 4.1 / 4.2 — `DiceAppearanceModal.test.tsx`

- [ ] 4.1-a Renders a `role="dialog"` with `aria-modal="true"` and an accessible name matching `/dice appearance/i`. _(gdf / "Opening the appearance modal from the dice panel")_
- [ ] 4.1-b Renders exactly one selectable control per `DICE_COLORSETS` entry, inside a `radiogroup`, under a plain-text category heading (assert the heading element is not a `<label>`). _(gdf / same; decision: paragraph text not `<label>` for non-input headings)_
- [ ] 4.1-c Renders 4 material controls (`Glass`, `Plastic`, `Metal`, `Wood`) in a second `radiogroup`. _(gdf / same)_
- [ ] 4.1-d Shows visible text stating the choice applies to the 3D roll animation only. _(gdf / same)_
- [ ] 4.1-e Currently-selected colorset/material controls have `aria-checked="true"`; others `false`. _(gdf / "Selecting an option persists it immediately")_
- [ ] 4.1-f Clicking a different colorset calls `onColorsetChange` with its id exactly once and no save button is required; same for material / `onMaterialChange`. _(gdf / same)_
- [ ] 4.1-g Keyboard: arrow keys move selection within a radiogroup; `Enter`/`Space` commits. _(gdf / "Opening the appearance modal...", a11y)_
- [ ] 4.1-h `Escape` calls `onClose` and the event's propagation is stopped (spy on a document-level capture listener registered below it — it must not fire). _(gdf / "Dismissing the appearance modal leaves the dice panel open")_
- [ ] 4.1-i `mousedown` outside `contentRef` calls `onClose`; `mousedown` inside does not; propagation stopped in both cases. _(gdf / same)_
- [ ] 4.1-j Focus moves into the modal on mount and is restored to the previously-focused element on unmount. _(gdf / same)_
- [ ] 4.1-k Opening/rendering the modal triggers no `import('@drdreo/dice-box-threejs')` (spy the dynamic import / module registry) and no `fetch` / network call. _(da / "Picker renders without loading the dice engine"; gdf NFAC / "Opening the modal does not load the dice engine")_
- [ ] 4.1-l Portal node is appended to `document.body` on mount and removed on unmount (no stranded node). _(gdf NFAC / "Recovery behavior")_

### Task 4.3 — Panel wiring (`GlobalDiceFab.test.tsx`)

- [ ] 4.3-a Panel open → a "Dice appearance" control is present with an accessible name. _(gdf / "Dice panel exposes a dice appearance control")_
- [ ] 4.3-b Activating it renders the appearance modal dialog. _(gdf / same; "Opening the appearance modal from the dice panel")_
- [ ] 4.3-c With the modal open, pressing `Escape` closes the modal only — the panel `role="dialog"` (labelled `global-dice-fab-heading`) is still in the document. _(gdf / "Dismissing the appearance modal leaves the dice panel open")_
- [ ] 4.3-d Outside-click on the modal backdrop closes the modal only, panel stays. _(gdf / same)_
- [ ] 4.3-e On modal close, focus returns to the "Dice appearance" trigger. _(gdf / same)_
- [ ] 4.3-f Selecting colorset + material in the modal updates `prefs` (assert `LocalStore.set` for both keys). _(gdf / "Selecting an option persists it immediately")_
- [ ] 4.3-g Existing `GlobalDiceFab` tests (roll flow, send-to-chat, disable-animation, overlay gating) remain green (regression). _(existing gdf requirements)_

### Task 5.1 / 5.2 — Animation option pass-through (`useDiceAnimation.test.ts`)

- [ ] 5.1-a With a mocked `DiceBox` and appearance `{colorset:'fire', material:'metal'}`, after a `run()` the constructor was called with options including `theme_colorset: 'fire'`, `theme_customColorset: null`, `theme_material: 'metal'`. _(da / "DiceBox is constructed with the persisted theme options"; gdf / "Appearance survives a reload and reaches the engine")_
- [ ] 5.1-b The pre-existing options (`assetPath`, `baseScale`, `sounds:false`, `shadows:false`, `iterationLimit`) are still passed with unchanged values. _(da / same)_
- [ ] 5.1-c Default appearance `{white, glass}` → constructor gets `theme_colorset:'white'`, `theme_material:'glass'`. _(gdf / "First-time user gets the default appearance")_
- [ ] 5.1-d `GlobalDiceFab` passes `{colorset: prefs.diceColorset, material: prefs.diceMaterial}` into `useDiceAnimation` (assert via the run/ mock wiring). _(gdf / "Appearance survives a reload and reaches the engine")_

### Task 5.3 — Outcome invariance & forced-face safety

- [ ] 5.3-a Seeded roll producing total `T` with default appearance → same seeded roll with `{colorset:'glitterparty', material:'wood'}` still reports total `T`. _(da / "Total is identical regardless of appearance")_
- [ ] 5.3-b Forced d4 (`@` notation) with material `wood` + textured colorset: the harnessed engine settles on matching faces → `run()` resolves `true`, reconcile passes, no warning. _(da / "Forced d4 with a non-glass material degrades safely")_
- [ ] 5.3-c Same setup but harness forces a face mismatch → `run()` resolves `true` (reveal), one `[dice-animation]` mismatch `console.warn`, no error thrown past `run()`, displayed total equals the decided roll. _(da / same)_
- [ ] 5.3-d Existing `d4EnginePatch` tripwire test and `reconcileDiceFaces` tests remain green (regression). _(existing dice-roll requirements)_

### Task 5.4 — Instant path is appearance-agnostic

- [ ] 5.4-a `DiceRollOverlay` with `disableAnimation` and a non-default appearance in storage renders identical `die-readout-chip` / inline output to the default-appearance render. _(da / "Non-animated paths ignore the appearance")_
- [ ] 5.4-b `DiePoolButton` render is unchanged by appearance (regression). _(da / same)_

### Task 6.1 — E2E (`dice-roll-animation.spec.ts` sibling)

- [ ] 6.1-a Open dice panel → open appearance modal → select a non-default colorset and material → close modal → reload page → open panel → roll → the engine-construction probe reports the chosen `theme_colorset` / `theme_material`, and the result total banner is visible. _(gdf / "Appearance survives a reload and reaches the engine")_
- [ ] 6.1-b Reduced-motion / animation-disabled variant: same selection, roll reveals instantly, total correct, no engine construction. _(da / "Non-animated paths ignore the appearance")_
- [ ] 6.1-c Test server runs on a non-3000 free port. _(project constraint)_

### Task 7.3 — Traceability gate

- [ ] 7.3-a A checklist review (not code) confirming every `#### Scenario:` block in `specs/dice-appearance/spec.md` and `specs/global-dice-fab/spec.md` is referenced by at least one test case id above.

## Coverage Summary

| Spec scenario | Test case(s) |
| --- | --- |
| da: Registry exposes only non-licensed, non-novelty colorsets | 2.1-a, 2.1-b, 2.1-c, 2.1-f |
| da: Materials are limited to the confirmed engine preset keys | 1.1-a, 2.1-e |
| da: All registry colorset textures exist on disk | 1.1-b, 2.3-a, 2.3-b |
| da: Unknown stored colorset id falls back to the default | 2.4-b, 2.4-c, 2.4-d, 3.2-d |
| da: Storage unavailable degrades to an in-session default | 3.2-e, 3.2-f |
| da: DiceBox is constructed with the persisted theme options | 2.4-a, 5.1-a, 5.1-b |
| da: Non-animated paths ignore the appearance | 5.4-a, 5.4-b, 6.1-b |
| da: Total is identical regardless of appearance | 5.3-a |
| da: Forced d4 with a non-glass material degrades safely | 5.3-b, 5.3-c |
| da NFAC: Picker renders without loading the dice engine | 4.1-k |
| da NFAC: Reliability / engine upgrade renames a colorset | 2.3-a (build gate), 2.4-b |
| gdf: Opening the appearance modal from the dice panel | 4.1-a, 4.1-b, 4.1-c, 4.1-g, 4.3-b |
| gdf: Dismissing the appearance modal leaves the dice panel open | 4.1-h, 4.1-i, 4.1-j, 4.3-c, 4.3-d, 4.3-e |
| gdf: Selecting an option persists it immediately | 4.1-e, 4.1-f, 4.3-f, 3.2-b, 3.2-c |
| gdf: Appearance survives a reload and reaches the engine | 3.2-b, 5.1-a, 5.1-d, 6.1-a |
| gdf: First-time user gets the default appearance | 2.1-f, 3.2-a, 5.1-c |
| gdf: Dice panel exposes a dice appearance control | 4.3-a |
| gdf NFAC: Opening the modal does not load the dice engine | 4.1-k |
| gdf NFAC: Access control (unauth) | 4.3-g (regression of existing auth gate) |
| gdf NFAC: Recovery behavior (portal cleanup) | 4.1-l |
| Regression: existing dice fab / animation / reconcile / d4 patch | 3.2-g, 4.3-g, 5.3-d, 5.4-b |
