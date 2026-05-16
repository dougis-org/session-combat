## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Migration Steps

The system SHALL provide migration steps to transition from static JSON to open5e API sync.

#### Scenario: Retroactively tag existing global monsters

- **Given** existing global monsters in monsterTemplates with no source field
- **When** migration runs
- **Then** each SHALL have `source: "SRD"` added

#### Scenario: Delete static JSON files

- **Given** migration is complete and verified
- **When** admin confirms
- **Then** the following files SHALL be deleted:
  - lib/data/monsters/*.ts (14 category files)
  - lib/data/srd-monsters.ts
  - lib/scripts/seedMonsters.ts

#### Scenario: Verify no seed endpoint dependency

- **Given** after deletion of JSON files
- **When** PUT /api/monsters/global/seed is called
- **Then** it SHALL fetch from open5e (not static files)

#### Scenario: Verify spellTemplates collection empty initially

- **Given** fresh database
- **When** spellTemplates collection is queried
- **Then** it SHALL be empty until sync runs

## MODIFIED Requirements

### Requirement: MODIFIED PUT /api/monsters/global/seed

The system SHALL replace static JSON seeding with open5e API sync.

#### Scenario: Seed triggers open5e sync

- **Given** an admin calls PUT /api/monsters/global/seed
- **When** the request is processed
- **Then** the system SHALL sync monsters from open5e
- **And** the response SHALL indicate sync results

## Traceability

- Proposal element: Replace seed endpoint with open5e sync
  - Requirement: Migration Steps
- Design decision: Migration: retroactively set source: "SRD", delete JSON files
  - Requirement: Migration Steps
- Task(s): TBD in tasks.md
