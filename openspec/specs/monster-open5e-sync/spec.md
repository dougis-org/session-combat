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

## MODIFIED Requirements

### Requirement: Monster import page scope

The system SHALL limit the `/monsters/import` page to the administrative open5e sync function and SHALL NOT provide a JSON-file upload form on that page. User-facing JSON import is a separate capability: the `Import Monster(s)` modal on `/monsters` (see the `monster-import` capability).

#### Scenario: Import page has no file upload form

- **Given** a user navigates to `/monsters/import`
- **When** the page renders
- **Then** the open5e sync panel is present
- **And** no "Upload Monster JSON File" form is present

## Traceability

- Proposal element: Monster import extended to use open5e as additional data source
  - Requirement: Monster open5e Sync
- Design decision: Enhanced import UI, transformMonster.ts
  - Requirement: Monster open5e Sync
- Task(s): TBD in tasks.md
