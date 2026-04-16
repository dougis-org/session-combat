## ADDED Requirements

This document details *changes* to requirements and is additive to the `design.md` document, not a replacement.

### Requirement: ADDED Unit tests for party route PUT handler

The system SHALL have unit tests covering `PUT /api/parties/[id]` handler behavior, including update logic and `_id` stripping.

#### Scenario: PUT updates party and strips _id

- **Given** `tests/unit/api/parties/route.test.ts` exists with GET and POST coverage
- **When** `describe("PUT /api/parties/[id]")` block is added with update and `_id`-stripping assertions
- **Then** `npm run test:unit` passes and PUT handler behavior is covered

#### Scenario: POST asserts ID generation contract

- **Given** the existing POST test in `tests/unit/api/parties/route.test.ts`
- **When** assertions for `_id` absence and UUID `id` are added to the "creates party and returns 201" test
- **Then** the test explicitly verifies the app-level ID contract

### Requirement: ADDED Unit test for storage.saveParty

The system SHALL have a unit test verifying `storage.saveParty` upserts by `{id, userId}` and excludes `_id` from `$set`.

#### Scenario: saveParty upsert shape

- **Given** `tests/unit/storage/storage.test.ts` exists without a `saveParty` describe block
- **When** `describe("storage.saveParty")` is added with a mock collection asserting the updateOne call shape
- **Then** the test verifies the upsert filter is `{id, userId}` and `_id` is excluded from `$set`

### Requirement: ADDED `tests/unit/monster-upload/` folder with sub-files by concern

The system SHALL have a `tests/unit/monster-upload/` folder with four files covering monster upload validation and transformation by distinct concern.

#### Scenario: document-validation.test.ts created

- **Given** no `tests/unit/monster-upload/` folder exists
- **When** `document-validation.test.ts` is created with all `validateMonsterUploadDocument` scenarios
- **Then** `npm run test:unit` passes and document-level validation is covered

#### Scenario: field-validation.test.ts created

- **Given** `document-validation.test.ts` exists and passes
- **When** `field-validation.test.ts` is created with `validateMonsterData` scenarios (required fields, optional, ability scores, arrays, legendaryActionCount)
- **Then** `npm run test:unit` passes and field-level validation is covered

#### Scenario: transform.test.ts created with merged damage type tests

- **Given** `tests/unit/validation/monsterUpload.test.ts` has 101 lines of damage-type filtering tests
- **When** `transform.test.ts` is created with general transform tests plus damage-type filtering as a nested describe
- **Then** `npm run test:unit` passes and all transform behavior (general + damage types + alignment) is covered in one file

#### Scenario: pipeline.test.ts created

- **Given** the integration file's "end-to-end validation flow" describe exists
- **When** `pipeline.test.ts` is created with validate → transform pipeline tests
- **Then** `npm run test:unit` passes

### Requirement: ADDED documentation header to logout-clears-storage.test.ts

The system SHALL have a file header in `tests/integration/offline/logout-clears-storage.test.ts` explaining that mocks are intentional external-boundary mocks.

#### Scenario: Header added

- **Given** the file exists without documentation
- **When** the JSDoc header is added naming the real modules integrated and the boundary-only mocks (`next/navigation`, `fetch`)
- **Then** a reader can immediately understand the mock rationale without investigation

## MODIFIED Requirements

### Requirement: MODIFIED `tests/unit/api/parties/route.test.ts` extended with PUT coverage

The system SHALL contain PUT handler tests alongside existing GET/POST tests.

#### Scenario: File extended, not replaced

- **Given** GET and POST tests already pass
- **When** the PUT describe block is added
- **Then** all existing tests continue to pass and PUT tests are green

### Requirement: MODIFIED `tests/unit/storage/storage.test.ts` extended with saveParty

The system SHALL contain a `saveParty` describe block alongside existing load/delete tests.

#### Scenario: File extended, not replaced

- **Given** loadCharacters, entity normalization, and deleteCharacter tests already pass
- **When** the saveParty block is added
- **Then** all existing tests continue to pass and saveParty tests are green

## REMOVED Requirements

### Requirement: REMOVED `tests/integration/monsterUpload.test.ts`

Reason for removal: Content fully migrated to `tests/unit/monster-upload/` sub-files. File deleted after all destination tests pass.

### Requirement: REMOVED `tests/integration/monsterUploadRoute.test.ts`

Reason for removal: Every test was a duplicate of `validateMonsterUploadDocument` scenarios already covered in `monsterUpload.test.ts` (and subsequently in `document-validation.test.ts`). No unique assertions. Deleted outright.

### Requirement: REMOVED `tests/unit/validation/monsterUpload.test.ts`

Reason for removal: Damage-type filtering tests absorbed into `tests/unit/monster-upload/transform.test.ts`. File deleted after destination passes.

### Requirement: REMOVED `tests/integration/party-routes.test.ts`

Reason for removal: Unique assertions (PUT handler, `_id` absence on POST) ported to `tests/unit/api/parties/route.test.ts`. File deleted after destination passes.

### Requirement: REMOVED `tests/integration/storage.party.test.ts`

Reason for removal: `saveParty` test ported to `tests/unit/storage/storage.test.ts`. File deleted after destination passes.

### Requirement: REMOVED `tests/integration/duplicate-monster.test.ts`

Reason for removal: Moved to `tests/unit/api/monsters/duplicate.test.ts`.

### Requirement: REMOVED `tests/integration/clientStorage.test.ts`

Reason for removal: Moved to `tests/unit/lib/clientStorage.test.ts`.

### Requirement: REMOVED `tests/integration/validation/password.test.ts`

Reason for removal: Moved to `tests/unit/validation/password.test.ts`.

## Traceability

- Proposal: Move pure unit tests → Requirements: REMOVED clientStorage, password, duplicate-monster
- Proposal: Augment existing unit files → Requirements: ADDED PUT handler, ADDED saveParty, MODIFIED parties/route.test.ts, MODIFIED storage.test.ts
- Proposal: Split monsterUpload → Requirements: ADDED monster-upload folder, REMOVED monsterUpload.test.ts, REMOVED monsterUploadRoute.test.ts, REMOVED unit/validation/monsterUpload.test.ts
- Proposal: Document logout-clears-storage → Requirement: ADDED documentation header
- Design Decision 1 (move-then-delete) → All REMOVED requirements (destination must exist and pass before deletion)
- Design Decision 2 (monster-upload folder) → ADDED monster-upload folder requirements
- Design Decision 3 (delete monsterUploadRoute) → REMOVED monsterUploadRoute.test.ts
- Design Decision 4 (augment party unit file) → ADDED PUT handler, MODIFIED parties/route.test.ts
- Design Decision 5 (augment storage unit file) → ADDED saveParty, MODIFIED storage.test.ts
- Design Decision 6 (keep logout, document) → ADDED documentation header
- Requirements → Tasks: see tasks.md

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Suite stays green throughout migration

- **Given** the migration is performed in move-then-delete order
- **When** each step completes
- **Then** `npm run test:unit` and `npm run test:integration` both pass before the next step begins — no step introduces a red suite state
