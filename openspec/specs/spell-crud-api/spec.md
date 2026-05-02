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
- **And** omitted fields SHALL be preserved from the existing spell (partial update)
- **And** the `updatedAt` field SHALL be set to the current time

#### Scenario: Delete spell

- **Given** authenticated admin user
- **When** they send DELETE /api/spells/[id]
- **Then** the system SHALL delete and return 204

#### Scenario: Filter spells by concentration

- **Given** authenticated user
- **When** they send GET /api/spells?concentration=true
- **Then** the system SHALL return only spells where `concentration: true`

### Design Decisions

#### Shared validation and construction helpers

Validation and request-body parsing logic shared across spell route handlers SHALL live in `lib/api/spell-helpers.ts`. This includes:

- `SpellBody` interface — request body shape matching SpellTemplate optional fields
- `applySpellUpdates(existing, updates)` — validates partial update fields and produces merged SpellTemplate; returns `{ spell, errors }`; if errors, returns existing unchanged
- `parseComponents(components)` — parses the components object from a request body (imported from `lib/import/spellValidation.ts` for reuse)

Individual route handlers are responsible for: auth checks, loading existing resources, calling storage, and serializing responses.

#### PUT partial update field semantics

When updating a spell via PUT /api/spells/[id]:

- Fields **not present** in the request body → preserve existing value
- Fields **present with valid values** → update to new value
- Fields **present with `undefined`** → preserve existing value (same as omitted)
- Optional fields (`higherLevel`, `damageType`, `saveDc`, `saveType`, `attackRoll`) may be explicitly set to `null` to clear them

Required fields (`name`, `level`, `school`, etc.) are validated; if validation fails, return 400 with the first error message.

## Traceability

- Proposal element: Spell collection stored in database + Admin import UI for spells
  - Requirement: Spell CRUD API
- Design decision: GET/POST /api/spells, GET/PUT/DELETE /api/spells/[id]
  - Requirement: Spell CRUD API
- Design decision: shared helpers in lib/api/spell-helpers.ts
  - Requirement: avoid duplication between spell route handlers
- Task(s): TBD in tasks.md
