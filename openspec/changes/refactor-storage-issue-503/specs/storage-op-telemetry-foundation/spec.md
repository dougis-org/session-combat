## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Domain errors bypass StorageError wrapping

The system SHALL allow a `runStorageOp` caller to declare, via an optional
`rethrowAsIs` predicate on `RunStorageOpMeta`, that certain errors thrown by the
wrapped function are meaningful domain errors and MUST be re-thrown unchanged
rather than replaced with a `StorageError`.

#### Scenario: Predicate matches the thrown error

- **Given** `runStorageOp({ name, collection, rethrowAsIs: (e) => e instanceof DuplicateMemberError }, fn)` where `fn()` rejects with a `DuplicateMemberError`
- **When** `runStorageOp` handles the rejection
- **Then** it logs one `logStorageEvent` with `outcome: "error"`, then re-throws
  the original `DuplicateMemberError` instance unchanged (not a `StorageError`)

#### Scenario: Predicate does not match the thrown error

- **Given** the same call where `fn()` rejects with a generic driver error that
  is not a `DuplicateMemberError`
- **When** `runStorageOp` handles the rejection
- **Then** it re-throws a `StorageError` (`cause` set to the original error), as
  it does when no `rethrowAsIs` is supplied

#### Scenario: No predicate supplied

- **Given** a `runStorageOp` call whose `meta` omits `rethrowAsIs` (every
  pre-existing call site)
- **When** `fn()` rejects
- **Then** behavior is byte-identical to before this change: a `StorageError` is
  always thrown

### Requirement: ADDED addMember preserves its duplicate-member contract

The system SHALL have `storage.addMember` throw `DuplicateMemberError` (not
`StorageError`) when the `campaignMembers` insert fails with a MongoDB
duplicate-key error (code `11000`), so the three route handlers that branch on
`error instanceof DuplicateMemberError` continue to work.

#### Scenario: Duplicate membership insert

- **Given** `membershipRepo.addMember` and a `campaignMembers` insert that
  rejects with `{ code: 11000 }`
- **When** `storage.addMember(member)` is awaited
- **Then** it rejects with a `DuplicateMemberError` for `member.campaignId` /
  `member.userId`, and `app/api/campaigns/[id]/members/route.ts`'s
  `error instanceof DuplicateMemberError` branch is taken (not the generic
  500 path)

#### Scenario: Non-duplicate insert failure

- **Given** the same method and an insert that rejects with a non-`11000` driver
  error
- **When** `storage.addMember(member)` is awaited
- **Then** it rejects with a `StorageError` (`op: "addMember"`,
  `collection: "campaignMembers"`)

## MODIFIED Requirements

### Requirement: MODIFIED runStorageOp error handling

The system SHALL, on a rejection from the wrapped function, always emit one
`logStorageEvent` with `outcome: "error"` and then decide how to propagate:
re-throw the original error unchanged when `meta.rethrowAsIs` is present and
returns `true` for that error; otherwise throw a `StorageError` wrapping it as
`cause`.

#### Scenario: Error logging is unconditional

- **Given** any rejection from the wrapped function, with or without
  `rethrowAsIs`
- **When** `runStorageOp` handles it
- **Then** exactly one `logStorageEvent` call is made with `outcome: "error"`,
  the operation `name`, `collection`, and elapsed `durationMs`, before any error
  is propagated

## REMOVED Requirements

_None._

## Traceability

- Proposal element "add a `rethrowAsIs` predicate to `RunStorageOpMeta`
  (Option B)" -> Requirement: ADDED Domain errors bypass StorageError wrapping;
  Requirement: MODIFIED runStorageOp error handling.
- Proposal element "`addMember` still throws `DuplicateMemberError`" ->
  Requirement: ADDED addMember preserves its duplicate-member contract.
- Design Decision 1 -> Requirements: ADDED Domain errors bypass StorageError
  wrapping; MODIFIED runStorageOp error handling.
- Requirement "Domain errors bypass StorageError wrapping" -> Tasks: "Add
  `rethrowAsIs` to `RunStorageOpMeta` + `runStorageOp`", "Extend
  `runOp.test.ts`".
- Requirement "addMember preserves its duplicate-member contract" -> Tasks:
  "Migrate membership", "membershipRepo duplicate-key test", "verify the three
  `DuplicateMemberError` call sites".
- Requirement "MODIFIED runStorageOp error handling" -> Tasks: "Extend
  `runOp.test.ts` to cover both `rethrowAsIs` branches and the default path".

## Non-Functional Acceptance Criteria

### Requirement: Reliability

#### Scenario: Foundation change does not regress migrated cluster 1 repos

- **Given** the cluster-1 repos (`encounterRepo`, `characterRepo`,
  `combatStateRepo`, `partyRepo`) that call `runStorageOp` without `rethrowAsIs`
- **When** their existing unit/integration suites run after the foundation
  change
- **Then** all pass unchanged, confirming the default error-wrapping path is
  untouched

### Requirement: Security

See functional scenario: "Predicate does not match the thrown error" — generic
driver errors are still wrapped in `StorageError`, whose message carries only
`op` + `collection`. No new NFAC security scenario is required for this
capability delta.
