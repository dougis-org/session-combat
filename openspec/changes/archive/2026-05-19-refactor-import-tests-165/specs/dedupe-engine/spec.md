## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

## MODIFIED Requirements

### Requirement: MODIFIED importMonsterSingle uses shouldImport for existence check

The system SHALL check for duplicate monsters via `shouldImport("monsters", name, source)` before attempting to transform or save, consistent with the spell import path.

#### Scenario: Duplicate monster is skipped without transformation

- **Given** a monster with the same name and source already exists in the database
- **When** `importMonsterSingle` is called with a raw Open5E creature matching that name and source
- **Then** it returns `{ inserted: false, skipped: true, error: false }` without calling `transformMonster` or `storage.saveMonsterTemplate`

#### Scenario: New monster is transformed and saved

- **Given** no monster with the given name and source exists in the database
- **When** `importMonsterSingle` is called with a valid raw Open5E creature
- **Then** `transformMonster` is called, the monster is saved via `storage.saveMonsterTemplate`, and it returns `{ inserted: true, skipped: false, error: false }`

#### Scenario: Invalid monster that is also a duplicate is skipped

- **Given** a monster with the same name and source already exists in the database
- **When** `importMonsterSingle` is called with a raw creature that would fail validation
- **Then** it returns `{ inserted: false, skipped: true, error: false }` (duplicate check wins; validation is never reached)

#### Scenario: Invalid monster with no duplicate is errored

- **Given** no monster with the given name and source exists in the database
- **When** `importMonsterSingle` is called with a raw creature that fails `transformMonster` validation
- **Then** it returns `{ inserted: false, skipped: false, error: true }`

## REMOVED Requirements

### Requirement: REMOVED Direct `storage.findMonsterByNameAndSource` call in `importMonsterSingle`

Reason for removal: Replaced by `shouldImport("monsters", ...)` to eliminate duplication with the spell import path.

## Traceability

- Proposal element "importMonsterSingle duplicates existence check" -> Requirement: MODIFIED importMonsterSingle uses shouldImport
- Design decision 1 (call shouldImport first) -> Requirement: MODIFIED importMonsterSingle uses shouldImport
- Requirement -> Task: "Refactor importMonsterSingle to use shouldImport" in tasks.md

## Non-Functional Acceptance Criteria

Not applicable — this is a pure refactor with no performance, security, or reliability impact. Transform is cheap; the order change has no measurable latency effect.
