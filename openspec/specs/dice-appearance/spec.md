## Purpose

Apply the user's account-level dice appearance preferences (`preferences.dice.color`,
`preferences.dice.surface`, `preferences.dice.material`) to every 3D roll animation via the
dice engine's `theme_*` options, without affecting roll outcomes or non-animated result
surfaces. `/profile` (see `profile-settings`) is the sole control surface — there is no
in-panel gallery or LocalStore-backed appearance picker.

## Requirements

This document details *changes* to requirements and is additive to the
[`design.md`](../../changes/archive/2026-09-26-consume-dice-preferences/design.md) document,
not a replacement.

### Requirement: Selected appearance is applied to the 3D roll animation

The system SHALL pass `preferences.dice.color` as `theme_customColorset` (omitted when
`null`), `preferences.dice.material` as `theme_material` (omitted when `null`), and
`preferences.dice.surface` as `theme_surface` (omitted when `null`) to each `DiceBox`
instance constructed for a roll animation, and SHALL apply no dice-appearance styling to any
non-animated result surface (numeric-chip readout, inline result line, die-pool buttons).

#### Scenario: Custom dice color is applied at DiceBox construction

- **Given** the user has set `preferences.dice.color` to
  `{ foreground: "#000000", background: "#ff0000" }`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include
  `theme_customColorset: { foreground: "#000000", background: "#ff0000" }`
- **And** `theme_colorset` is omitted from the constructor options

#### Scenario: Custom dice surface is applied at DiceBox construction

- **Given** the user has set `preferences.dice.surface` to `"mahogany"`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include `theme_surface: "mahogany"`

#### Scenario: Custom dice material is applied at DiceBox construction

- **Given** the user has set `preferences.dice.material` to `"metal"`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options include `theme_material: "metal"`

#### Scenario: A set material is folded into a set custom colorset

- **Given** the user has set both `preferences.dice.color` and `preferences.dice.material`
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructed `theme_customColorset` object includes the chosen `material` field
  alongside `foreground`/`background`, in addition to the plain `theme_material` pass-through
- **Because** the engine's `loadTheme()` only reads a bare `theme_material` via its
  named-colorset (`theme_colorset`) branch; a set `theme_customColorset` is resolved via
  `makeColorSet(theme_customColorset)`, which reads `material` off that object itself — a
  bare `theme_material` pass-through is silently ignored once a custom colorset is also set

#### Scenario: Unset dice preferences omit the corresponding engine options

- **Given** `preferences.dice.color`, `preferences.dice.surface`, and `preferences.dice.material`
  are all `null` (the default)
- **When** a roll triggers `useDiceAnimation` to construct a `DiceBox`
- **Then** the constructor options do not include `theme_customColorset`, `theme_surface`, or
  `theme_material` keys, leaving the engine's own internal defaults in effect

#### Scenario: Dice fab panel has no appearance control

- **Given** the dice fab panel is open
- **When** the user views the panel's controls
- **Then** there is no "Dice appearance" trigger button and no appearance modal is reachable
  from the panel; appearance is only editable on `/profile`

### Requirement: Appearance selection does not affect roll outcomes

The system SHALL compute roll values independently of the selected appearance, and forcing
predetermined faces (including the restored d4 forcing, issue #627) SHALL either settle
correctly or degrade to an immediate result reveal via the existing reconciliation path,
never producing an incorrect total or an unhandled error.

#### Scenario: Total is identical regardless of appearance

- **Given** a seeded roll that produces total `T` with the default appearance
- **When** the same seeded roll is performed with any `preferences.dice.*` combination
- **Then** the reported total is `T`

#### Scenario: Forced d4 with a non-glass material degrades safely

- **Given** the user has selected material `wood`
- **When** a roll containing a forced d4 (`@` notation) is animated
- **Then** the run resolves with either a matching reconciliation or a `FaceMismatchError` that
  triggers an immediate modal reveal
- **And** no error propagates past the animation boundary and the displayed total matches the
  decided roll

## Traceability

- Proposal element "wire preferences into DiceBox construction" -> Requirement: Selected
  appearance is applied to the 3D roll animation
- Proposal element "remove the LocalStore gallery path" -> Requirement: Selected appearance is
  applied to the 3D roll animation (Scenario: Dice fab panel has no appearance control)
- Design Decision 4 -> Requirement: Selected appearance is applied to the 3D roll animation
  (Scenario: Unset dice preferences omit the corresponding engine options)
- Design Decision 5 -> Requirement: Selected appearance is applied to the 3D roll animation
- Requirement "Selected appearance is applied to the 3D roll animation" -> Tasks: 2.1-2.4
- Requirement "Appearance selection does not affect roll outcomes" -> carried over unchanged
  from the original dice-appearance-gallery change

## Non-Functional Acceptance Criteria

### Performance

#### Scenario: Appearance mapping does not affect lazy-load timing

- **Given** the dice engine module (`@drdreo/dice-box-threejs`) has not been imported in the
  current session
- **When** `preferences.dice.*` values change (e.g. the user edits `/profile` in another tab)
- **Then** no dynamic `import('@drdreo/dice-box-threejs')` is triggered until the next roll
  actually calls `run()`

### Security

#### Scenario: Only validated, closed-set values reach the rendering engine

- **Given** `preferences.dice.color`/`.surface`/`.material` are validated server-side by
  `lib/preferences/schema.ts` before persistence (closed enums for surface/material, an
  exact two-field object with no extra keys for color)
- **When** the app reads a stored value and passes it to `DiceBox` construction
- **Then** only a well-formed, schema-valid value (or `null`) is ever passed as a
  `theme_customColorset`/`theme_surface`/`theme_material` construction option

### Reliability

#### Scenario: Recovery behavior

- **Given** a stored `dice.surface`/`.material` value that is out of the current enum (e.g.
  after an engine downgrade, or a hand-edited API request)
- **When** the app next resolves the stored preferences
- **Then** the affected key resolves to `null` (default) rather than throwing, and the engine's
  own default applies at the next roll
