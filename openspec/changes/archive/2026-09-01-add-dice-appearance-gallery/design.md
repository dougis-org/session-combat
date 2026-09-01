## Context

- Relevant architecture:
  - `lib/components/GlobalDiceFab.tsx` — root-mounted dice fab + bottom-left dice panel (dialog). Owns roll flow, reads `useDiceFabPreferences`, drives `useDiceAnimation`, renders `DiceRollOverlay` per roll (keyed by `rollSeq`).
  - `lib/dice/useDiceFabPreferences.ts` — `LocalStore` (`lib/offline/LocalStore`) + `useReducer` `INIT` pattern (decision n125). One `localStorage` key per preference, `safeGet`/`safeSet` degrade without throwing, tri-state where a default must fall back to a media query.
  - `lib/dice/useDiceAnimation.ts` — lazy-imports `@drdreo/dice-box-threejs`, constructs `new DiceBox(container, { assetPath, baseScale, sounds, shadows, iterationLimit })`, runs a self-bounded settle, reconciles settled faces against the decided roll (`reconcileDiceFaces`), single-instance teardown per run.
  - `lib/components/dice/DiceRollOverlay.tsx` — body-level portal (decision n047), capture-phase Escape/outside-click that `stopPropagation`s so the panel's own document-level close does not also fire; focus management; numeric-chip readout only (issue #634).
  - Engine assets: `public/dice-box-threejs/textures/*.webp`, vendored by `scripts/vendor-dice-assets.mjs` (committed).
