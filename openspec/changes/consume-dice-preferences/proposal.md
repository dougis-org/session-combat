## GitHub Issues

- #701

## Why

- Problem statement: `preferences.dice.color` and `preferences.dice.surface` are persisted and editable on `/profile`, but nothing in the dice engine reads them. Separately, a different, LocalStore-only appearance pair (`diceColorset` / `diceMaterial`, set via the dice-fab `DiceAppearanceModal`) already drives `DiceBox` construction, so the profile settings and the actual rendered dice have been silently disconnected since PR #674.
- Why now: this is the only remaining follow-up from the profile-settings change (Decision 4); leaving it undone means the `/profile` dice fields are dead controls that mislead users into thinking they change anything.
- Business/user impact: users who set a dice color/surface on `/profile` see no effect; users who want an account-synced dice appearance (across devices) have no working path, only a per-browser LocalStore picker.

## Problem Space

- Current behavior:
  - `DiceBox` is constructed in `lib/dice/useDiceAnimation.ts` with `theme_colorset` / `theme_customColorset` (hardcoded `null`) / `theme_material`, sourced from `useDiceFabPreferences` (`diceColorset`, `diceMaterial`), which reads/writes `LocalStore` keys `dice-fab-colorset` / `dice-fab-material` — never `preferences.dice.*`.
  - `theme_surface` (the tray/table surface — a fourth, distinct engine knob) is never passed at all; the engine defaults to `'green-felt'`.
  - `preferences.dice.color` is validated as a hex `string | null`; `preferences.dice.surface` is validated as an unconstrained `string | null`. Neither is read anywhere outside `/profile` and the preferences sync layer.
- Desired behavior: `preferences.dice.color`, `preferences.dice.surface`, and a new `preferences.dice.material` are the single source of truth for `DiceBox` construction (`theme_customColorset`, `theme_surface`, `theme_material` respectively). `/profile` is the only UI that edits dice appearance; the LocalStore gallery path is removed.
- Constraints:
  - The engine's actual option shapes are fixed by `@drdreo/dice-box-threejs` and are not ours to redefine: `theme_customColorset: { foreground, background, texture?, outline? }` (merged onto `fl.white`), `theme_material: 'glass' | 'none' | 'metal' | 'wood'`, `theme_surface: 'green-felt' | 'wood-table' | 'wood-tray' | 'metal'`.
  - `DiceBox` construction is lazy-loaded (`import('@drdreo/dice-box-threejs')`); resolving preference values into engine options must not force that import path to change or run eagerly.
  - `dice.surface`'s `'metal'` value and `dice.material`'s `'metal'` value refer to different things (tray finish vs. die material) — this is an existing engine-level naming collision, not something this change can rename, but the schema/UI must not conflate the two.
- Assumptions:
  - No migration of existing `dice-fab-colorset` / `dice-fab-material` LocalStore values into `preferences.dice.*` — per explicit product decision, anything not already in `preferences.dice.*` is dropped in favor of engine defaults once the gallery path is removed.
  - `theme_colorset` (named preset) is superseded by `theme_customColorset` for any user who has set `preferences.dice.color`; when `dice.color` is `null`, the engine's own default (`fl.white`) is used and neither `theme_colorset` nor `theme_customColorset` needs to be passed.
- Edge cases considered:
  - A user who never opens `/profile`: all three keys are `null`/absent → engine defaults apply (no `theme_customColorset`, `theme_material` omitted or default `'glass'`, `theme_surface` omitted or default `'green-felt'`).
  - A `preferences.dice.color` object with only one of `foreground`/`background` set, or an invalid hex on one field: schema validation must reject the whole value (not silently drop the bad field) so a partially-invalid color is never persisted.
  - Existing users with a stale `dice-fab-colorset`/`dice-fab-material` LocalStore value and no `preferences.dice.*` set: they see a visual change (revert to engine defaults) the next time they roll, since the gallery path is removed without migration.

## Scope

### In Scope

- Schema changes: `dice.color` becomes `{ foreground: string; background: string } | null`; `dice.surface` becomes a closed enum matching the engine's `theme_surface` values; new `dice.material` preference matching the engine's `theme_material` values.
- Wiring `preferences.dice.color` / `.surface` / `.material` into `DiceBox` construction in `useDiceAnimation.ts`, replacing the current `useDiceFabPreferences`-sourced values.
- Removing the LocalStore dice-appearance gallery: `useDiceFabPreferences`'s `diceColorset`/`diceMaterial` state and reducer, `DiceAppearanceModal`, and the `dice-fab-colorset`/`dice-fab-material` LocalStore keys.
- Reworking the `/profile` dice appearance UI to edit the new object/enum shapes (color swatch or foreground/background hex pair, surface `<select>`, material `<select>`).
- Updating `KEY_VALIDATORS`, `resolvePreferences`, `DEFAULT_PREFERENCES`, and any `PreferenceValues` type definitions for the new shapes.

