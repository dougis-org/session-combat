## MODIFIED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-06-14-fix-campaign-catalog-copy/design.md) document, not a replacement.

### Requirement: MODIFIED Campaign catalog list is alphabetically sorted

The system SHALL return global campaign templates sorted ascending by name using `.sort({ name: 1 }).collation({ locale: 'en', strength: 2 })` for true case-insensitive alphabetical ordering at the DB level.

#### Scenario: List returned in alphabetical order

- **Given** multiple global campaign templates exist with names in arbitrary insertion order (e.g., "Rime of the Frostmaiden", "Curse of Strahd", "Baldur's Gate")
- **When** `GET /api/campaigns/global` is called
- **Then** the response array is ordered: `["Baldur's Gate", "Curse of Strahd", "Rime of the Frostmaiden"]`

#### Scenario: Empty catalog

- **Given** no global campaign templates exist
- **When** `GET /api/campaigns/global` is called
- **Then** the response is an empty array `[]`

### Requirement: MODIFIED Campaign catalog UI supports name search

The system SHALL provide a text input in the catalog section that filters the displayed templates to only those whose name contains the search string (case-insensitive).

#### Scenario: Search filters by name

- **Given** the catalog contains templates: "Curse of Strahd", "Rime of the Frostmaiden", "Candlekeep Mysteries"
- **When** the user types "rim" in the search input
- **Then** only "Rime of the Frostmaiden" is rendered in the template grid

#### Scenario: Empty search shows all templates

- **Given** the catalog contains templates
- **When** the search input is empty
- **Then** all templates are rendered

#### Scenario: Search with no matches shows empty state

- **Given** the catalog contains templates
- **When** the user types a string that matches no template names
- **Then** the template grid renders no template cards
- **And** an appropriate empty-state message is shown (e.g., "No templates match your search.")

## ADDED Requirements

_(none)_

## REMOVED Requirements

_(none)_

## Traceability

- Proposal element "Alphabetize catalog list" → Requirement: MODIFIED Campaign catalog list is alphabetically sorted
- Proposal element "Add search/filter to catalog UI" → Requirement: MODIFIED Campaign catalog UI supports name search
- Design decision 2 (sort in storage layer) → Requirement: MODIFIED Campaign catalog list is alphabetically sorted
- Design decision 3 (client-side search state) → Requirement: MODIFIED Campaign catalog UI supports name search
- Requirement: MODIFIED Campaign catalog list is alphabetically sorted → Task: Sort global templates in storage
- Requirement: MODIFIED Campaign catalog UI supports name search → Task: Add search input to catalog UI

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Search filtering is synchronous

- **Given** templates are already loaded into component state
- **When** the user types in the search input
- **Then** the filtered list updates without a network request (no additional API calls observed)

### Requirement: Security

> See functional scenarios above — all catalog access is unauthenticated read (public catalog); no access-control scenarios are needed here. The copy action security is covered in `specs/campaign-catalog-copy/spec.md`.
