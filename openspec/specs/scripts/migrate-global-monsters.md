## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED migrateGlobalMonsters is importable without auto-executing

The system SHALL allow `migrateGlobalMonsters.ts` to be imported as a module without triggering database connections or side effects.

#### Scenario: Import without execution

- **Given** a test file that imports `migrateGlobalMonsters.ts`
- **When** the module is loaded
- **Then** no database connection is attempted and no console output is produced

### Requirement: ADDED migrateGlobalMonsters tags untagged global monsters with source "SRD"

The system SHALL update all global monsters belonging to `GLOBAL_USER_ID` that have no `source`, a null `source`, or an empty string `source` to `source: "SRD"`.

#### Scenario: Untagged global monster is migrated

- **Given** a MongoDB collection containing a global monster with `userId: GLOBAL_USER_ID`, `isGlobal: true`, and `source` absent
- **When** `migrateGlobalMonsters()` is called
- **Then** the document has `source: "SRD"` and the function returns `modifiedCount >= 1`

#### Scenario: Already-tagged monster is not re-migrated

- **Given** a MongoDB collection containing a global monster with `source: "SRD"` already set
- **When** `migrateGlobalMonsters()` is called
- **Then** that document is not modified and `modifiedCount` does not increase for it

#### Scenario: Non-global monster is not touched

- **Given** a MongoDB collection containing a monster with `isGlobal: false` and no `source`
- **When** `migrateGlobalMonsters()` is called
- **Then** that document remains unchanged

### Requirement: ADDED migrateGlobalMonsters is idempotent

The system SHALL produce no additional changes when called a second time after a successful migration.

#### Scenario: Double-run idempotency

- **Given** a collection that has already been fully migrated (all global monsters have `source: "SRD"`)
- **When** `migrateGlobalMonsters()` is called again
- **Then** `modifiedCount === 0`

## MODIFIED Requirements

None.

## REMOVED Requirements

None.

## Traceability

- Proposal element "add require.main guard to migrateGlobalMonsters.ts" -> Requirement: migrateGlobalMonsters is importable without auto-executing
- Proposal element "integration test: pre/post DB state, idempotency" -> Requirements: tags untagged monsters, idempotency
- Design decision 1 (require.main guard) -> Requirement: importable without auto-executing
- Design decision 3 (integration test placement) -> Requirements: tags untagged monsters, idempotency
- Requirements -> Task: T1 (guard + export), T3 (integration test)

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Direct CLI execution still works after guard is added

- **Given** the `require.main === module` guard is in place
- **When** the script is run directly via `npx ts-node lib/scripts/migrateGlobalMonsters.ts`
- **Then** the migration executes as before and `process.exit` is called with code 0 on success
