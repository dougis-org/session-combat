## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Not-found results never throw

The system SHALL treat a storage operation that completes successfully but
finds nothing (a `null`/absent single-record result classified by an
`isEmpty` predicate) as a normal, non-error return value from `runStorageOp`.

#### Scenario: Single-record lookup finds nothing

- **Given** a call to `runStorageOp({ name, collection, isEmpty: (r) => r === null }, fn)` where `fn()` resolves to `null`
- **When** `runStorageOp` completes
- **Then** it resolves to `null` (the unmodified `fn()` result) without throwing, and logs exactly one `logStorageEvent` call with `outcome: "not_found"`

#### Scenario: List query finds nothing

- **Given** a call to `runStorageOp({ name, collection }, fn)` (no `isEmpty` passed) where `fn()` resolves to `[]`
- **When** `runStorageOp` completes
- **Then** it resolves to `[]` without throwing, and logs exactly one `logStorageEvent` call with `outcome: "success"` (an empty list is not classified as `not_found` when no classifier is supplied)

### Requirement: ADDED Real failures always log and always rethrow as StorageError

The system SHALL, whenever the wrapped operation throws or rejects, log the
failure via `logStorageEvent` with `outcome: "error"` and then always rethrow
a `StorageError` wrapping the original error — never swallow it and never
return a sentinel value.

#### Scenario: Wrapped operation throws

- **Given** a call to `runStorageOp({ name: "loadSpellById", collection: "spellTemplates" }, fn)` where `fn()` rejects with `new Error("connection refused")`
- **When** `runStorageOp` is awaited
- **Then** it rejects with a `StorageError` instance (not the original error, not a sentinel like `null`), and exactly one `logStorageEvent` call was made with `outcome: "error"` and the original error attached

#### Scenario: Failure occurs regardless of an isEmpty classifier being present

- **Given** a call to `runStorageOp({ name, collection, isEmpty: (r) => r === null }, fn)` where `fn()` rejects
- **When** `runStorageOp` is awaited
- **Then** it rejects with a `StorageError` (the `isEmpty` classifier is never invoked, since `fn()` never resolved)

### Requirement: ADDED logStorageEvent emits a fixed structured shape

The system SHALL provide `logStorageEvent({ name, collection, outcome,
durationMs, error? })` as the single logging seam for all storage operation
events, emitting a consistent field set for every call regardless of outcome.

#### Scenario: Success event

- **Given** a call to `logStorageEvent({ name: "loadCampaignById", collection: "campaigns", outcome: "success", durationMs: 12 })`
- **When** the call completes
- **Then** a structured log entry is emitted containing `name`, `collection`, `outcome`, and `durationMs`, with no `error` field required

#### Scenario: Error event carries the original error

- **Given** a call to `logStorageEvent({ name: "getMember", collection: "campaignMembers", outcome: "error", durationMs: 8, error: someError })`
- **When** the call completes
- **Then** a structured log entry is emitted containing all of `name`, `collection`, `outcome: "error"`, `durationMs`, and a reference to `someError`

### Requirement: ADDED StorageError carries cause, op, and collection

The system SHALL provide a `StorageError` class whose instances expose the
original wrapped error via the standard `cause` property, plus readable `op`
and `collection` fields identifying which storage operation failed.

#### Scenario: StorageError construction

- **Given** `new StorageError("loadSpellById", "spellTemplates", { cause: originalError })`
- **When** the resulting instance is inspected
- **Then** `error.cause === originalError`, `error.op === "loadSpellById"`, `error.collection === "spellTemplates"`, and `error instanceof Error` is `true`

#### Scenario: StorageError thrown by runStorageOp is correlatable to its log line

- **Given** `runStorageOp` catches a failure and both logs it (via `logStorageEvent`) and throws a `StorageError`
- **When** a caller catches the thrown `StorageError`
- **Then** `error.op` and `error.collection` match the `name` and `collection` fields of the corresponding `logStorageEvent` call, allowing the two to be correlated

## Traceability

- Proposal element: "a missing document is a normal return value... decided
  by the query result, not an error path" -> Requirement: ADDED Not-found
  results never throw
- Proposal element: "anything that reaches catch is a real failure... always
  logged... always rethrown as a typed StorageError — never swallowed" ->
  Requirement: ADDED Real failures always log and always rethrow as
  StorageError
- Proposal element: "logStorageEvent emits structured, consistent fields for
  every call" -> Requirement: ADDED logStorageEvent emits a fixed structured
  shape
- Proposal element: "StorageError carries the original error as cause and the
  op/collection name for later log correlation" -> Requirement: ADDED
  StorageError carries cause, op, and collection
- Design decision: Decision 1 (`isEmpty` classifier + catch-always-throws) ->
  Requirement: ADDED Not-found results never throw, ADDED Real failures
  always log and always rethrow as StorageError
- Design decision: Decision 2 (only single-record lookups classify emptiness)
  -> Requirement: ADDED Not-found results never throw (list-query scenario)
- Design decision: Decision 3 (`StorageError` shape) -> Requirement: ADDED
  StorageError carries cause, op, and collection
- Requirement: ADDED Not-found results never throw -> Task(s): implement
  `runStorageOp` in `lib/storage/runOp.ts`, unit tests in
  `tests/unit/lib/storage/runOp.test.ts`
- Requirement: ADDED Real failures always log and always rethrow as
  StorageError -> Task(s): implement `runStorageOp` catch path, unit tests
- Requirement: ADDED logStorageEvent emits a fixed structured shape -> Task(s):
  implement `lib/telemetry/logger.ts`, unit tests in
  `tests/unit/lib/telemetry/logger.test.ts`
- Requirement: ADDED StorageError carries cause, op, and collection ->
  Task(s): implement `lib/storage/errors.ts`, unit tests in
  `tests/unit/lib/storage/errors.test.ts`

## Non-Functional Acceptance Criteria

> NFAC scenarios below do not duplicate the functional scenarios above; they
> express distinct non-functional properties (timing capture, and the
> "touches no existing code" isolation constraint).

### Requirement: Performance

#### Scenario: Duration is captured for every operation

- **Given** a call to `runStorageOp` wrapping an `fn()` that takes some
  measurable time to resolve
- **When** the operation completes (success, not-found, or error)
- **Then** the `durationMs` field logged via `logStorageEvent` reflects the
  elapsed wall-clock time of the `fn()` call, for all three outcomes

### Requirement: Security

See functional scenarios: "Real failures always log and always rethrow as
StorageError" — the original error is preserved via `cause` for diagnostic
purposes but this change introduces no new external-facing surface (no HTTP
handler, no client-visible serialization) where a leak could occur; no
distinct security scenario applies at this stage of the epic.

### Requirement: Reliability

#### Scenario: Zero blast radius on existing code

- **Given** the three new files (`lib/storage/runOp.ts`,
  `lib/storage/errors.ts`, `lib/telemetry/logger.ts`) added by this change
- **When** the existing test suite (all tests exercising `lib/storage.ts`'s
  36 caller files and 11 mock files) is run
- **Then** every existing test passes unmodified, since none of the new files
  are imported by any existing file
