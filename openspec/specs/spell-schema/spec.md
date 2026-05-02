## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED SpellTemplate Schema

The system SHALL store spell data in a `spellTemplates` MongoDB collection with the following schema.

#### Scenario: SpellTemplate structure

- **Given** a SpellTemplate document
- **When** stored in the database
- **Then** it SHALL contain: `id`, `userId` (GLOBAL_USER_ID), `isGlobal: true`, `source: "open5e"`, `name`, `level`, `concentration`, `school`, `description`, `castingTime`, `range`, `duration`, `components` (object with verbal/somatic/material booleans), `createdAt`, `updatedAt`

#### Scenario: Concentration flag present

- **Given** a spell requiring concentration
- **When** stored as SpellTemplate
- **Then** the `concentration` field SHALL be `true`

#### Scenario: Cantrip spells

- **Given** a cantrip spell (level 0)
- **When** stored as SpellTemplate
- **Then** the `level` field SHALL be `0`

## Traceability

- Proposal element: Spell collection stored in database
  - Requirement: SpellTemplate Schema
- Design decision: spellTemplates collection + SpellTemplate type
  - Requirement: SpellTemplate Schema
- Task(s): TBD in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Security

#### Scenario: Global-only spells

- **Given** a non-admin user
- **When** they attempt to create, modify, or delete a spellTemplate
- **Then** the system SHALL return 403 Forbidden

#### Scenario: Admin spells

- **Given** an admin user
- **When** they create a spellTemplate via API
- **Then** the spell SHALL be created with `isGlobal: true` and `userId: GLOBAL_USER_ID`
