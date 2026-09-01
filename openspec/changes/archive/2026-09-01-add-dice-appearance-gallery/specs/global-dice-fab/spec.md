## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Dice appearance configuration modal

The system SHALL provide, from within the dice fab panel, a control that opens a dedicated dice-appearance configuration modal. The modal SHALL present the curated colorsets (see the `dice-appearance` capability) as selectable options grouped by category, and the curated materials as selectable options, and SHALL state that the appearance affects the 3D roll animation only. The modal SHALL follow the existing dice-overlay interaction conventions: it is a body-level portal, it is dismissed by Escape or an outside click, dismissal closes only the modal (the dice fab panel remains open), and focus moves into the modal on open and returns to the opening control on close.

#### Scenario: Opening the appearance modal from the dice panel

- **Given** an authenticated user has the dice fab panel open
- **When** the user activates the "Dice appearance" control
- **Then** a modal dialog (`role="dialog"`, `aria-modal="true"`) opens with an accessible name identifying it as dice appearance settings
- **And** it lists every curated colorset as a selectable control, grouped under its category heading, and lists the materials `Glass`, `Plastic`, `Metal`, `Wood` as selectable controls
- **And** it displays text indicating the choice applies to the 3D roll animation only
- **And** keyboard focus is within the modal

#### Scenario: Dismissing the appearance modal leaves the dice panel open

- **Given** the dice appearance modal is open over the dice fab panel
- **When** the user presses Escape or clicks outside the modal content
- **Then** the modal closes
- **And** the dice fab panel is still open
- **And** focus returns to the "Dice appearance" control

#### Scenario: Selecting an option persists it immediately

- **Given** the dice appearance modal is open
- **When** the user selects colorset `bloodmoon` and material `Metal`
- **Then** the selection is written to persistent storage without a separate save action
- **And** the selected controls are marked as chosen (`aria-checked="true"` / equivalent)

### Requirement: ADDED Persisted dice appearance preference

The system SHALL persist the user's chosen dice colorset and material to `localStorage`, resolve them on load through the `dice-appearance` registry (defaulting invalid or absent values), and apply the resolved values to every subsequent 3D roll animation via the dice engine's `theme_colorset` and `theme_material` options. The preference SHALL be stored as two scalar string keys so a future server-backed preferences provider can adopt them without a data migration.

#### Scenario: Appearance survives a reload and reaches the engine

- **Given** the user selected colorset `fire` and material `wood`, then reloaded the app
- **When** the user performs a roll that plays the 3D animation
- **Then** the dice engine is initialized with `theme_colorset: "fire"` and `theme_material: "wood"`
- **And** the rolled total is unaffected by the appearance

#### Scenario: First-time user gets the default appearance

- **Given** a user who has never opened the dice appearance modal
- **When** the user performs a roll that plays the 3D animation
- **Then** the dice engine is initialized with `theme_colorset: "white"` and `theme_material: "glass"`

## MODIFIED Requirements

### Requirement: MODIFIED Standalone dice pool modal with no session dependency

The system SHALL let an authenticated user open a modal anchored to the bottom-left corner over the trigger button from the fab that provides a dice pool builder (add/remove d4/d6/d8/d10/d12/d20, edit a shared modifier) and roll it using `rollDicePool()`, entirely independent of any campaign or session context, with no network request required to see a result. Each die control SHALL be rendered via the shared `DiePoolButton` component, showing the die's icon, staged count, and a persistent visible `d{sides}` label. The modal SHALL also present a standalone percentile control (shared `PercentileButton`, `d%` glyph) that produces a single percentile result via `buildPercentileRoll()`, separate from the staged pool. The modal SHALL additionally provide a control that opens the dice appearance configuration modal (see "Dice appearance configuration modal").

#### Scenario: Dice panel exposes a dice appearance control

- **Given** an authenticated user opens the dice fab panel
- **When** the panel renders
- **Then** a "Dice appearance" control is present alongside the existing pool builder, modifier input, and preference toggles
- **And** activating it opens the dice appearance configuration modal without closing the dice panel

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Configuration modal opened from the dice panel" -> Requirement: ADDED Dice appearance configuration modal; Requirement: MODIFIED Standalone dice pool modal with no session dependency
- Proposal element "Persist to localStorage, migration-friendly" -> Requirement: ADDED Persisted dice appearance preference
- Proposal element "Apply to 3D tumble only" -> Requirement: ADDED Persisted dice appearance preference (scenarios cross-reference `dice-appearance`)
- Design Decision 3 -> Requirement: ADDED Dice appearance configuration modal
- Design Decision 1 -> Requirement: ADDED Persisted dice appearance preference
- Design Decision 4 -> Requirement: ADDED Persisted dice appearance preference
- Requirement "Dice appearance configuration modal" -> Tasks: 4.1, 4.2, 4.3
- Requirement "Persisted dice appearance preference" -> Tasks: 3.1, 3.2, 5.1, 5.2
- Requirement "MODIFIED Standalone dice pool modal" -> Tasks: 4.3

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Opening the modal does not load the dice engine

- **Given** the dice engine module has not been imported this session
- **When** the user opens the dice appearance modal from the panel
- **Then** no `@drdreo/dice-box-threejs` import or network request is initiated by the modal — see functional scenario (`dice-appearance`): "Picker renders without loading the dice engine"

### Requirement: Security

#### Scenario: Access control

- **Given** the dice fab is already gated to authenticated users
- **When** an unauthenticated user loads any page
- **Then** neither the dice panel nor the dice appearance control is present — see existing requirement "Persistent dice fab visible on every page for authenticated users"

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** the dice appearance modal is open over the dice fab panel and the user triggers a roll shortcut or navigation
- **When** the overlay/panel close sequence runs
- **Then** the appearance modal and panel close without leaving a stranded portal node or trapping focus — consistent with the existing `DiceRollOverlay` portal cleanup behavior
