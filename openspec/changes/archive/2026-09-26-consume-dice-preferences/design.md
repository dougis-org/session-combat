## Context

- Relevant architecture: React Context (`usePreferences`) syncing `PreferenceValues` to `app/api/me/preferences`; `lib/dice/useDiceAnimation.ts` lazy-loads `@drdreo/dice-box-threejs` and constructs `DiceBox` per roll; `lib/components/GlobalDiceFab.tsx` is the only call site of `useDiceAnimation`, currently sourcing appearance from `useDiceFabPreferences` (LocalStore-backed) and hosting its own `DiceAppearanceModal` trigger.
- Dependencies: `lib/preferences/schema.ts` (validators/types/defaults), `lib/preferences/usePreferences.tsx` (`PreferencePath`/`ALL_PATHS`), `lib/dice/diceAppearance.ts` (registries to be retired), `@drdreo/dice-box-threejs`'s `DiceConfig` (`theme_customColorset`, `theme_material`, `theme_surface`).
- Interfaces/contracts touched: `PreferenceValues.dice` shape, `DiceAppearanceOptions` (renamed/reshaped) passed into `useDiceAnimation`, `DiceConfig` options passed into `new DiceBox(...)`.

## Goals / Non-Goals

### Goals

- `preferences.dice.color` / `.surface` / `.material` are the only inputs to `DiceBox`'s appearance-related construction options.
- Schema shapes match the engine's actual option shapes exactly, so no lossy or ambiguous mapping step exists between preference and engine config.
- `/profile` is the only UI surface for setting dice appearance.

### Non-Goals

