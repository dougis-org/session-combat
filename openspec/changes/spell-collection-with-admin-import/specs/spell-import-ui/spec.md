## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Spell Import UI

The system SHALL provide an admin-only web interface for importing spells from open5e.

#### Scenario: Access import page

- **Given** an admin user
- **When** they navigate to /spells/import
- **Then** the system SHALL display the spell import page with sync controls

#### Scenario: Access import page non-admin

- **Given** a non-admin user
- **When** they navigate to /spells/import
- **Then** the system SHALL return 403 or redirect to unauthorized

#### Scenario: Trigger spell sync

- **Given** an admin user on /spells/import
- **When** they click "Sync from open5e"
- **Then** the system SHALL call POST /api/import/open5e with { type: "spells" }
- **And** display progress or completion status

#### Scenario: Sync adds net-new spells only

- **Given** some spells already synced from open5e
- **When** admin triggers sync again
- **Then** only net-new spells SHALL be added
- **And** existing spells SHALL be skipped

#### Scenario: Sync handles API errors

- **Given** open5e API returns error during sync
- **When** admin triggers sync
- **Then** the system SHALL display error message
- **And** partial progress SHALL be preserved (restartable)

## Traceability

- Proposal element: Admin import UI for spells
  - Requirement: Spell Import UI
- Design decision: app/spells/import/page.tsx
  - Requirement: Spell Import UI
- Task(s): TBD in tasks.md
