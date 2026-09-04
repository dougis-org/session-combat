## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: Detail panel focuses the legendary section on request

`CombatantDetailPanel` SHALL accept an optional request to open focused on the Legendary Actions section. When that request is present, the panel SHALL scroll the Legendary Actions section into view and move keyboard focus into it (to the first interactive control in the section, or to the section container if it has none). When the request is absent, the panel SHALL open with its default scroll position and SHALL NOT move focus into any section.

#### Scenario: Panel opens focused on the legendary section

- **GIVEN** a combatant with `legendaryActionCount: 3` and a non-empty `legendaryActions` array
- **WHEN** `CombatantDetailPanel` is rendered with the legendary focus request set
- **THEN** the Legendary Actions section SHALL be scrolled into view
- **AND** keyboard focus SHALL be within the Legendary Actions section

#### Scenario: Panel opens normally without a focus request

- **GIVEN** any combatant
- **WHEN** `CombatantDetailPanel` is rendered with no focus request
- **THEN** the panel SHALL NOT scroll to the Legendary Actions section
- **AND** focus SHALL NOT be moved into any section

#### Scenario: Focus request with no legendary content is a safe no-op

- **GIVEN** a combatant with `legendaryActionCount: 2` but an empty `legendaryActions` array (so the legendary panel renders nothing)
- **WHEN** `CombatantDetailPanel` is rendered with the legendary focus request set
- **THEN** no error SHALL be raised
- **AND** the panel SHALL render normally

## MODIFIED Requirements

### Requirement: Counter badge visible in combatant row

A combatant with `legendaryActionCount > 0` SHALL display a counter badge showing `R/N` (remaining / total) in the combatant row during combat. The badge SHALL be an interactive native `button` that, when activated, opens that combatant's detail panel — the same panel opened by the combatant-name control — **with a request to focus the Legendary Actions section**, so the spend/restore/pool controls are scrolled into view and keyboard-focused in one step. The badge SHALL retain its `data-testid="legendary-action-badge"` hook and its `R/N` text content. The badge SHALL only be rendered for combatants with `legendaryActionCount > 0` (legendary combatants); combatants that only have lair actions SHALL NOT receive this control.

#### Scenario: Badge renders for legendary monster

- **WHEN** a combatant has `legendaryActionCount: 3` and `legendaryActionsRemaining: 2`
- **THEN** the combatant row SHALL display a badge reading `2/3`
- **AND** the badge SHALL be exposed as a `button` with an accessible name referencing the combatant and legendary actions

#### Scenario: Badge absent for non-legendary combatants

- **WHEN** a combatant has no `legendaryActionCount` (or 0)
- **THEN** no legendary action badge SHALL be rendered in the row
- **AND** this holds even when the combatant has a non-empty `lairActions` array

#### Scenario: Badge updates after use

- **WHEN** the DM uses a legendary action reducing remaining to 1
- **THEN** the badge SHALL update to show `1/3` (for a pool of 3)

#### Scenario: Activating the badge opens the detail panel focused on legendary actions

- **GIVEN** a combatant row with a legendary-action badge and a detail-panel handler wired (as `ActiveCombatView` wires it)
- **WHEN** the DM clicks the badge, or focuses it and presses Enter or Space
- **THEN** the combatant's detail panel SHALL open (the handler receives that combatant's id and a legendary focus request)
- **AND** the panel SHALL scroll the Legendary Actions section into view and move focus into it
- **AND** the `LegendaryActionsPanel` spend / restore / pool controls SHALL be visible

#### Scenario: Opening the panel from the name control does not force scroll or focus

- **GIVEN** a combatant row
- **WHEN** the DM opens the detail panel via the combatant-name control (not the badge)
- **THEN** the panel SHALL open at its default scroll position
- **AND** focus SHALL NOT be forced into the Legendary Actions section

#### Scenario: Badge is inert when no detail-panel handler is supplied

- **GIVEN** a combatant card rendered without a detail-panel handler (e.g. in isolation or the setup view)
- **WHEN** the DM activates the badge
- **THEN** nothing SHALL happen and no error SHALL be raised

