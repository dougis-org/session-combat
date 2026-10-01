## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Encounter options sorted alphabetically

The system SHALL list encounter options in the combat setup "Select Encounter" control sorted alphabetically by name, case-insensitively, after the "No encounter" option.

#### Scenario: Options sorted alphabetically

- **Given** encounters named "Owlbear Den", "goblin Ambush", and "Dragon Lair" in that load order
- **When** the combat setup view renders
- **Then** the options after "No encounter" appear as "Dragon Lair", "goblin Ambush", "Owlbear Den"

### Requirement: ADDED Encounter search filters options by name

The system SHALL provide a search input labelled "Search encounters" above the encounter select that filters options by case-insensitive substring match on the trimmed query.

#### Scenario: Search filters options by name

- **Given** encounters "Goblin Ambush" and "Owlbear Den"
- **When** the DM types "gob" into the search input
- **Then** only "Goblin Ambush" (plus "No encounter") is offered

#### Scenario: Blank query shows all

- **Given** the DM previously typed "gob" then clears the input, or enters only spaces
- **When** the list re-renders
- **Then** all encounters are offered

#### Scenario: Selected encounter stays visible when filtered out

- **Given** "Owlbear Den" is selected
- **When** the DM types "gob"
- **Then** "Owlbear Den" remains an option and remains selected, alongside "Goblin Ambush"

#### Scenario: No matches shows message

- **Given** encounters exist and none is selected
- **When** the DM types "zzz"
- **Then** the text "No encounters match" is shown and only "No encounter" is offered

#### Scenario: Campaign empty state has no search

- **Given** a `campaignId` is set and there are no linked encounters
- **When** the view renders
- **Then** the existing empty state is shown and no search input is rendered

## MODIFIED Requirements

### Requirement: MODIFIED Encounter picker applies to all combat setup entry points

The system SHALL apply the sorted, searchable encounter picker on both `/combat` and `/campaigns/[id]/combat`.

#### Scenario: Both routes show the search

- **Given** the DM has at least one encounter
- **When** they open `/combat` or `/campaigns/[id]/combat`
- **Then** the "Search encounters" input is visible above the encounter select

## REMOVED Requirements

### Requirement: REMOVED None

Reason for removal: Nothing is removed.

## Traceability

- Proposal element -> Requirement: Sort -> Options sorted; Search -> Search filters; Edge cases -> Selection retained / No matches / Campaign empty state; Both routes -> MODIFIED requirement.
- Design decision -> Requirement: Decision 1, 3 -> Search filters; Decision 2 -> Sorted and Selection retained.
- Requirement -> Task(s): see `openspec/changes/encounter-picker-sort-search/tasks.md` (Execution tasks 1-4).

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Large list

- **Given** 500 encounters
- **When** the helper filters and sorts with any query
- **Then** it returns the correct result synchronously with no network request

### Requirement: Accessibility

#### Scenario: Labelled input

- **Given** the picker is rendered
- **When** queried by accessible name "Search encounters"
- **Then** exactly one text input is found and it is keyboard focusable

### Requirement: Security

See functional scenarios: none apply; filtering is client-side over already-authorized data and introduces no new access path.
