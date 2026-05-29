## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

_No net-new capabilities are added by this change._

## MODIFIED Requirements

### Requirement: MODIFIED UUID generation uses Node built-in instead of the `uuid` package

The system SHALL generate RFC 4122 v4 UUIDs for entity IDs using `crypto.randomUUID()` from Node's built-in `crypto` module, with no dependency on the `uuid` npm package.

#### Scenario: Monster import generates a valid UUID id

- **Given** a raw monster JSON object is passed to `transformMonster()`
- **When** the function executes
- **Then** the returned object has an `id` field matching `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`

#### Scenario: Spell transform generates a valid UUID id

- **Given** a raw spell JSON object is passed to `transformSpell()`
- **When** the function executes
- **Then** the returned object has an `id` field matching the RFC 4122 v4 pattern

#### Scenario: Spell helper generates a valid UUID id

- **Given** `spell-helpers.ts` constructs a spell object
- **When** the object is created
- **Then** the `id` field matches the RFC 4122 v4 pattern

#### Scenario: E2E test action helper generates a UUID

- **Given** the E2E `actions.ts` helper runs
- **When** it calls `randomUUID()`
- **Then** the result is a valid RFC 4122 v4 UUID string

#### Scenario: E2E isolation token strips hyphens correctly

- **Given** `isolation.ts` generates an isolation token
- **When** it calls `randomUUID().replace(/-/g, "")`
- **Then** the result is a 32-character lowercase hexadecimal string (no hyphens)

## REMOVED Requirements

### Requirement: REMOVED Dependency on `uuid` npm package

Reason for removal: `crypto.randomUUID()` is a drop-in replacement for `uuid.v4()` available in the Node 25.6.1 runtime. The package and its mismatched `@types/uuid` devDependency are no longer needed.

## Traceability

- Proposal element "Replace 5 uuid imports" → Requirement: MODIFIED UUID generation uses Node built-in
- Proposal element "Remove uuid + @types/uuid from package.json" → Requirement: REMOVED Dependency on uuid npm package
- Design decision 1 (named import from "crypto") → Requirement: MODIFIED UUID generation
- Design decision 2 (preserve hyphen-strip pattern) → Scenario: E2E isolation token strips hyphens correctly
- Requirement: MODIFIED UUID generation → Tasks: migrate-source-files, migrate-test-helpers, remove-package

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: UUID generation is cryptographically random

- **Given** the system is running on Node 25.6.1
- **When** `crypto.randomUUID()` is called
- **Then** the output is drawn from the platform CSPRNG (same guarantee as `uuid` v4), confirmed by Node.js documentation and implementation

### Requirement: Operability

#### Scenario: No uuid references remain after migration

- **Given** the migration is applied
- **When** `grep -r "from 'uuid'\|from \"uuid\"\|require('uuid')\|require(\"uuid\")" --include="*.ts" --include="*.tsx" --include="*.js"` is run from the project root (excluding node_modules)
- **Then** the command returns zero matches

#### Scenario: Package install succeeds cleanly

- **Given** `uuid` and `@types/uuid` are removed from `package.json`
- **When** `npm install` is run
- **Then** it exits with code 0 and `package-lock.json` contains no `uuid` entries