- Dependencies:
  - `@drdreo/dice-box-threejs@1.1.0` — **pinned exactly** (decisions n082 / n163; the #627 `patch-package` patch targets this release). No upgrade in this change.
  - Engine theming internals (observed from the `1.1.0` bundle): named colorset registry `fl` (48 entries, `name`/`category`/`foreground`/`background`/`outline`/`texture`); material preset table `J_` with keys `glass` (default), `metal`, `perfectmetal`, `wood`, `none` (Phong "Plastic"); `theme_material` is applied as `colorData.texture.material` inside `getColorSet`/`applyColorSet`; options are read at `initialize()` time, so a new appearance takes effect on the next `new DiceBox(...)` (already once per roll).
- Interfaces/contracts touched:
  - `DiceFabPreferences` (add appearance getters/setters) — or a sibling hook.
  - `useDiceAnimation()` / its `run()` — accept a resolved appearance.
  - `new DiceBox()` options object in `useDiceAnimation.ts`.
  - `openspec/specs/global-dice-fab/spec.md` (delta) and a new `openspec/specs/dice-appearance/spec.md`.
  - No API, DB, or network contract changes.

## Goals / Non-Goals

### Goals

- Let an authenticated user pick a 3D dice **colorset** and **material** from a curated gallery reachable from the dice panel.
- Persist the choice to `localStorage` with safe degradation and a shape a future server-backed preferences provider can adopt without a migration.
- Apply the choice to every subsequent 3D tumble via `theme_colorset` + `theme_material`.
- Ship only appearance options whose assets are already vendored, enforced by an automated test.
- Keep forced-face correctness (incl. restored d4 forcing, #627) intact, or degrade safely via the existing reconcile → instant-reveal path.

### Non-Goals

- Server persistence / cross-device sync (owned by `add-user-preference-persistence`).
- Custom hex colorset builder (`theme_customColorset`).
- Styling the numeric-chip readout, inline result line, or `DiePoolButton` icons.
- Tray surface, lighting, sounds, shadows, scale.
- Per-campaign or per-die-size appearance; Star Wars ™ / novelty `Other` colorsets.

## Decisions

### Decision 1: Persist two scalar `localStorage` keys, resolved through a registry validator

- Chosen: Add `dice-fab-colorset` (string, colorset id) and `dice-fab-material` (string, material id) keys, read/written by an extended `useDiceFabPreferences` (same `LocalStore` + reducer `INIT` shape). A pure `resolveDiceAppearance(rawColorset, rawMaterial)` maps unknown/absent values to the defaults (`white`, `glass`).
- Alternatives considered:
  - Single JSON object key `dice-fab-appearance`. Closer to `PreferenceValues.dice`, but breaks the existing one-key-per-pref convention and needs its own shape guard.
  - Store a hex color + build `theme_customColorset`. Loses the curated textures/outlines each named set carries; more state to persist and validate.
- Rationale: Two scalars match the current file's style exactly (minimal diff, obvious tests). Named-set id is a short, stable, forward-compatible primitive. The `add-user-preference-persistence` branch already reserves `dice.color`; design records the intended mapping (`dice.colorset`, `dice.material`) so that branch can copy the two keys forward in one pass.
- Trade-offs: A later consolidation into one object is a small follow-up; two keys is marginally more storage churn. Accepted.

### Decision 2: Curated colorset registry in `lib/dice/diceAppearance.ts`, asset-verified by test

- Chosen: A hand-maintained `DICE_COLORSETS: ReadonlyArray<{ id; name; category; swatch: { fg; bg } }>` covering the ~20 non-licensed, non-novelty sets (Colors, Damage Types, Custom Sets). `DICE_MATERIALS: ReadonlyArray<{ id; name }>` = Glass/Plastic(`none`)/Metal(`metal`)/Wood(`wood`). `DEFAULT_COLORSET = 'white'`, `DEFAULT_MATERIAL = 'glass'`. Swatch colors are copied from the engine's `fl` entry (flat CSS, no engine render).
- Alternatives considered:
  - Import the engine's `fl` registry at runtime and filter. Requires loading the heavy engine module just to render the picker; `fl` is not a public export.
  - Render a real mini 3D die per swatch. Expensive, needs WebGL, defeats "works even when animation is unsupported".
- Rationale: A static list is trivial to test, render, and reason about; decouples the picker UI from the engine entirely. A CI test asserts every `DICE_COLORSETS[i]` texture (from the engine's `fl[id].texture`) exists under `public/dice-box-threejs/textures/`, so we can never ship an option that 404s.
- Trade-offs: The list must be re-checked on any future engine upgrade — captured as a task and guarded by the asset test.

### Decision 3: New `DiceAppearanceModal` component, opened from the dice panel

- Chosen: A new `lib/components/dice/DiceAppearanceModal.tsx` rendered as a body-level portal following the `DiceRollOverlay` conventions (capture-phase Escape/outside-click with `stopPropagation`, focus trap-in/restore, `role="dialog"` + `aria-modal`). The `GlobalDiceFab` panel gets a small gear/"Dice appearance" button that toggles it. Colorsets shown as a grouped grid of selectable swatch+label buttons (`role="radiogroup"`); materials as a second `radiogroup`. Selecting writes the pref immediately (no Save button, matching the existing checkboxes). A short line states "Applies to the 3D roll animation only."
- Alternatives considered:
  - Inline the controls in the existing panel. The panel is already dense (die buttons, modifier, 2 checkboxes, roll button, result); ~20 swatches would dominate it. The user explicitly asked for a separate modal "to allow better control".
  - Reuse `DiceRollOverlay`. That component is result-gated and remounts per roll; wrong lifecycle.
- Rationale: Matches the request, keeps the roll panel uncluttered, reuses proven overlay a11y patterns.
- Trade-offs: One more component + tests. The modal opens over the panel (which itself sits over a backdrop) — z-index and nested outside-click handling must be verified (the capture-phase `stopPropagation` pattern already handles the analogous `DiceRollOverlay`-over-panel case).

### Decision 4: `useDiceAnimation` receives the resolved appearance as a `run()`-time value

- Chosen: `useDiceAnimation()` takes the resolved `{ colorset, material }` (either as a hook argument kept in a ref, or threaded through `run(built, container, appearance)`). It passes `theme_colorset: colorset`, `theme_customColorset: null`, `theme_material: material` into the existing `new DiceBox(container, {...})` options. No other engine option changes.
- Alternatives considered:
  - Read `localStorage` directly inside `useDiceAnimation`. Splits preference ownership away from `useDiceFabPreferences`; harder to test.
  - Recreate the box on preference change while an overlay is open. Unnecessary — the overlay/box is per-roll; the next roll picks up the new value.
- Rationale: Keeps all preference reads in one hook, keeps `useDiceAnimation` a pure consumer, minimal surface change, existing per-run teardown already gives a fresh box.
- Trade-offs: Changing appearance mid-open-overlay does not restyle the in-flight tumble (acceptable; documented).

### Decision 5: Forced-face safety is covered by an explicit test, not new engine code

- Chosen: Add a `useDiceAnimation` test that runs a forced d4 (and one other size) with a non-`glass` material + a textured colorset and asserts the run resolves with either a correct reconcile or a clean `FaceMismatchError` → instant reveal (no throw past the boundary, no wrong total). No change to `reconcileDiceFaces` or `toDiceBoxNotation`.
- Alternatives considered: Pre-emptively forcing `glass` whenever `@` faces are present. Rejected — removes a user choice for an unproven risk; the reconcile safety net already exists.
- Rationale: `createMaterials` (touched by the #627 patch) is material-aware but the forced-face geometry swap is independent of the PBR material; the reconcile check is the real guarantee. A test documents and locks the behavior.
- Trade-offs: If a specific material genuinely breaks forcing, we'd add a targeted guard in a follow-up.

## Proposal to Design Mapping

- Proposal element: Gallery of preset colorsets (~20 non-licensed sets)
  - Design decision: Decision 2 (static curated registry) + Decision 3 (modal grid)
  - Validation approach: unit test of registry contents + category grouping; asset-existence test; modal render test asserts one selectable control per registry entry
- Proposal element: Material picker (glass/plastic/metal/wood)
  - Design decision: Decision 2 (`DICE_MATERIALS`, `none`↔Plastic mapping) + Decision 4 (pass-through)
  - Validation approach: unit test of `DICE_MATERIALS`; `useDiceAnimation` test asserts `theme_material` reaches the `DiceBox` constructor
- Proposal element: Persist to `localStorage` now, migration-friendly for `add-user-preference-persistence`
  - Design decision: Decision 1 (two scalar keys + `resolveDiceAppearance`)
  - Validation approach: preference-hook unit tests (read/write/roundtrip, unavailable storage, invalid stored value → default); design records the `dice.colorset` / `dice.material` mapping for the other branch
- Proposal element: Configuration modal opened from the dice panel
  - Design decision: Decision 3
  - Validation approach: `GlobalDiceFab` test — trigger opens modal, Escape/outside-click closes only the modal (panel stays open), focus returns to trigger
- Proposal element: Apply to 3D tumble only; no effect on chips / inline line
  - Design decision: Decision 4 (only `useDiceAnimation` consumes it)
  - Validation approach: existing `DiceRollOverlay` / chip tests remain unchanged and green; explicit assertion that the disabled-animation path renders no appearance-dependent output
- Proposal element: Only ship options with vendored assets
  - Design decision: Decision 2 (asset-existence test)
  - Validation approach: CI test enumerates `DICE_COLORSETS` textures vs `public/dice-box-threejs/textures/`
- Proposal element: Forced-face (incl. d4 #627) correctness preserved
  - Design decision: Decision 5
  - Validation approach: new `useDiceAnimation` forced-face-with-material test; existing `d4EnginePatch` + `reconcileDiceFaces` tests stay green
- Proposal element: Star Wars ™ / novelty sets excluded
  - Design decision: Decision 2 (curated list omits them)
  - Validation approach: unit test asserts no `swrpg_*` / `sw*` / `test` / `tigerking` / `acleaf` / `isabelle` / `thecage` ids in the registry

## Functional Requirements Mapping

- Requirement: A user can open a dice-appearance configuration modal from the dice panel
  - Design element: Decision 3 (`DiceAppearanceModal` + panel trigger)
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Dice appearance configuration modal"
  - Testability notes: RTL test on `GlobalDiceFab`: trigger present with accessible name, click opens a `dialog`, Escape closes it and restores focus, panel remains open
- Requirement: The modal lists curated colorsets (grouped) and materials as selectable options; selecting one persists it
  - Design element: Decisions 2 + 3 + 1
  - Acceptance criteria reference: `specs/dice-appearance/spec.md` — "Curated colorset & material registry", `specs/global-dice-fab/spec.md` — "Persisted dice appearance preference"
  - Testability notes: modal test asserts grouped radiogroups, keyboard selection, `LocalStore.set` called with the chosen id; hook test asserts roundtrip
- Requirement: A persisted appearance is applied to subsequent 3D rolls
  - Design element: Decision 4
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Persisted dice appearance preference"
  - Testability notes: `useDiceAnimation` test with a mocked `DiceBox` asserts constructor options include `theme_colorset` / `theme_material` from the resolved pref; E2E: set appearance, reload, roll, assert engine constructed with those values (via a test hook / console probe like the existing animation E2E)
- Requirement: Unknown/absent stored values fall back to defaults without throwing
  - Design element: Decision 1 (`resolveDiceAppearance`, `safeGet`)
  - Acceptance criteria reference: `specs/dice-appearance/spec.md` — "Invalid or missing appearance resolves to defaults"
  - Testability notes: hook test with junk in storage and with storage that throws → resolves to `white` / `glass`, single `console.warn`
- Requirement: Only colorsets with vendored textures are offered
  - Design element: Decision 2
  - Acceptance criteria reference: `specs/dice-appearance/spec.md` — "Every offered colorset has a vendored texture asset"
  - Testability notes: filesystem test over `public/dice-box-threejs/textures/`

## Non-Functional Requirements Mapping

- Requirement category: reliability
  - Requirement: Appearance selection never breaks the roll result or crashes the animation path
  - Design element: Decisions 4 + 5 (reconcile → instant reveal unchanged; validator coerces bad input)
  - Acceptance criteria reference: `specs/global-dice-fab/spec.md` — "Appearance does not affect roll outcome"
  - Testability notes: forced-face-with-material test; assert `built.total` identical with and without a custom appearance for a seeded roll
- Requirement category: performance
  - Requirement: The picker adds no engine load and no network requests on open
  - Design element: Decision 2 (static registry, flat CSS swatches)
  - Acceptance criteria reference: `specs/dice-appearance/spec.md` — "Picker renders without loading the dice engine"
  - Testability notes: modal test asserts no `import('@drdreo/dice-box-threejs')` and no `fetch` on open; swatches are DOM elements with inline colors
- Requirement category: operability
  - Requirement: Storage failure degrades to an in-session default and is observable
  - Design element: Decision 1 (`safeGet`/`safeSet` + `console.warn`)
  - Acceptance criteria reference: `specs/dice-appearance/spec.md` — "Invalid or missing appearance resolves to defaults"
  - Testability notes: mock `LocalStore` to throw; assert no throw, warn emitted, UI still functional
- Requirement category: security
  - Requirement: No untrusted input reaches the engine or the DOM
  - Design element: Stored values are constrained to the registry's known ids before use (Decision 1); swatch colors are compile-time constants, not stored
  - Acceptance criteria reference: See functional scenario "Invalid or missing appearance resolves to defaults"
  - Testability notes: covered by the invalid-value test; no additional NFAC scenario needed

## Risks / Trade-offs

- Risk/trade-off: Engine upgrade later changes `fl` ids or `J_` keys
  - Impact: Registry entries point at nonexistent sets/materials
  - Mitigation: Asset-existence test + a registry test that (in dev) can be cross-checked against the bundle; upgrade checklist task in `tasks.md`; `resolveDiceAppearance` coerces unknowns at runtime
- Risk/trade-off: Nested modal-over-panel outside-click/Escape handling
  - Impact: Dismissing the modal could also close the panel, or vice versa
  - Mitigation: Reuse `DiceRollOverlay`'s capture-phase `stopPropagation` pattern; explicit `GlobalDiceFab` test for the interaction
- Risk/trade-off: Non-`glass` material + forced faces
  - Impact: Possible reconcile mismatch on some sizes
  - Mitigation: Decision 5 test; safe degradation already in place; no wrong totals possible (values are decided client-side before the tumble)
- Risk/trade-off: Preference key names not finalized with `add-user-preference-persistence`
  - Impact: Duplicate/stale key when that branch lands
  - Mitigation: Document intended mapping here; coordinate names in the PR; the coercing resolver makes a rename low-risk

## Rollback / Mitigation

- Rollback trigger: Appearance selection causes broken renders, wrong totals, or a spike in `[dice-animation]` warnings after release.
- Rollback steps: Revert the feature PR (single squash commit). The `localStorage` keys become inert (nothing reads them); no cleanup required. `useDiceAnimation` returns to constructing `DiceBox` without theme options.
- Data migration considerations: None — client-only keys, additive, no schema. If `add-user-preference-persistence` already merged and copied the keys, its resolver still defaults safely when the local keys are absent.
- Verification after rollback: `npm test` green; manual roll shows the default white/glass dice; no `theme_*` options in the `DiceBox` call.

## Operational Blocking Policy

- If CI checks fail: Fix forward on the branch. The required `ci-gate` check (per repo ruleset, `main` is squash-only, 0 approvals) and Codacy must pass. Do not use `--admin` / branch-protection bypass (feedback memory). Re-run flaky E2E once; if it fails twice, treat as real.
- If security checks fail: Address findings before merge; there is no untrusted-input surface here, but Codacy/secret-scan findings block. Escalate to the maintainer if a finding is a false positive that cannot be suppressed in-config.
- If required reviews are blocked/stale: Request re-review; after the `pr-review-toolkit:review-pr` gate reaches zero findings, enable auto-merge with `gh pr merge --auto --squash`. Never force-merge.
- Escalation path and timeout: If the review-fix loop makes no progress after 3 iterations, or CI is red for >24h with no clear cause, stop and hand back to the maintainer (doug) with the remaining findings listed.

## Open Questions

- Non-blocking: single combined `dice-fab-appearance` key vs. two scalars — design picks **two scalars**; revisit only if `add-user-preference-persistence` strongly prefers one object.
- Non-blocking: include `rainbow` / `glitterparty` or trim to "serious" sets — design includes all ~20 non-licensed non-novelty sets; trivially trimmed by editing the registry if the maintainer objects.
- Non-blocking: expose `perfectmetal` as a 5th material — deferred; add later if wanted.
- Non-blocking: static preview image per swatch vs. flat color swatch — design uses **flat swatch + name** for v1.