- Preset/named-colorset picker UX (the removed `DiceAppearanceModal`'s swatch grid) is not rebuilt; `/profile` uses plain hex/select inputs, consistent with its existing `dice.color`/`dice.surface` fields.
- Renaming `useDiceFabPreferences` (it keeps `sendToChat`/`disableAnimation`, which are still fab-scoped) or `GlobalDiceFab` — only their appearance-related surface is removed.
- Any change to how `usePreferences` syncs/debounces/retries.

## Decisions

### Decision 1: `dice.color` becomes an object matching `theme_customColorset`

- Chosen: `PreferenceValues.dice.color: { foreground: string; background: string } | null`. `KEY_VALIDATORS["dice.color"]` requires both fields to be present and each to pass the existing `HEX_COLOR` regex; any other shape (missing field, extra field ignored, wrong type) is rejected as a whole (not partially repaired).
- Alternatives considered: (a) keep `color` as a single hex string and derive `background`/`foreground` by convention (e.g. background = color, foreground = computed contrast) — rejected because it hides a design decision (what's foreground vs background) behind an implicit convention with no way for the user to control it; (b) a richer object also carrying `texture`/`outline` overrides — rejected as unnecessary surface area beyond what #701 asked for; can be added later without a breaking change since it's additive to the object.
- Rationale: `theme_customColorset` is merged onto `fl.white` (`Object.assign({}, fl.white, customColorset)` in the vendored engine, `dist/dice-box-threejs.es.js`) and only inspects `background`/`foreground`/`texture`/`outline`; matching its shape 1:1 means the construction step is a straight pass-through with no translation logic to get wrong.
- Trade-offs: `/profile`'s single hex input becomes two inputs; the existing FU-3 per-field draft/validation pattern (`colorDraft` local state + `aria-invalid`) is duplicated per field rather than reused as-is.

### Decision 2: `dice.surface` enum matches `theme_surface` exactly

- Chosen: `PreferenceValues.dice.surface: 'green-felt' | 'wood-table' | 'wood-tray' | 'metal' | null`. `KEY_VALIDATORS["dice.surface"]` becomes a closed-set check against these four values (plus `null`), replacing the current `typeof v === "string"` check and superseding the profile-settings design's `wood|metal|stone|felt` guess (Decision 3 in `openspec/changes/archive/2026-09-03-profile-settings/design.md`), which does not match the engine and included a non-existent `'stone'` value.
- Alternatives considered: keep a display-friendly enum (`wood`/`metal`/`stone`/`felt`) and translate to engine values at construction time — rejected: `stone` has no engine equivalent (would need to silently collapse to something, misleading the user), and a translation table is one more place for the two enums to drift out of sync as the engine version changes.
- Rationale: same reasoning as Decision 1 — matching the engine's own enum removes a translation layer and a whole class of "what does `stone` map to" bugs.
- Trade-offs: the persisted value's raw form (`'wood-table'`) is less friendly than a hand-picked `wood`/`stone` word; `/profile`'s `<option>` labels do the friendliness work instead (e.g. `<option value="wood-table">Wood Table</option>`).

### Decision 3: new `dice.material` preference, enum matches `theme_material`

- Chosen: `PreferenceValues.dice.material: 'glass' | 'none' | 'metal' | 'wood' | null`, a new sibling key next to `color`/`surface`. `'none'` is kept as the engine's literal value (its display label is "Plastic", matching the retired `DICE_MATERIALS` registry's labeling) rather than renamed, to avoid a schema-vs-engine string mismatch.
- Alternatives considered: fold material into the `dice.color` object (per the earlier explore-mode option) — rejected per your explicit choice of a separate `dice.material` key, since `theme_material` is independent of colorset in the engine and conflating them in one object would make "clear the color but keep the material" (or vice versa) awkward to express.
- Rationale: matches the engine's real three-knob split (`theme_customColorset` / `theme_material` / `theme_surface`) with one preference key per knob.
- Trade-offs: one more key to add to `KEY_VALIDATORS`, `ALL_PATHS`, `DEFAULT_PREFERENCES`, and `/profile`'s form; `null` semantics must be documented (see Decision 4) since "no material chosen" and "explicitly chose the engine's default material" are the same state.

### Decision 4: `null` means "omit the option", not "pass the engine's default value"

- Chosen: at `DiceBox` construction, a `null` (or default-`null`) `dice.color`/`.material`/`.surface` means that `DiceConfig` key is omitted entirely, letting the engine apply its own internal default. No `DEFAULT_COLORSET`/`DEFAULT_MATERIAL`-style constants are duplicated in our code for this path.
- Alternatives considered: mirror the removed `resolveDiceAppearance`'s pattern of always passing a concrete fallback (`'glass'`, `'green-felt'`) — rejected as redundant: the engine already has these defaults, and hardcoding them a second time risks the two silently diverging on a future engine upgrade.
- Rationale: fewer places for "the default" to be defined; if the vendored engine's own default ever changes, our behavior tracks it automatically.
- Trade-offs: a unit test asserting "no color/material/surface preference set → these keys are absent from the constructed `DiceConfig`" is needed in place of a test asserting a specific fallback value.

### Decision 5: `useDiceAnimation`'s appearance input is reshaped to the engine's three knobs

- Chosen: replace `DiceAppearanceOptions { colorset: string; material: string }` with `DiceAppearanceOptions { customColorset: { foreground: string; background: string } | null; material: PreferenceValues['dice']['material']; surface: PreferenceValues['dice']['surface'] }`. `GlobalDiceFab.tsx` builds this object from `usePreferences().preferences.dice` and passes it to `useDiceAnimation(...)`, replacing today's `{ colorset: prefs.diceColorset, material: prefs.diceMaterial }` built from `useDiceFabPreferences`.
- Alternatives considered: have `useDiceAnimation` call `usePreferences()` internally instead of taking an options prop — rejected to keep `useDiceAnimation` free of a dependency on the preferences context, preserving its current testability (tests already construct it with an explicit `appearance` argument, per `tests/unit/lib/dice/__helpers__/diceAnimationHarness.ts`).
- Rationale: minimal-diff extension of the existing prop-drilling shape; keeps `useDiceAnimation` a pure function of its inputs.
- Trade-offs: none significant — this is a like-for-like reshape of an existing, already-injected prop.

### Decision 6: retire the LocalStore gallery path entirely

- Chosen: remove from `lib/dice/useDiceFabPreferences.ts`: the `diceColorset`/`diceMaterial` state, `appearanceReducer`, `AppearanceAction`/`AppearanceState` types, the `COLORSET_KEY`/`MATERIAL_KEY` LocalStore constants, and `safeGet`/`safeSet` calls tied to them (the hook keeps `sendToChat`/`disableAnimation` and their existing helpers). Remove `lib/components/dice/DiceAppearanceModal.tsx` and its "Dice appearance" trigger button + `appearanceOpen` state + focus-restore effect from `lib/components/GlobalDiceFab.tsx`. Remove `DICE_COLORSETS`, `DICE_COLORSET_CATEGORIES`, `DICE_MATERIALS`, `resolveDiceAppearance`, `DEFAULT_COLORSET`, `DEFAULT_MATERIAL` from `lib/dice/diceAppearance.ts` (its only consumers are the removed modal and the reshaped `useDiceAnimation` default, which no longer needs a colorset/material fallback per Decision 4) — if nothing else imports the file afterward, delete it.
- Alternatives considered: keep the modal as an alternate "quick preset" entry point that also writes to `preferences.dice.*` — rejected per your explicit instruction that `/profile` is the sole control and anything not fed through user preferences is deprecated.
- Rationale: two independent UIs claiming to control the same rendered property is the exact defect #701 exists to fix; keeping one alive (even rewired) reintroduces it.
- Trade-offs: existing users lose the in-panel quick-access appearance picker and must go to `/profile` instead; no migration of their current LocalStore choice (explicit product decision, proposal.md Risks).

### Decision 7: canonical enum value lists live in `schema.ts`, not a separate registry

- Chosen: export `DICE_SURFACE_VALUES` and `DICE_MATERIAL_VALUES` (the literal tuples backing the new enum types) from `lib/preferences/schema.ts`, and have `/profile`'s `<select>` options iterate them (paired with a small local display-label map for friendly text) instead of hardcoding `<option>` values separately.
- Alternatives considered: leave `lib/dice/diceAppearance.ts` alive purely as a values-registry for the UI — rejected: keeping a file alive for one exported constant list, when its validator needs the same list anyway, just relocates the drift risk instead of removing it.
- Rationale: a single source of truth for "what are the valid values" that both the validator and the UI read from cannot drift apart.
- Trade-offs: `schema.ts` (already the shared client/server/API schema module) picks up two more exports; acceptable given it already owns `DOCK_MIN_HEIGHT`/`DOCK_MAX_HEIGHT` as similar UI-relevant constants.

## Proposal to Design Mapping

- Proposal element: `dice.color` schema change to `{ foreground, background }`
  - Design decision: Decision 1
  - Validation approach: unit tests in `tests/unit/lib/preferences/schema.test.ts` for `isValidPreferenceValue('dice.color', ...)` (valid object, missing field, invalid hex on one field, `null`)
- Proposal element: `dice.surface` enum tightened to engine values
  - Design decision: Decision 2
  - Validation approach: unit tests for the closed-set validator; `resolvePreferences` repair test for an out-of-enum stored value
- Proposal element: new `dice.material` preference
  - Design decision: Decision 3
  - Validation approach: unit tests mirroring `dice.surface`'s validator tests; `DEFAULT_PREFERENCES`/`ALL_PATHS`/`sparseKnownValues` coverage
- Proposal element: wire preferences into `DiceBox` construction
  - Design decision: Decisions 4 and 5
  - Validation approach: unit test on `useDiceAnimation`'s constructed `DiceConfig` (via the existing `diceBoxMockFactory` harness) asserting `theme_customColorset`/`theme_material`/`theme_surface` reflect the passed `appearance`, and are omitted when `null`
- Proposal element: remove the LocalStore gallery path
  - Design decision: Decision 6
  - Validation approach: delete now-orphaned tests for `DiceAppearanceModal`/`useDiceFabPreferences` appearance state; `grep`-level check (or a lint/test asserting no remaining imports) that `dice-fab-colorset`/`dice-fab-material` keys are gone from the codebase
- Proposal element: rework `/profile` dice UI
  - Design decision: Decision 7
  - Validation approach: component test asserting the foreground/background inputs and the surface/material `<select>`s round-trip through `setPreference` with the new shapes

## Functional Requirements Mapping

- Requirement: Setting a dice color on `/profile` changes the rendered dice colorset the next time dice are rolled.
  - Design element: Decisions 1, 4, 5
  - Acceptance criteria reference: specs/dice-appearance/spec.md — "Scenario: custom dice color is applied at DiceBox construction"
  - Testability notes: unit test against `useDiceAnimation`'s constructed `DiceConfig`, no real WebGL/engine needed (mocked via `diceBoxMockFactory`)
- Requirement: Setting a dice surface on `/profile` changes the rendered tray surface.
  - Design element: Decisions 2, 4, 5
  - Acceptance criteria reference: specs/dice-appearance/spec.md — "Scenario: custom dice surface is applied at DiceBox construction"
  - Testability notes: same harness, asserting `theme_surface`
- Requirement: Setting a dice material on `/profile` changes the rendered die material.
  - Design element: Decisions 3, 4, 5
  - Acceptance criteria reference: specs/dice-appearance/spec.md — "Scenario: custom dice material is applied at DiceBox construction"
  - Testability notes: same harness, asserting `theme_material`
- Requirement: An invalid or partially-invalid `dice.color` object is rejected, not silently repaired field-by-field.
  - Design element: Decision 1
  - Acceptance criteria reference: specs/profile-settings/spec.md — "Scenario: invalid dice color object is rejected"
  - Testability notes: schema unit test, `isValidPreferenceValue`/`validatePreferencePatch`
- Requirement: `/profile` is the only UI that can change dice appearance; the dice-fab panel no longer offers an appearance picker.
  - Design element: Decision 6
  - Acceptance criteria reference: specs/dice-appearance/spec.md — "Scenario: dice fab panel has no appearance control"
  - Testability notes: component test on `GlobalDiceFab` asserting no "Dice appearance" trigger renders

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: an out-of-enum or malformed stored `dice.*` value (e.g. from a future engine downgrade, or hand-edited via the API) degrades to `null`/default rather than crashing preference resolution.
  - Design element: existing `resolvePreferences` repair-per-key pattern, applied unchanged to the new validators (Decisions 1–3)
  - Acceptance criteria reference: specs/profile-settings/spec.md — "Scenario: malformed stored dice preference degrades to default"
  - Testability notes: unit test on `resolvePreferences` with a corrupt stored document
- Requirement category: performance
  - Requirement: resolving preferences into `DiceConfig` options must not force the lazy `import('@drdreo/dice-box-threejs')` to run eagerly or on every render.
  - Design element: Decision 5 — the mapping happens inside the existing `appearanceRef`-based read at `run()` time, unchanged from today's structure
  - Acceptance criteria reference: specs/dice-appearance/spec.md — "Scenario: appearance mapping does not affect lazy-load timing"
  - Testability notes: existing `useDiceAnimation` tests already assert the import only happens on `run()`; no new eager-import path is introduced

## Risks / Trade-offs

- Risk/trade-off: `theme_customColorset`'s merge behavior is understood only by reading the vendored, minified engine bundle (no public docs/types beyond `any`).
  - Impact: an incorrect assumption about field names (`foreground`/`background`/`texture`/`outline`) could silently render the wrong color or an engine internal fallback.
  - Mitigation: tasks.md includes a manual smoke check (roll dice with a custom color set via `/profile`, confirm the rendered die matches) in addition to unit tests against the constructed config object.
- Risk/trade-off: tightening `dice.surface` breaks any already-persisted `wood`/`stone`/`felt` value from users who used the current (unconstrained) `/profile` UI before this ships.
  - Impact: low — `resolvePreferences` degrades an out-of-enum stored value to `null` (default), so no crash; the user's surface choice is silently reset to default once.
  - Mitigation: none needed beyond the existing repair pattern; explicitly called out here so it isn't mistaken for a bug during review.
- Risk/trade-off: removing `DiceAppearanceModal` removes dice-fab users' only in-context way to preview an appearance change without navigating to `/profile`.
  - Impact: minor UX regression for users who used the fab's quick picker.
  - Mitigation: explicit product decision (proposal.md); out of scope to rebuild a preview affordance in this change.

## Rollback / Mitigation

- Rollback trigger: dice rendering breaks (blank/errored `DiceBox`) for users with a set `dice.color`/`.surface`/`.material`, or `/profile` fails to load due to the schema change.
- Rollback steps: revert the PR(s) for this change; `resolvePreferences`'s per-key repair means a stored `dice.color` object or new enum values left over after rollback are simply ignored by the reverted (older) validators, so no data cleanup is required.
- Data migration considerations: none — no migration is performed in either direction; `dice.color`'s type change from string to object means a pre-change stored hex string is dropped (treated as invalid) by the new validator, and post-change object values are dropped by a reverted old validator. Both directions degrade to `null`, never throw.
- Verification after rollback: confirm `/profile` loads and the dice fab rolls dice with the previous (LocalStore-gallery-sourced) appearance restored.

## Operational Blocking Policy

- If CI checks fail: fix before merge; do not merge with failing unit tests for `schema.ts`, `useDiceAnimation.ts`, or `/profile`.
- If security checks fail: block merge (no exceptions expected — this change touches no auth/secrets surface).
- If required reviews are blocked/stale: ping codeowners for `lib/preferences/` and `lib/dice/`.
- Escalation path and timeout: N/A (single-contributor change; no cross-team dependency).

## Open Questions

- None blocking. The two proposal-level open questions (fate of `DiceAppearanceModal`'s UX, and whether `/profile`'s color input stays free-hex) are resolved above: the modal is removed outright (Decision 6), and the color input becomes a foreground/background hex pair rather than a preset picker (Decision 1, Decision 7).
