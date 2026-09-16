## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog

The system SHALL include Slowed, Confused, and Turned as default catalog conditions, each with a non-empty SRD-style `name` and `description`, sourced from `CONDITION_CATALOG` alongside the existing 15 standard conditions.

#### Scenario: New conditions present after seeding

- **Given** the seed script has been run against `CONDITION_CATALOG`
- **When** `storage.loadConditionCatalog()` is called
- **Then** the result includes entries named "Slowed", "Confused", and "Turned", each with a non-empty `description`

#### Scenario: New conditions selectable from the condition dropdown

- **Given** the Add Condition modal is open for a combatant and the catalog has loaded successfully
- **When** the user selects "Slowed" (or "Confused", or "Turned") from the condition dropdown and clicks Add
- **Then** the combatant's conditions list includes a new `StatusCondition` with that `name` and `description` equal to the catalog's stored description for it — identical behavior to selecting any existing catalog condition (e.g. "Poisoned")

## MODIFIED Requirements

### Requirement: MODIFIED Default condition catalog storage

The system SHALL persist a catalog of standard D&D 5e conditions plus commonly-needed spell/feature-inflicted status effects (name + description) in a dedicated MongoDB collection, seeded by a script rather than hardcoded in application code. The catalog now contains 18 entries: the 15 standard conditions plus Slowed, Confused, and Turned.

#### Scenario: Catalog is readable after seeding

- **Given** the `conditionCatalog` collection has been populated by the seed script with all 18 default conditions
- **When** `storage.loadConditionCatalog()` is called
- **Then** it returns all 18 entries, each with a non-empty `name` and `description`

#### Scenario: Re-running the seed script is idempotent

- **Given** the `conditionCatalog` collection already contains the seeded 18 conditions
- **When** the seed script is run again
- **Then** the collection still contains exactly 18 entries (upserted by name, not duplicated)

## Traceability

- Proposal element: "Add three entries to `CONDITION_CATALOG`... Slowed, Confused, Turned" -> Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog
- Proposal element: "Update any test that asserts the catalog's exact contents/length" -> Requirement: MODIFIED Default condition catalog storage
- Design decision: Decision 1 (static authored entries), Decision 2 (append order) -> Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog
- Design decision: Decision 3 (test length bump + explicit name assertions) -> Requirement: MODIFIED Default condition catalog storage
- Requirement: ADDED Slowed, Confused, and Turned in the default condition catalog -> Task(s): edit `lib/data/conditionCatalog.ts`, update/add unit test assertions
- Requirement: MODIFIED Default condition catalog storage -> Task(s): update `tests/unit/lib/scripts/seedConditionCatalog.test.ts` length assertion, re-run seed script per environment

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: New entries follow existing plain-text rendering guarantees

See functional scenario: "Catalog entry fields are rendered as plain text" (existing `condition-catalog` capability spec) — Slowed/Confused/Turned descriptions are plain SRD-style prose with no markup, and flow through the same typed `{ name, description }` projection and plain-text rendering as every other catalog entry; no new rendering path is introduced.
