## Purpose

Expose a curated, engine-independent registry of selectable 3D dice appearances (colorsets and materials) for the global dice fab, persist the user's choice locally, and apply it to every 3D roll animation via the dice engine's `theme_*` options — without affecting roll outcomes or non-animated result surfaces.

## Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-09-01-add-dice-appearance-gallery/design.md) document, not a replacement.

### Requirement: ADDED Curated colorset and material registry

The system SHALL expose a compile-time registry of selectable 3D dice appearances: a list of colorsets (each with a stable `id`, display `name`, `category`, and flat swatch colors `fg`/`bg`) and a list of materials (each with a stable `id` and display `name`). The registry SHALL include only colorsets bundled with `@drdreo/dice-box-threejs@1.1.0` in the `Colors`, `Damage Types`, and `Custom Sets` categories, and materials limited to `glass`, `none` (shown as "Plastic"), `metal`, and `wood`. The registry SHALL define a default colorset id (`white`) and a default material id (`glass`).

#### Scenario: Registry exposes only non-licensed, non-novelty colorsets

- **Given** the dice appearance registry
- **When** its colorset entries are enumerated
- **Then** every entry's `category` is one of `Colors`, `Damage Types`, `Custom Sets`
- **And** no entry id matches `swrpg_*`, `swa_*`, `swl_*`, `xwing_*`, `test`, `tigerking`, `acleaf`, `isabelle`, or `thecage`
- **And** the entry ids `white` and `glass` resolve to the declared defaults

#### Scenario: Materials are limited to the confirmed engine preset keys

- **Given** the dice appearance registry
- **When** its material entries are enumerated
- **Then** the set of material ids is exactly `{ glass, none, metal, wood }`
- **And** the material with id `none` has the display name `Plastic`

### Requirement: ADDED Every offered colorset has a vendored texture asset

The system SHALL guarantee that each colorset offered in the registry references only textures already vendored under `public/dice-box-threejs/textures/`, so selecting any option cannot cause the dice engine to request a missing asset.

#### Scenario: All registry colorset textures exist on disk

- **Given** the dice appearance registry and the engine's colorset table (`fl`) from `@drdreo/dice-box-threejs@1.1.0`
- **When** a build-time test maps each registry colorset id to its engine texture name(s) and checks `public/dice-box-threejs/textures/`
- **Then** every referenced texture file is present
- **And** the test fails the build if any is missing

### Requirement: ADDED Invalid or missing appearance resolves to defaults

The system SHALL resolve a stored appearance value that is absent, malformed, or not present in the registry to the default colorset (`white`) and/or default material (`glass`), without throwing, and SHALL surface a single diagnostic log when a storage read or write fails.

#### Scenario: Unknown stored colorset id falls back to the default

- **Given** `localStorage` contains `dice-fab-colorset = "not-a-real-set"` and `dice-fab-material = 42`
- **When** the dice-fab preferences hook initializes
- **Then** the resolved colorset is `white` and the resolved material is `glass`
- **And** no exception propagates to the caller

#### Scenario: Storage unavailable degrades to an in-session default

- **Given** `LocalStore` throws on read and on write
- **When** the hook initializes and the user then selects a colorset
- **Then** the resolved appearance is the default until the selection, then the selected value for the rest of the session
- **And** exactly one `console.warn` is emitted per failing key

### Requirement: ADDED Selected appearance is applied to the 3D roll animation

The system SHALL pass the resolved colorset id as `theme_colorset`, `null` as `theme_customColorset`, and the resolved material id as `theme_material` to each `DiceBox` instance constructed for a roll animation, and SHALL apply no dice-appearance styling to any non-animated result surface (numeric-chip readout, inline result line, die-pool buttons).

#### Scenario: DiceBox is constructed with the persisted theme options

- **Given** the user has selected colorset `fire` and material `metal`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include `theme_colorset: "fire"`, `theme_customColorset: null`, `theme_material: "metal"`
- **And** the other existing options (`assetPath`, `baseScale`, `sounds`, `shadows`, `iterationLimit`) are unchanged

