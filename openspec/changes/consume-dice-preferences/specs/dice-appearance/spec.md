This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

## REMOVED Requirements

### Requirement: ADDED Curated colorset and material registry

Reason for removal: the compile-time colorset/material registry (`lib/dice/diceAppearance.ts`)
and its dice-fab picker (`DiceAppearanceModal`) are retired. `/profile` (via `preferences.dice.*`)
is now the sole control surface for dice appearance, per proposal.md; there is no longer a
curated named-preset picker — `dice.color` is an arbitrary foreground/background hex pair.

### Requirement: ADDED Every offered colorset has a vendored texture asset

Reason for removal: this requirement guarded the curated registry's texture assets. With the
registry removed (see above), there is no longer a fixed set of "offered" colorsets to guard;
`dice.color` accepts any valid hex pair, which the engine renders via `theme_customColorset`
without needing a vendored named texture.

### Requirement: ADDED Invalid or missing appearance resolves to defaults

Reason for removal: this requirement covered the `LocalStore`-backed `resolveDiceAppearance`
repair path (`dice-fab-colorset` / `dice-fab-material` keys). That storage path is deleted;
the equivalent repair guarantee for the new preference-backed values is now covered by
`profile-settings`'s `resolvePreferences` behavior (see
`specs/profile-settings/spec.md` — "Scenario: Malformed stored dice preference degrades to
default").

## MODIFIED Requirements

### Requirement: Selected appearance is applied to the 3D roll animation

The system SHALL pass `preferences.dice.color` as `theme_customColorset` (omitted when `null`),
`preferences.dice.material` as `theme_material` (omitted when `null`), and
`preferences.dice.surface` as `theme_surface` (omitted when `null`) to each `DiceBox` instance
constructed for a roll animation, and SHALL apply no dice-appearance styling to any non-animated
result surface (numeric-chip readout, inline result line, die-pool buttons). This supersedes the
previous behavior of sourcing `theme_colorset` / `theme_material` from the LocalStore-backed
dice-fab gallery and always passing `theme_customColorset: null`.

#### Scenario: Custom dice color is applied at DiceBox construction

- **Given** the user has set `preferences.dice.color` to
  `{ foreground: "#000000", background: "#ff0000" }`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include
  `theme_customColorset: { foreground: "#000000", background: "#ff0000" }`
- **And** `theme_colorset` is omitted from the constructor options

#### Scenario: Custom dice surface is applied at DiceBox construction

- **Given** the user has set `preferences.dice.surface` to `"wood-tray"`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include `theme_surface: "wood-tray"`

#### Scenario: Custom dice material is applied at DiceBox construction

- **Given** the user has set `preferences.dice.material` to `"metal"`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include `theme_material: "metal"`

#### Scenario: Unset dice preferences omit the corresponding engine options

- **Given** `preferences.dice.color`, `preferences.dice.surface`, and `preferences.dice.material`
  are all `null` (the default)
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options do not include `theme_customColorset`, `theme_surface`, or
  `theme_material` keys, leaving the engine's own internal defaults in effect

#### Scenario: Dice fab panel has no appearance control

- **Given** the dice fab panel is open
- **When** the user views the panel's controls
- **Then** there is no "Dice appearance" trigger button and no appearance modal is reachable from
  the panel; appearance is only editable on `/profile`

## Traceability

- Proposal element "wire preferences into DiceBox construction" -> Requirement: MODIFIED Selected appearance is applied to the 3D roll animation
- Proposal element "remove the LocalStore gallery path" -> Requirements: REMOVED Curated colorset and material registry; REMOVED Every offered colorset has a vendored texture asset; REMOVED Invalid or missing appearance resolves to defaults; MODIFIED Selected appearance is applied to the 3D roll animation (Scenario: Dice fab panel has no appearance control)
- Design Decision 4 -> Requirement: MODIFIED Selected appearance is applied to the 3D roll animation (Scenario: Unset dice preferences omit the corresponding engine options)
- Design Decision 5 -> Requirement: MODIFIED Selected appearance is applied to the 3D roll animation
- Design Decision 6 -> Requirements: REMOVED Curated colorset and material registry; REMOVED Every offered colorset has a vendored texture asset; REMOVED Invalid or missing appearance resolves to defaults; MODIFIED Selected appearance is applied to the 3D roll animation (Scenario: Dice fab panel has no appearance control)
- Requirement "MODIFIED Selected appearance is applied to the 3D roll animation" -> Tasks: useDiceAnimation/GlobalDiceFab rewiring tasks

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Appearance mapping does not affect lazy-load timing

- **Given** the dice engine module (`@drdreo/dice-box-threejs`) has not been imported in the
  current session
- **When** `preferences.dice.*` values change (e.g. the user edits `/profile` in another tab)
- **Then** no dynamic `import('@drdreo/dice-box-threejs')` is triggered until the next roll
  actually calls `run()`
