## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

_No requirements added by this change._

## MODIFIED Requirements

### Requirement: Counter badge visible in combatant row

A combatant with `legendaryActionCount > 0` SHALL display a counter badge showing `R/N` (remaining / total) in the combatant row during combat. The badge SHALL be an interactive control (a native `button`) that, when activated, opens that combatant's detail panel — the same panel opened by the combatant-name control — so the legendary-action spend/restore/pool controls are reachable in one step from the row. The badge SHALL retain its `data-testid="legendary-action-badge"` hook and its `R/N` text content.

#### Scenario: Badge renders for legendary monster

- **WHEN** a combatant has `legendaryActionCount: 3` and `legendaryActionsRemaining: 2`
- **THEN** the combatant row SHALL display a badge reading `2/3`
- **AND** the badge SHALL be exposed as a `button` with an accessible name referencing the combatant and legendary actions

#### Scenario: Badge absent for non-legendary combatants

- **WHEN** a combatant has no `legendaryActionCount` (or 0)
- **THEN** no legendary action badge SHALL be rendered in the row

#### Scenario: Badge updates after use

- **WHEN** the DM uses a legendary action reducing remaining to 1
- **THEN** the badge SHALL update to show `1/3` (for a pool of 3)

#### Scenario: Activating the badge opens the detail panel

- **GIVEN** a combatant row with a legendary-action badge and a detail-panel handler wired (as `ActiveCombatView` wires it)
- **WHEN** the DM clicks the badge, or focuses it and presses Enter or Space
- **THEN** the combatant's detail panel SHALL open (the handler receives that combatant's id)
- **AND** the `LegendaryActionsPanel` spend / restore / pool controls SHALL be visible in that panel

#### Scenario: Badge is inert when no detail-panel handler is supplied

- **GIVEN** a combatant card rendered without a detail-panel handler (e.g. in isolation or the setup view)
- **WHEN** the DM activates the badge
- **THEN** nothing SHALL happen and no error SHALL be raised

## REMOVED Requirements

_No requirements removed by this change._

## Traceability

- Proposal element "Badge becomes a button that opens `CombatantDetailPanel`" -> Requirement: Counter badge visible in combatant row (MODIFIED)
- Proposal element "No UI duplicated onto the card; no new props" -> Requirement: Counter badge visible in combatant row — realized by reusing the existing `onShowDetails` prop (design Decision 1)
- Proposal element "Keyboard accessible with an accessible name" -> Scenario: Badge renders for legendary monster; Scenario: Activating the badge opens the detail panel
- Proposal element "Safe when handler omitted" -> Scenario: Badge is inert when no detail-panel handler is supplied
- Proposal element "Remove dead `LegendaryActionsPanel` / `LairActionsSlot` imports" -> no behavioral requirement; verified by task-level static check (grep + lint) — see `tasks.md`
- Design Decision 1 (reuse `onShowDetails`) -> Requirement: Counter badge visible in combatant row
- Design Decision 2 (`span` -> `button`) -> Scenario: Badge renders for legendary monster; Scenario: Activating the badge opens the detail panel
- Design Decision 3 (safe no-op without handler) -> Scenario: Badge is inert when no detail-panel handler is supplied
- Requirement: Counter badge visible in combatant row -> Tasks: "Convert badge to button", "Wire badge onClick to onShowDetails", "Badge component tests", "Remove dead imports"

## Non-Functional Acceptance Criteria

### Requirement: Operability

#### Scenario: No prop-contract change and existing suites stay green

- **GIVEN** the `CombatantCard` component before and after this change
- **WHEN** its TypeScript prop type (`CombatantCardProps`) is compared and the combat / `ActiveCombatView` unit suites are run via `npm run test:unit`
- **THEN** the prop type SHALL be unchanged (no added or removed props)
- **AND** the pre-existing suites SHALL pass without modification other than updating assertions that hard-coded the badge's `span` tag

### Requirement: Security

See functional scenarios: "Activating the badge opens the detail panel" and "Badge is inert when no detail-panel handler is supplied". This change introduces no new input handling, network calls, or state mutations — the badge only invokes an existing in-process callback with an existing combatant id — so there is no distinct security scenario to add.

### Requirement: Accessibility

#### Scenario: Badge is operable without a pointer

- **GIVEN** a combatant row with a legendary-action badge
- **WHEN** a keyboard user tabs to the badge and presses Enter or Space
- **THEN** the badge SHALL activate (open the detail panel) identically to a mouse click
- **AND** the badge SHALL have a programmatically determinable accessible name