#### Scenario: Non-animated paths ignore the appearance

- **Given** the user has selected a non-default colorset and material
- **When** a roll is revealed via the instant path (animation disabled, WebGL unsupported, or fallback timeout)
- **Then** the numeric-chip readout, inline result line, and die-pool buttons render identically to the default-appearance case

### Requirement: ADDED Appearance selection does not affect roll outcomes

The system SHALL compute roll values independently of the selected appearance, and forcing predetermined faces (including the restored d4 forcing, issue #627) SHALL either settle correctly or degrade to an immediate result reveal via the existing reconciliation path, never producing an incorrect total or an unhandled error.

#### Scenario: Total is identical regardless of appearance

- **Given** a seeded roll that produces total `T` with the default appearance
- **When** the same seeded roll is performed with any registry colorset and material
- **Then** the reported total is `T`

#### Scenario: Forced d4 with a non-glass material degrades safely

- **Given** the user has selected material `wood` and a textured colorset
- **When** a roll containing a forced d4 (`@` notation) is animated
- **Then** the run resolves with either a matching reconciliation or a `FaceMismatchError` that triggers an immediate modal reveal
- **And** no error propagates past the animation boundary and the displayed total matches the decided roll

## Traceability

- Proposal element "Gallery of preset colorsets" -> Requirement: ADDED Curated colorset and material registry
- Proposal element "Material picker (glass/plastic/metal/wood)" -> Requirement: ADDED Curated colorset and material registry
- Proposal element "Only ship options with vendored assets" -> Requirement: ADDED Every offered colorset has a vendored texture asset
- Proposal element "Persist to localStorage with safe fallback" -> Requirement: ADDED Invalid or missing appearance resolves to defaults
- Proposal element "Apply to 3D tumble only" -> Requirement: ADDED Selected appearance is applied to the 3D roll animation
- Proposal element "Forced-face (incl. d4 #627) correctness preserved" -> Requirement: ADDED Appearance selection does not affect roll outcomes
- Design Decision 2 -> Requirements: Curated colorset and material registry; Every offered colorset has a vendored texture asset
- Design Decision 1 -> Requirement: Invalid or missing appearance resolves to defaults
- Design Decision 4 -> Requirement: Selected appearance is applied to the 3D roll animation
- Design Decision 5 -> Requirement: Appearance selection does not affect roll outcomes
- Requirement "Curated colorset and material registry" -> Tasks: 2.1, 2.2, 2.3
- Requirement "Every offered colorset has a vendored texture asset" -> Tasks: 2.3
- Requirement "Invalid or missing appearance resolves to defaults" -> Tasks: 3.1, 3.2
- Requirement "Selected appearance is applied to the 3D roll animation" -> Tasks: 5.1, 5.2
- Requirement "Appearance selection does not affect roll outcomes" -> Tasks: 5.3

## Non-Functional Acceptance Criteria

### Performance

#### Scenario: Picker renders without loading the dice engine

- **Given** the dice engine module (`@drdreo/dice-box-threejs`) has not been imported in the current session
- **When** the user opens the dice appearance modal
- **Then** the modal renders its full colorset gallery and material list
- **And** no dynamic `import('@drdreo/dice-box-threejs')` is triggered and no network request is made by opening the modal

### Security

#### Scenario: Access control

- **Given** stored appearance values originate from `localStorage` (user-writable)
- **When** the app reads them
- **Then** only ids present in the compile-time registry are ever passed to the dice engine or used to derive DOM styles — see functional scenario: "Unknown stored colorset id falls back to the default"

### Reliability

#### Scenario: Recovery behavior

- **Given** a persisted appearance and a subsequent `@drdreo/dice-box-threejs` upgrade that renames or removes a colorset id
- **When** the app next resolves the stored appearance
- **Then** an id no longer in the registry resolves to the default, the UI stays usable, and the asset-existence build test flags the stale registry entry for maintainers
