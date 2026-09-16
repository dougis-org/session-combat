## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../changes/archive/2026-09-16-default-condition-catalog/design.md) document, not a replacement.

### Requirement: ADDED Default condition catalog storage

The system SHALL persist a catalog of standard D&D 5e conditions plus commonly-needed spell/feature-inflicted status effects (name + description) in a dedicated MongoDB collection, seeded by a script rather than hardcoded in application code. The catalog contains 18 entries: the 15 standard conditions plus Slowed, Confused, and Turned.

#### Scenario: Catalog is readable after seeding

- **Given** the `conditionCatalog` collection has been populated by the seed script with all 18 default conditions
- **When** `storage.loadConditionCatalog()` is called
- **Then** it returns all 18 entries, each with a non-empty `name` and `description`

#### Scenario: Re-running the seed script is idempotent

- **Given** the `conditionCatalog` collection already contains the seeded 18 conditions
- **When** the seed script is run again
- **Then** the collection still contains exactly 18 entries (upserted by name, not duplicated)

### Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog

The system SHALL include Slowed, Confused, and Turned as default catalog conditions, each with a non-empty SRD-style `name` and `description`, sourced from `CONDITION_CATALOG` alongside the existing 15 standard conditions. See [`design.md`](../../changes/archive/2026-09-16-expand-default-conditions/design.md) and [`tasks.md`](../../changes/archive/2026-09-16-expand-default-conditions/tasks.md) for the change that introduced these three entries.

#### Scenario: New conditions present after seeding

- **Given** the seed script has been run against `CONDITION_CATALOG`
- **When** `storage.loadConditionCatalog()` is called
- **Then** the result includes entries named "Slowed", "Confused", and "Turned", each with a non-empty `description`

#### Scenario: New conditions selectable from the condition dropdown

- **Given** the Add Condition modal is open for a combatant and the catalog has loaded successfully
- **When** the user selects "Slowed" (or "Confused", or "Turned") from the condition dropdown and clicks Add
- **Then** the combatant's conditions list includes a new `StatusCondition` with that `name` and `description` equal to the catalog's stored description for it — identical behavior to selecting any existing catalog condition (e.g. "Poisoned")

### Requirement: ADDED Condition dropdown with catalog descriptions

The system SHALL let a user select a standard condition from a dropdown when adding a condition to a combatant, auto-populating that condition's description, while still allowing a free-text "Custom" condition with no description.

#### Scenario: Selecting a catalog condition populates its description

- **Given** the Add Condition modal is open for a combatant and the catalog has loaded successfully
- **When** the user selects "Poisoned" from the condition dropdown and clicks Add
- **Then** the combatant's conditions list includes a new `StatusCondition` with `name: "Poisoned"` and `description` equal to the catalog's stored description for Poisoned

#### Scenario: Custom condition entry unchanged

- **Given** the Add Condition modal is open for a combatant and the catalog has loaded successfully
- **When** the user selects "Custom…" from the dropdown, types a free-text condition name, optionally sets a duration, and clicks Add
- **Then** the combatant's conditions list includes a new `StatusCondition` with the entered `name`, `description: ""`, and the entered `duration` (if any) — matching today's free-text validation rules (trimmed name 1–100 chars, optional duration 1–10,000)

#### Scenario: Catalog fetch failure falls back to custom entry

- **Given** the Add Condition modal is open for a combatant and the catalog fetch fails or returns zero entries
- **When** the modal finishes loading
- **Then** the dropdown is not shown (or is limited to "Custom…"), a muted note indicates no default conditions are loaded, and the user can still add a free-text condition exactly as in the Custom path

#### Scenario: Modal is usable while catalog is loading

- **Given** the Add Condition modal has just opened and the catalog fetch has not yet resolved
- **When** the user interacts with the modal before the fetch resolves
- **Then** the free-text/Custom entry path is already available and usable (the modal does not block on the catalog fetch)

### Requirement: ADDED Inline condition descriptions in the combatant card's expanded list

The system SHALL show each applied condition's description inline in the combatant card's existing collapsed/expandable "Conditions (N)" list when a description is present, without introducing a hover tooltip or a separate badge/chiclet element.

#### Scenario: Description shown inline for catalog conditions

- **Given** a combatant has a condition applied whose `description` is non-empty (e.g., selected from the catalog)
- **When** the DM expands the "Conditions (N)" list on that combatant's card
- **Then** the condition's row shows its name, duration (if set), and its description text, with no hover interaction required

#### Scenario: No description line for custom conditions

- **Given** a combatant has a condition applied whose `description` is empty (e.g., a free-text Custom condition)
- **When** the DM expands the "Conditions (N)" list on that combatant's card
- **Then** the condition's row shows its name and duration (if set) exactly as today, with no extra blank description line

## Traceability

- Proposal element: "New MongoDB collection storing the default condition catalog" -> Requirement: ADDED Default condition catalog storage
- Proposal element: "Replace the free-text name input... with a dropdown... plus a Custom… option" -> Requirement: ADDED Condition dropdown with catalog descriptions
- Proposal element: "Update ConditionControls's expanded... list to render each condition's description inline" -> Requirement: ADDED Inline condition descriptions in the combatant card's expanded list
- Design decision: Decision 1 (repo/collection pattern) -> Requirement: ADDED Default condition catalog storage
- Design decision: Decisions 3, 4 (dropdown + graceful fallback) -> Requirement: ADDED Condition dropdown with catalog descriptions
- Design decision: Decision 5 (inline, conditional rendering) -> Requirement: ADDED Inline condition descriptions in the combatant card's expanded list
- Requirement: ADDED Default condition catalog storage -> Task(s): create collection/repo, write seed script
- Proposal element (expand-default-conditions): "Add three entries to `CONDITION_CATALOG`... Slowed, Confused, Turned" -> Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog
- Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog -> Task(s): edit `lib/data/conditionCatalog.ts`, update/add unit test assertions
- Requirement: ADDED Condition dropdown with catalog descriptions -> Task(s): catalog API route, ConditionFormModal changes
- Requirement: ADDED Inline condition descriptions in the combatant card's expanded list -> Task(s): ConditionControls changes

## Non-Functional Acceptance Criteria

### Requirement: Performance

#### Scenario: Modal is usable while catalog is loading

See functional scenario: "Modal is usable while catalog is loading" (Condition dropdown with catalog descriptions) — the catalog fetch (~15 small rows) never blocks the modal's free-text/Custom path from being usable immediately on open.

### Requirement: Security

#### Scenario: Catalog entry fields are rendered as plain text

- **Given** a `conditionCatalog` document contains extra/unexpected fields or a `description` containing HTML-like text (e.g. `<b>test</b>`)
- **When** the catalog is read via `storage.loadConditionCatalog()` and rendered in the dropdown or the inline description line
- **Then** the API response and repo return only the typed `{ name, description }` shape (extra fields dropped), and the description renders as literal text with no HTML injected into the DOM

### Requirement: Reliability

#### Scenario: Recovery behavior

See functional scenario: "Catalog fetch failure falls back to custom entry" (Condition dropdown with catalog descriptions) — a failed or empty catalog read degrades to the Custom-only path rather than surfacing an unhandled error or blocking condition entry.
