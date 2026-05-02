## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Monster open5e Sync

The system SHALL allow syncing monsters from open5e API via admin import.

#### Scenario: Sync monsters from open5e

- **Given** an admin user on /monsters/import
- **When** they select "Sync from open5e" and click sync
- **Then** the system SHALL call POST /api/import/open5e with { type: "monsters" }
- **And** net-new monsters SHALL be added to monsterTemplates collection

#### Scenario: Monster import with existing templates

- **Given** global monster "Goblin" (source: "SRD") exists
- **When** sync imports "Goblin" from open5e
- **Then** "Goblin" from open5e SHALL be skipped (exists with different source)
- **And** existing "Goblin" SHALL remain unchanged

#### Scenario: File upload still works

- **Given** a user has a JSON monster file
- **When** they upload via /monsters/import file upload
- **Then** the system SHALL process as before (existing behavior preserved)

#### Scenario: Combined sync options

- **Given** an admin on /monsters/import
- **When** they select both file upload and open5e sync
- **Then** both SHALL be processed
- **And** dedupe SHALL apply across both sources

## Traceability

- Proposal element: Monster import extended to use open5e as additional data source
  - Requirement: Monster open5e Sync
- Design decision: Enhanced import UI, transformMonster.ts
  - Requirement: Monster open5e Sync
- Task(s): TBD in tasks.md
