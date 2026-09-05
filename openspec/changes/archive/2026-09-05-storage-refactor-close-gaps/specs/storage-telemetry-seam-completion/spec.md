## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Saved-content methods live in a dedicated repo built on runStorageOp

The system SHALL implement `savedContent.list`, `savedContent.create`,
`savedContent.update`, and `savedContent.remove` in a new
`lib/storage/savedContentRepo.ts` module, with each database operation wrapped
in a single `runStorageOp` call. `list` SHALL pass
`isEmpty: (result) => result.length === 0` so an empty result records a
`not_found` telemetry outcome; `create`, `update`, and `remove` SHALL pass no
`isEmpty`.

#### Scenario: Method resolves through its domain repo

- **Given** a caller invokes `storage.savedContent.list(campaignId, userId)`
- **When** the call executes
- **Then** it delegates to `savedContentRepo.list`, which performs the
  `savedContent` collection query inside a single `runStorageOp` call and
  resolves to the same `SavedContent[]` shape the pre-migration method
  returned

#### Scenario: Database failure during a previously-swallowing read

- **Given** `savedContentRepo.list` and a `savedContent` `find().toArray()`
  call that rejects with a driver error
- **When** `storage.savedContent.list(campaignId, userId)` is awaited
- **Then** it rejects with a `StorageError` whose `op` is
  `"savedContent.list"` (or equivalent identifying name) and `collection` is
  `"savedContent"`, the original error is available as `error.cause`, and
  exactly one `logStorageEvent` call with `outcome: "error"` was made —
  it does **not** resolve to `[]`

#### Scenario: All four saved-content methods are migrated

- **Given** the change is implemented
- **When** the module boundaries are inspected
- **Then** `list`, `create`, `update`, and `remove` are each defined in
  `savedContentRepo.ts` and no longer have an inline implementation with a
  `try/catch`/`console.error` in `lib/storage.ts`

### Requirement: ADDED Encounter-campaign linking methods live in encounterRepo, built on runStorageOp

The system SHALL implement `loadEncountersByIds`, `addEncounterToCampaign`,
and `removeEncounterFromCampaign` in the existing
`lib/storage/encounterRepo.ts` module, with each database operation wrapped in
a single `runStorageOp` call. `loadEncountersByIds` SHALL pass
`isEmpty: (result) => result.length === 0`; the two campaign-link mutators
SHALL pass no `isEmpty`.

#### Scenario: Method resolves through its domain repo

- **Given** a caller invokes
  `storage.addEncounterToCampaign(campaignId, encounterId, dmUserId)`
- **When** the call executes
- **Then** it delegates to `encounterRepo.addEncounterToCampaign`, which
  performs the `campaigns` collection `updateOne` (`$addToSet`) inside a
  single `runStorageOp` call and resolves to `void` as before

#### Scenario: Database failure during a previously-console.error'd write

- **Given** `encounterRepo.removeEncounterFromCampaign` and a `campaigns`
  collection `updateOne` call that rejects with a driver error
- **When** `storage.removeEncounterFromCampaign(campaignId, encounterId, dmUserId)`
  is awaited
- **Then** it rejects with a `StorageError` whose `op` is
  `"removeEncounterFromCampaign"` and `collection` is `"campaigns"`, and
  exactly one `logStorageEvent` call with `outcome: "error"` was made,
  logged through the shared seam instead of a raw `console.error` call

#### Scenario: All three encounter-linking methods are migrated

- **Given** the change is implemented
- **When** the module boundaries are inspected
- **Then** `loadEncountersByIds`, `addEncounterToCampaign`, and
  `removeEncounterFromCampaign` are each defined in `encounterRepo.ts` and no
  longer have an inline implementation with a `try/catch`/`console.error` in
  `lib/storage.ts`

### Requirement: ADDED lib/storage.ts has zero remaining console.error/console.warn call sites

The system SHALL, after this change, contain no `console.error` or
`console.warn` call sites in `lib/storage.ts` — every storage operation SHALL
log exclusively through `logStorageEvent` via `runStorageOp`.

#### Scenario: Facade file is fully migrated

- **Given** the change is implemented
- **When** `lib/storage.ts` is searched for `console.error` or `console.warn`
- **Then** zero matches are found

## MODIFIED Requirements

None. This change extends the storage-content-reference-domains and
storage-domain-decomposition efforts to methods those capabilities' original
scopes omitted; it does not alter any requirement already specified in
`openspec/specs/storage-content-reference-domains/spec.md` or
`openspec/specs/storage-domain-decomposition/spec.md`.

## REMOVED Requirements

None.

## Traceability

- Proposal element: Move `savedContent.*` onto `runStorageOp` -> Requirement:
  "ADDED Saved-content methods live in a dedicated repo built on runStorageOp"
- Proposal element: Move 3 encounter-linking methods onto `runStorageOp` ->
  Requirement: "ADDED Encounter-campaign linking methods live in
  encounterRepo, built on runStorageOp"
- Proposal element: Zero remaining console.error/console.warn in
  lib/storage.ts -> Requirement: "ADDED lib/storage.ts has zero remaining
  console.error/console.warn call sites"
- Design decision -> Requirement: Decision 1 (new savedContentRepo.ts) ->
  "ADDED Saved-content methods..."; Decision 2 (join encounterRepo.ts) ->
  "ADDED Encounter-campaign linking methods..."; Decision 3 (isEmpty policy)
  -> both ADDED requirements' `isEmpty` clauses; Decision 4 (intentional
  behavior change) -> the "Database failure during a previously-swallowing
  read" scenario
- Requirement -> Task(s): see `tasks.md` — one task per repo file change, one
  task per `lib/storage.ts` delegation update, one task for the
  console.error/warn sweep verification

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Recovery behavior

- **Given** a transient MongoDB connection failure during any of the 7
  migrated methods
- **When** the underlying driver call rejects
- **Then** the method rejects with a `StorageError` carrying the original
  error as `.cause`, and no method silently resolves to a sentinel value
  (`[]`, `null`, `false`, `undefined`) in place of the real failure — see
  functional scenarios: "Database failure during a previously-swallowing
  read", "Database failure during a previously-console.error'd write"

### Requirement: Security

See functional scenarios above — no access-control behavior changes in this
proposal; no distinct security scenario applies.
