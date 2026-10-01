## Purpose
Define the sorted, searchable encounter picker on combat setup (`/combat` and `/campaigns/[id]/combat`). See [design](../../changes/archive/2026-10-01-encounter-picker-sort-search/design.md) and [tasks](../../changes/archive/2026-10-01-encounter-picker-sort-search/tasks.md).

## Requirements

### Requirement: Encounter options sorted alphabetically
The system SHALL list encounter options in the combat setup "Select Encounter" control sorted alphabetically by name, case-insensitively, after the "No encounter" option. The options SHALL be rendered as an always-visible, scrollable listbox (role `listbox`, labelled "Encounters") of selectable `option` rows below the search input, not a native `<select>`.

#### Scenario: Options sorted alphabetically
- **GIVEN** encounters named "Owlbear Den", "goblin Ambush", and "Dragon Lair" in that load order
- **WHEN** the combat setup view renders
- **THEN** the options after "No encounter" appear as "Dragon Lair", "goblin Ambush", "Owlbear Den"

### Requirement: Encounter search filters options by name
The system SHALL provide a search input labelled "Search encounters" above the encounter list that filters the visible option list in real time, on every keystroke, by case-insensitive substring match on the trimmed query. Clicking an option SHALL select it, the selected option SHALL be marked `aria-selected` and visually highlighted, and "No encounter" SHALL clear the selection. The list SHALL follow the ARIA listbox pattern: a single tab stop (the selected option), ArrowUp/ArrowDown/Home/End moving focus, and Enter or Space selecting the focused option. The input SHALL be keyboard focusable and be the only element with that accessible name.

#### Scenario: Search filters options by name
- **GIVEN** encounters "Goblin Ambush" and "Owlbear Den"
- **WHEN** the DM types "gob" into the search input
- **THEN** only "Goblin Ambush" (plus "No encounter") is offered

#### Scenario: Blank query shows all
- **GIVEN** the DM typed "gob" then clears the input, or enters only spaces
- **WHEN** the list re-renders
- **THEN** all encounters are offered

#### Scenario: Selected encounter stays visible when filtered out
- **GIVEN** "Owlbear Den" is selected
- **WHEN** the DM types "gob"
- **THEN** "Owlbear Den" remains an option and remains selected, alongside "Goblin Ambush"

#### Scenario: No matches shows message
- **GIVEN** encounters exist and none is selected
- **WHEN** the DM types "zzz"
- **THEN** the text "No encounters match" is shown and only "No encounter" is offered

#### Scenario: Campaign empty state has no search
- **GIVEN** a `campaignId` is set and there are no linked encounters
- **WHEN** the view renders
- **THEN** the existing empty state is shown and no search input is rendered

### Requirement: Encounter picker applies to all combat setup entry points
The system SHALL apply the sorted, searchable encounter picker on both `/combat` and `/campaigns/[id]/combat`.

#### Scenario: Both routes show the search
- **GIVEN** the DM has at least one encounter
- **WHEN** they open `/combat` or `/campaigns/[id]/combat`
- **THEN** the "Search encounters" input is visible above the encounter list

### Requirement: Filtering is synchronous and client-side
The system SHALL filter and sort encounters synchronously in memory with no network request, including for 500 encounters.

#### Scenario: Large list
- **GIVEN** 500 encounters
- **WHEN** the helper filters and sorts with any query
- **THEN** it returns the correct result synchronously
