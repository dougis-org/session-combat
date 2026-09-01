## GitHub Issues

- #618

## Why

- Problem statement: The 3D dice tumble rendered by `@drdreo/dice-box-threejs` in `GlobalDiceFab` always uses the engine default look (`theme_colorset: "white"`, `theme_material: "glass"`). Users have no way to personalize their dice, which the issue calls out as a wanted immersion/UX feature.
- Why now: The engine already bundles a full theming system and every texture it references is already vendored into `public/dice-box-threejs/textures/`. The appearance "library" the issue asks us to "find" effectively already exists in the repo — only the selection UI and preference plumbing are missing. A separate branch (`add-user-preference-persistence`) has also already reserved a `dice.color` preference slot, so aligning now avoids rework later.
- Business/user impact: Higher-personality dice rolling makes the core dice feature feel less generic; gives players a lightweight way to express identity at the table without any backend or asset-hosting cost.

## Problem Space

- Current behavior:
  - `lib/dice/useDiceAnimation.ts` constructs `new DiceBox(container, { assetPath, baseScale, sounds, shadows, iterationLimit })` with no appearance options.
  - `lib/dice/useDiceFabPreferences.ts` persists two prefs (`dice-fab-send-to-chat`, `dice-fab-disable-animation`) via `LocalStore` using a `useReducer` `INIT` pattern (decision n125).
  - `lib/components/GlobalDiceFab.tsx` renders the dice panel with two inline checkboxes for those prefs; there is no dedicated settings surface.
  - The non-animated result surfaces (`DieReadoutChip` numeric chips in `DiceRollOverlay`, the inline result line in the panel) carry no dice styling and are unaffected by any appearance choice (issue #634 deliberately removed die-face art).
- Desired behavior:
  - A dedicated "Dice appearance" configuration modal, opened from the dice panel, presenting a gallery of preset colorsets and a material picker.
  - The chosen colorset + material persist to `localStorage` and are applied to every subsequent 3D tumble.
  - The preference is stored in a shape that the `add-user-preference-persistence` provider can adopt later without a data migration headache.
- Constraints:
  - `@drdreo/dice-box-threejs` stays pinned at `1.1.0` (decision n163 / n082 — a checked-in `patch-package` patch, #627, targets that exact release).
  - No third-party asset host, no runtime downloads (`scripts/vendor-dice-assets.mjs` convention). Any colorset exposed in the gallery must have its referenced texture already present under `public/dice-box-threejs/textures/`.
  - Client-only preference; no new API routes in this change.
  - Engine is loaded lazily and may be `'unsupported'` (no WebGL) — the settings UI must not depend on the engine module being loaded.
- Assumptions:
  - The engine reads `theme_colorset` and `theme_material` from its constructor options at `initialize()` time; changing them requires a fresh `DiceBox` instance, which already happens per roll (`teardown()` + `new DiceBox()` in `run()`).
  - Named colorsets (e.g. `fire`, `bloodmoon`) each bundle their own foreground/background/outline/texture, so persisting just the set id is sufficient and smaller than a hex + derived fields.
  - The ~20 non-licensed sets are: Colors (`white`, `black`, `rainbow`), Damage Types (`radiant`, `fire`, `ice`, `poison`, `acid`, `thunder`, `lightning`, `air`, `water`, `earth`, `force`, `psychic`, `necrotic`), Custom Sets (`breebaby`, `pinkdreams`, `inspired`, `bloodmoon`, `starynight`, `glitterparty`, `astralsea`, `bronze`). The `Other` category (`tigerking`, `acleaf`, `isabelle`, `thecage`) and the `test` set are excluded as low-quality/novelty; the Star Wars ™ categories are excluded for licensing.
- Edge cases considered:
  - Stored colorset/material id no longer valid (engine upgrade, hand-edited storage) → fall back to engine defaults, do not throw.
  - `localStorage` unavailable / read fails → degrade to in-session default, log once (matches `useDiceFabPreferences` `safeGet`/`safeSet`).
  - Animation disabled or WebGL unsupported → appearance is a no-op; the settings modal should communicate that it only affects the 3D animation.
  - A colorset whose texture asset is missing → validated out of the gallery at build/test time so the engine never requests a 404.
  - Forced faces (`@` notation, incl. the restored d4 forcing from #627) must still land correctly with a non-default colorset/material — `reconcileDiceFaces` already degrades a mismatch to an instant reveal, but this needs an explicit test.
  - Reduced-motion users: unchanged; appearance choice is independent of the `disableAnimation` tri-state.

## Scope

### In Scope

- A new `diceColorset` and `diceMaterial` preference, persisted to `localStorage` via the existing `LocalStore` + `useReducer` `INIT` pattern (extending or paralleling `useDiceFabPreferences`).
- A curated constant listing the allowed colorsets (id, display name, category, swatch colors) and allowed materials, with a test asserting every colorset's texture asset exists under `public/`.
- A new configuration modal component opened from the `GlobalDiceFab` dice panel via a "Dice appearance" / gear affordance: a gallery of colorset options (visual swatch + name, grouped by category) and a material selector (`glass`, `plastic`, `metal`, `wood`), with keyboard and screen-reader support and the existing overlay/portal + Escape/outside-click conventions (decision n047).
- Passing `theme_colorset` and `theme_customColorset: null` + `theme_material` through to `new DiceBox(...)` in `lib/dice/useDiceAnimation.ts`.
- A short note in the modal that appearance applies to the 3D roll animation only.
- Unit tests (preference hook, colorset registry/asset check, modal behavior, `useDiceAnimation` option pass-through) and an E2E check that a selected appearance survives reload and reaches the engine constructor.
- Spec deltas for the `global-dice-fab` capability (new configuration modal + persisted appearance) and a new `dice-appearance` capability (the colorset/material registry and its constraints), plus any needed `dice-roll` / animation capability delta for the engine option pass-through.

### Out of Scope

- Server-backed persistence / syncing the preference across devices (owned by `add-user-preference-persistence`; this change only makes the local shape compatible).
- A free-form hex color picker / custom colorset builder (`theme_customColorset`). Possible follow-up.
- Applying dice styling to the numeric-chip readout, the inline result line, or the `DiePoolButton` icons.
- The dice tray / surface (`theme_surface`), lighting, sounds, shadows, or scale settings.
- Per-campaign or per-die-size appearance; a single global appearance only.
- Exposing the Star Wars ™ colorsets or the novelty `Other` sets.
- Upgrading `@drdreo/dice-box-threejs`.

## What Changes

- Add `dice-fab-colorset` and `dice-fab-material` (or a single `dice-fab-appearance` object) `localStorage` keys and expose them from the dice-fab preferences hook with safe read/write and default fallback.
- Add `lib/dice/diceAppearance.ts` (or similar): `DICE_COLORSETS` registry (curated, non-licensed), `DICE_MATERIALS` list, default ids, and a validator that resolves an unknown stored id to the default.
- Add a test that every `DICE_COLORSETS[*]` texture is present under `public/dice-box-threejs/textures/`.
- Add `lib/components/dice/DiceAppearanceModal.tsx` (name TBD): gallery + material picker, following overlay/portal + focus + Escape/outside-click conventions.
- Add a trigger control to the `GlobalDiceFab` panel to open the modal.
- In `lib/dice/useDiceAnimation.ts`, accept the resolved appearance (via hook or argument) and pass `theme_colorset` + `theme_material` to `new DiceBox(...)`.
- Wire `GlobalDiceFab` to read the appearance pref and hand it to `useDiceAnimation`.
- Update `openspec/specs/global-dice-fab/spec.md` via a change delta; add a new `dice-appearance` capability spec.

## Risks

- Risk: A curated colorset references a texture that is not actually vendored (or an engine internal name differs from the observed minified string).
  - Impact: Engine requests a missing asset → console error, possibly a broken-looking die.
  - Mitigation: Build/CI test asserting each colorset's texture file exists; start the curated list from only sets whose textures are confirmed present in `public/dice-box-threejs/textures/`.
- Risk: `theme_material` values other than the default interact badly with the #627 d4 forced-face patch (which calls `createMaterials`).
  - Impact: Forced d4 (or other forced faces) could mismatch the decided roll.
  - Mitigation: `reconcileDiceFaces` already turns a mismatch into an immediate instant reveal (safe degradation); add an explicit test rolling a forced d4 with a non-glass material and assert either a correct settle or a clean reconcile-mismatch fallback (no crash, no wrong total).
- Risk: Preference shape diverges from what `add-user-preference-persistence` expects, forcing a migration.
  - Impact: Extra work / a stale key when that branch lands.
  - Mitigation: Store the same primitive shape that branch's schema would use (short string ids under a `dice` namespace), document the intended `PreferenceValues.dice` keys in `design.md`, and coordinate the key names with that branch before merge.
- Risk: Gallery of ~20 3D-ish swatches is visually heavy / slow in a small bottom-left modal.
  - Impact: Cluttered UI, layout pressure on small viewports.
  - Mitigation: Use flat CSS swatches derived from each set's fg/bg colors (no engine render, no thumbnails); group by category; keep the modal scrollable with a sensible max-height, consistent with existing dice overlays.
- Risk: Engine's actual accepted `theme_material` set differs from `glass/plastic/metal/wood`.
  - Impact: An unsupported material silently falls back or errors.
  - Mitigation: Confirmed against the engine bundle (`J_` preset table: `glass`, `metal`, `perfectmetal`, `wood`, `none`); only ship confirmed values; validator coerces unknown → default (`glass`).

## Open Questions

- Question: Single combined `dice-fab-appearance` JSON key, or two scalar keys (`dice-fab-colorset`, `dice-fab-material`)? Two scalars matches the existing one-key-per-pref style; one object is closer to `PreferenceValues.dice`.
  - Needed from: requester / maintainer preference
  - Blocker for apply: no (design will pick one; default recommendation: two scalar keys now, mapped to `dice.{colorset,material}` later)
- Question: Should the gallery also surface a small "preview" (e.g. a static representative image per set) or is a flat color swatch + name enough for v1?
  - Needed from: requester
  - Blocker for apply: no (default: flat swatch + name)
- Question: Is `rainbow` / `glitterparty` acceptable, or should the v1 list be trimmed to the more "serious" sets?
  - Needed from: requester
  - Blocker for apply: no (default: include all ~20 non-licensed, non-novelty sets)
- Question: ~~Confirm the exact accepted `theme_material` values for `@drdreo/dice-box-threejs@1.1.0`.~~ RESOLVED during proposal by inspecting the engine bundle. The engine's material preset table (`J_`) accepts: `glass` (default), `metal`, `perfectmetal`, `wood`, and `none` (rendered as a Phong "Plastic" material). The gallery will expose **Glass / Plastic (`none`) / Metal (`metal`) / Wood (`wood`)**; `perfectmetal` is optional and can be added in `design`. `theme_material` is applied via `colorData.texture.material`, so a per-die-size override is not needed.
  - Needed from: n/a — resolved
  - Blocker for apply: no

## Non-Goals

- Not building a general user-settings page; the modal is dice-scoped and lives with the dice fab.
- Not persisting appearance server-side or across devices in this change.
- Not theming any 2D dice representation (icons, chips, inline text).
- Not adding custom/user-defined colorsets or a hex picker.
- Not changing dice fairness, formula building, submission, or the reconcile/instant-reveal behavior.

## Change Control

If scope changes after proposal approval, update `openspec/changes/add-dice-appearance-gallery/proposal.md`,
`openspec/changes/add-dice-appearance-gallery/design.md`,
`openspec/changes/add-dice-appearance-gallery/specs/**/*.md`, and
`openspec/changes/add-dice-appearance-gallery/tasks.md` before implementation starts.
