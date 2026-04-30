## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Spell CRUD API

The system SHALL provide RESTful API endpoints for managing spell templates.

#### Scenario: List spells

- **Given** authenticated admin user
- **When** they send GET /api/spells
- **Then** the system SHALL return array of all spellTemplates with `isGlobal: true`

#### Scenario: Get spell by ID

- **Given** authenticated user
- **When** they send GET /api/spells/[id]
- **Then** the system SHALL return the spellTemplate if found, or 404

#### Scenario: Create spell

- **Given** authenticated admin user
- **When** they send POST /api/spells with valid spell data
- **Then** the system SHALL create spellTemplate with `isGlobal: true` and return 201

#### Scenario: Create spell non-admin

- **Given** authenticated non-admin user
- **When** they send POST /api/spells
- **Then** the system SHALL return 403 Forbidden

#### Scenario: Update spell

- **Given** authenticated admin user
- **When** they send PUT /api/spells/[id] with updated data
- **Then** the system SHALL update and return 200

#### Scenario: Delete spell

- **Given** authenticated admin user
- **When** they send DELETE /api/spells/[id]
- **Then** the system SHALL delete and return 204

#### Scenario: Filter spells by concentration

- **Given** authenticated user
- **When** they send GET /api/spells?concentration=true
- **Then** the system SHALL return only spells where `concentration: true`

## Traceability

- Proposal element: Spell collection stored in database + Admin import UI for spells
  - Requirement: Spell CRUD API
- Design decision: GET/POST /api/spells, GET/PUT/DELETE /api/spells/[id]
  - Requirement: Spell CRUD API
- Task(s): TBD in tasks.md
