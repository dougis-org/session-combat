## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Deduplication Engine

The system SHALL prevent duplicate entries when syncing from open5e.

#### Scenario: Skip existing by name and source

- **Given** a spell "Fireball" already exists with source "open5e"
- **When** sync imports "Fireball" from open5e
- **Then** "Fireball" SHALL be skipped (not re-inserted)

#### Scenario: Insert net-new item

- **Given** no spell named "Magic Missile" with source "open5e" exists
- **When** sync imports "Magic Missile" from open5e
- **Then** "Magic Missile" SHALL be inserted

#### Scenario: Different source same name

- **Given** a spell "Healing Word" with source "custom" exists
- **When** sync imports "Healing Word" from open5e
- **Then** "Healing Word" from open5e SHALL be inserted (different source)

#### Scenario: User monster not affected

- **Given** a user has created "My Goblin" (userId: "user123", source: null)
- **When** sync imports "Goblin" from open5e
- **Then** "Goblin" from open5e SHALL be inserted
- **And** "My Goblin" SHALL remain unchanged

#### Scenario: Restart mid-sync

- **Given** sync was interrupted after importing 500 spells
- **When** sync is triggered again
- **Then** the first 500 spells SHALL be skipped
- **And** remaining spells SHALL be imported

## Traceability

- Proposal element: Robust dedupe (only add net new)
  - Requirement: Deduplication Engine
- Design decision: dedupeEngine.ts - check exists by name + source before insert
  - Requirement: Deduplication Engine
- Task(s): TBD in tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Restartable sync

- **Given** sync is interrupted at 50% completion
- **When** sync is re-triggered
- **Then** all items SHALL eventually be imported
- **And** no duplicates SHALL be created
