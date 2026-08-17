## ADDED Requirements

### Requirement: Complete storage method behavior inventory
The system SHALL provide a machine-readable inventory,
`docs/storage-refactor/inventory.json`, containing one entry for every
method on the `storage` object exported by `lib/storage.ts`, including
methods nested under sub-objects such as `storage.savedContent`. Each entry
SHALL record: method name, parent (`null` for flat methods, the sub-object
name otherwise), domain, behavior classification, error-return sentinel
(when applicable), source line number, caller list, existing test coverage,
characterization test reference (or `null`), and free-text notes.

#### Scenario: Every storage method is represented
- **WHEN** the number of entries in `inventory.json` is compared against the
  number of methods defined on `storage` (flat methods plus nested
  `savedContent` methods) in `lib/storage.ts`
- **THEN** the counts match, with no method missing an entry

#### Scenario: Nested sub-object methods are not conflated with flat methods
- **WHEN** an entry's `method` field is one of `storage.savedContent`'s
  methods (`list`, `create`, `update`, `remove`)
- **THEN** that entry's `parent` field is `"savedContent"`, distinguishing it
  from the ~60 flat top-level methods where `parent` is `null`

### Requirement: Fixed four-value error-handling taxonomy
The system SHALL classify every inventoried method's `behavior` field using
exactly one of four values: `swallow` (catches a DB error, logs it, and
returns a non-throwing sentinel), `rethrow` (catches, logs, and re-throws),
`mixed` (nested or multi-path error handling where sub-paths diverge, e.g. a
fallback query with its own independent try/catch), or `no-try` (no
try/catch present around the DB call).

#### Scenario: No fifth category is introduced
- **WHEN** the `behavior` field of any entry in `inventory.json` is inspected
- **THEN** its value is one of `swallow`, `rethrow`, `mixed`, or `no-try`,
  with no other value present anywhere in the file

#### Scenario: A two-tier fallback method is classified as mixed, not swallow
- **WHEN** `loadCharacters`'s entry is inspected
- **THEN** its `behavior` field is `mixed`, and its `notes` field describes
  the view-query-then-fallback-query structure that makes a plain
  `swallow`/`rethrow` label insufficient

### Requirement: Characterization tests pin current error-handling behavior
The system SHALL include automated tests that pin the current, observable
error-handling behavior of `storage.loadSpellById`, `storage.getMember`, and
`storage.loadCharacters` without modifying `lib/storage.ts`. Tests SHALL
mock the underlying database layer to force each method's error path(s) and
assert against the method's actual current output, including cases where
that output is ambiguous between a DB error and a legitimate not-found or
empty result.

#### Scenario: Swallowed error is indistinguishable from a real not-found
- **WHEN** `storage.loadSpellById` is called once with a mocked DB error and
  once with a mocked genuine not-found result
- **THEN** both calls resolve to `null`, and a test asserts this equivalence
  explicitly rather than only checking one of the two paths

#### Scenario: Rethrown error propagates to the caller
- **WHEN** `storage.getMember` is called with a mocked DB error
- **THEN** the returned promise rejects with that same error, and a test
  asserts the rejection (not a swallowed `null` return)

#### Scenario: Fallback path is proven to actually run, not merely assumed
- **WHEN** `storage.loadCharacters` is called with the `characters_active`
  view query mocked to reject and the `characters` collection query mocked
  to resolve with distinct, identifiable data
- **THEN** a test asserts the returned data matches the `characters`
  collection's mock specifically (not the view's), proving the fallback
  path executed rather than the test passing vacuously

#### Scenario: Double failure still resolves rather than throwing
- **WHEN** `storage.loadCharacters` is called with both the view query and
  the fallback query mocked to reject
- **THEN** the method resolves to `[]` rather than rejecting, and a test
  asserts this resolution

### Requirement: No production behavior changes
The system SHALL NOT modify any behavior in `lib/storage.ts` as part of this
change. The inventory and characterization tests SHALL document and pin
existing behavior only.

#### Scenario: Storage source file is unchanged
- **WHEN** this change's diff is reviewed
- **THEN** `lib/storage.ts` has zero line changes