## REMOVED Requirements

_No requirements removed by this change._

## Traceability

- Proposal element "Badge becomes a button that opens `CombatantDetailPanel`" -> Requirement: Counter badge visible in combatant row (MODIFIED); design Decisions 1, 2, 5
- Proposal element "Opening from the badge scrolls + focuses the legendary section" -> Requirement: Detail panel focuses the legendary section on request (ADDED); Scenario "Activating the badge opens the detail panel focused on legendary actions"; design Decisions 3, 4, 5
- Proposal element "Name-button path unchanged" -> Scenario "Opening the panel from the name control does not force scroll or focus"; Scenario "Panel opens normally without a focus request"; design Decision 4
- Proposal element "Legendary-only; no lair affordance" -> MODIFIED requirement text + Scenario "Badge absent for non-legendary combatants"
- Proposal element "Empty `legendaryActions` with count > 0" -> Scenario "Focus request with no legendary content is a safe no-op"
- Proposal element "Keyboard accessible with an accessible name" -> Scenario "Badge renders for legendary monster"; NFAC Accessibility
- Proposal element "Safe when handler omitted" -> Scenario "Badge is inert when no detail-panel handler is supplied"
- Proposal element "Remove dead `LegendaryActionsPanel` / `LairActionsSlot` imports" -> no behavioral requirement; verified by task-level static check (grep + lint) — see `tasks.md`
- Requirement: Counter badge visible in combatant row -> Tasks: "Convert badge to button", "Wire badge onClick to onShowDetails with focus option", "Remove dead imports", "Badge component tests"
- Requirement: Detail panel focuses the legendary section on request -> Tasks: "Add focusSection prop + anchor to CombatantDetailPanel", "Track detailFocusSection in ActiveCombatView", "Detail panel scroll/focus tests", "ActiveCombatView wiring test"

## Non-Functional Acceptance Criteria

### Requirement: Backward-compatible contract

#### Scenario: Existing callers and the name-button path are unaffected

- **GIVEN** the widened `onShowDetails` signature (optional third `options` argument) and the new optional `CombatantDetailPanel` `focusSection` prop
- **WHEN** the project is type-checked and the combat / `CombatantCard` / `ActiveCombatView` / `CombatantDetailPanel` unit suites are run via `npm run test:unit`
- **THEN** TypeScript SHALL compile with no changes to existing call sites
- **AND** the pre-existing suites SHALL pass, other than updates to assertions that hard-coded the badge's `span` tag (audit found none)
- **AND** opening the panel via the combatant-name control SHALL behave exactly as before

### Requirement: Reliability

#### Scenario: Graceful degradation of scroll/focus

- **GIVEN** an environment where `Element.prototype.scrollIntoView` is unavailable, or a combatant whose legendary section renders no content
- **WHEN** `CombatantDetailPanel` receives the legendary focus request
- **THEN** the panel SHALL render without raising an error
- **AND** the absence of scrolling SHALL NOT block interaction with the rest of the panel

### Requirement: Security

See functional scenarios: "Activating the badge opens the detail panel focused on legendary actions" and "Badge is inert when no detail-panel handler is supplied". This change introduces no new input handling, network calls, or state mutations — the badge invokes an existing in-process callback with an existing combatant id and a literal section name, and the panel calls DOM APIs on its own subtree — so there is no distinct security scenario to add.

### Requirement: Accessibility

#### Scenario: Badge is operable without a pointer

- **GIVEN** a combatant row with a legendary-action badge
- **WHEN** a keyboard user tabs to the badge and presses Enter or Space
- **THEN** the badge SHALL activate identically to a mouse click
- **AND** the badge SHALL have a programmatically determinable accessible name

#### Scenario: Focus is not lost when opening from the badge

- **GIVEN** the detail panel opened via the badge
- **WHEN** the scroll/focus request is applied
- **THEN** keyboard focus SHALL land on a focusable element inside the Legendary Actions section (or the section container), never on a non-interactive node or `document.body`