### Out of Scope

- Any change to `theme_colorset` named-preset selection (the curated `DICE_COLORSETS` registry in `lib/dice/diceAppearance.ts`) beyond removing its only remaining consumer (`DiceAppearanceModal`); the registry data itself is left in place in case a future change wants a preset picker built on `preferences.dice.color`.
- Renaming the engine's colliding `'metal'` value between `theme_surface` and `theme_material` — out of our control, handled by keeping the two preferences on visibly distinct UI controls with distinct labels.
- Any backend/API changes beyond what `usePreferences`'s existing sync mechanism already provides for new/changed preference shapes.
- Migrating LocalStore gallery values into the new preferences (explicitly decided against).

## What Changes

- `lib/preferences/schema.ts`: `dice.color` type and validator change from hex string to `{ foreground, background }` object; `dice.surface` validator tightens to the engine's four-value enum; new `dice.material` key, type, validator, and default.
- `lib/preferences/usePreferences.tsx`: `PreferencePath` gains `'dice.material'`; `ALL_PATHS` updated.
- `lib/dice/useDiceAnimation.ts`: `DiceBox` construction reads `theme_customColorset` / `theme_surface` / `theme_material` from `preferences.dice.*` instead of the `appearance` prop sourced from `useDiceFabPreferences`.
- `lib/dice/useDiceFabPreferences.ts`: `diceColorset` / `diceMaterial` state, the `appearanceReducer`, and `LocalStore` read/write helpers for `dice-fab-colorset` / `dice-fab-material` are removed; the hook's remaining responsibilities (`sendToChat`, `disableAnimation`) are preserved.
- `lib/components/dice/DiceAppearanceModal.tsx`: removed (or repurposed, TBD in design) along with its call site.
- `app/profile/page.tsx`: dice appearance section reworked for the new color-object and enum-based surface/material controls.
- `lib/dice/diceAppearance.ts`: `DICE_COLORSETS` / `DICE_MATERIALS` registries and `resolveDiceAppearance` either removed or retained as inert reference data (decided in design.md) since their only consumer goes away.

## Risks

- Risk: Removing the gallery changes the rendered dice appearance for any existing user relying on a LocalStore-only choice, with no migration path.
  - Impact: Medium — visible but cosmetic; no data loss beyond a display preference.
  - Mitigation: Explicit product decision (this proposal); communicate via release notes if desired (outside this change's scope).
- Risk: `theme_customColorset`'s exact merge behavior (onto `fl.white`, via `Object.assign`) is only known from reading the vendored engine bundle, not from published docs/types (`theme_customColorset?: any` in the `.d.ts`).
  - Impact: Medium — an incorrect object shape could silently render an unexpected color or throw during `loadTheme`.
  - Mitigation: design.md documents the exact object shape verified in `node_modules/@drdreo/dice-box-threejs/dist/dice-box-threejs.es.js`; tasks.md includes a manual verification step against the running engine, and unit tests assert the constructed `DiceConfig` object shape rather than relying on the engine's runtime behavior.
- Risk: New `dice.surface` / `dice.material` enums are tied to the current version of `@drdreo/dice-box-threejs`; an engine upgrade that changes its valid values would silently invalidate stored preferences.
  - Impact: Low — `resolvePreferences`-style repair already exists as a pattern for exactly this (see `resolveDiceAppearance` precedent); an out-of-enum stored value degrades to default rather than crashing.
  - Mitigation: apply the same repair-to-default pattern in the new schema validators/resolvers.

## Open Questions

- Question: Does `DiceAppearanceModal` get deleted outright, or repurposed as the picker UI for the new `/profile` color/material controls (its category/swatch UX may be worth keeping, just rebound to `preferences.dice.*`)?
  - Needed from: product/design call, or default to a reasonable choice in design.md.
  - Blocker for apply: no — design.md will make a call; can be revisited without changing proposal scope.
- Question: Should `/profile`'s color input remain free-hex-entry (now as a foreground/background pair) or move to a swatch/preset picker sourced from `DICE_COLORSETS`-style data?
  - Needed from: none — resolved in design.md based on minimizing scope; free-hex-pair inputs reuse the existing validation pattern from FU-3.
  - Blocker for apply: no.

No other unresolved ambiguity: the engine option shapes, deprecation decision, and new `dice.material` key were all confirmed during the preceding `/opsx:explore` session and issue #701's refined criteria.

## Non-Goals

- Building a new visual dice-color/material picker component from scratch (reuse existing `<select>` / hex-input patterns already used on `/profile`).
- Cross-device sync correctness testing beyond what `usePreferences`'s existing test suite already covers for other preference keys.
- Changing how `theme_colorset` presets are curated or vendoring additional engine textures.

## Change Control

If scope changes after proposal approval, update `proposal.md`, `design.md`,
`specs/**/*.md`, and `tasks.md` before implementation starts.
