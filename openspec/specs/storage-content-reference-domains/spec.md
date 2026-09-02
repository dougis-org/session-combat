## Purpose

Define the per-domain decomposition of the session-log, campaign-character-share,
spell-template, and campaign-roll storage methods (plus the cross-cutting
`clear` helper) out of the `lib/storage.ts` facade into dedicated repo modules,
and the error-handling contract (real failures reject with `StorageError`;
empty/not-found stay non-throwing) that the migrated methods follow. Established
by
[#504](../../changes/archive/2026-09-02-migrate-content-reference-storage-domains/design.md).

## Requirements

### Requirement: Content and reference domain methods live in per-domain repos

The system SHALL implement the session-log, campaign-character-share,
spell-template, and campaign-roll storage methods in dedicated modules
`lib/storage/sessionLogRepo.ts`, `lib/storage/shareRepo.ts`,
`lib/storage/spellRepo.ts`, and `lib/storage/rollRepo.ts`, and SHALL implement
`clear` in `lib/storage/storageMisc.ts`, with each database operation wrapped in
a single `runStorageOp` call. The four list reads (`loadSessionLogs`,
`loadSpells`, `listSharesForCampaign`, `listAllSharesForCampaign`) SHALL pass
`isEmpty: (result) => result.length === 0` so an empty result records a
`not_found` telemetry outcome.

#### Scenario: Method resolves through its domain repo

- **Given** a caller invokes `storage.loadSpellById(id)` with a well-formed id
- **When** the call executes
- **Then** it delegates to `spellRepo.loadSpellById`, which performs the
  `spellTemplates` `findOne` inside one `runStorageOp` call and resolves to the
  same `SpellTemplate | null` shape the pre-migration method returned

#### Scenario: All cluster methods are migrated

- **Given** the change is implemented
- **When** the module boundaries are inspected
- **Then** `loadSessionLogs`, `getNextSessionNumber`, `saveSessionLog`,
  `updateSessionLog`, `deleteSessionLog`, `addShare`, `removeShare`,
  `listSharesForCampaign`, `listAllSharesForCampaign`, `loadSpells`,
  `loadSpellById`, `saveSpellTemplate`, `deleteSpellTemplate`,
  `spellExistsByNameAndSource`, `saveCampaignRoll`, and `listCampaignRolls` are
  each defined in one of the four repo modules and no longer have an inline
  implementation in `lib/storage.ts`

#### Scenario: Cross-domain calls go through the facade, not new imports

- **Given** a migrated repo function needs another domain's method
- **When** it runs
- **Then** it calls that method via the `storage` facade or a direct
  sibling-function reference within the same module, so no new
  `repo -> lib/storage -> repo` import cycle is introduced

### Requirement: Content/reference storage failures surface as StorageError

The system SHALL, for every migrated method, reject with a `StorageError`
(logged via `logStorageEvent` with `outcome: "error"`) when the underlying
MongoDB operation throws, instead of catching the error and returning a sentinel
value.

#### Scenario: Database failure during a previously-swallowing read

- **Given** `spellRepo.loadSpellById` and a `spellTemplates` `findOne` that
  rejects with a driver error
- **When** `storage.loadSpellById(id)` is awaited with a well-formed id
- **Then** it rejects with a `StorageError` whose `op` is `"loadSpellById"` and
  `collection` is `"spellTemplates"`, the original error is available as
  `error.cause`, and exactly one `logStorageEvent` call with `outcome: "error"`
  was made

#### Scenario: The six converting methods no longer swallow

- **Given** `loadSessionLogs`, `listSharesForCampaign`,
  `listAllSharesForCampaign`, `loadSpells`, `loadSpellById`, and
  `spellExistsByNameAndSource`
- **When** each is invoked while its collection operation rejects
- **Then** each rejects with `StorageError` and none returns `[]`, `null`, or
  `false`

#### Scenario: The two no-try roll methods gain a wrapped failure path

- **Given** `saveCampaignRoll` and `listCampaignRolls`
- **When** each is invoked while its `campaignRolls` collection operation rejects
- **Then** each rejects with a `StorageError` whose `collection` is
  `"campaignRolls"` and emits exactly one `logStorageEvent` with
  `outcome: "error"`

#### Scenario: clear surfaces a failed multi-collection delete

- **Given** `storageMisc.clear` and one of its seven `deleteMany` calls rejecting
- **When** `storage.clear(userId)` is awaited
- **Then** it rejects with a `StorageError` whose `op` is `"clear"`, and emits
  exactly one `logStorageEvent` with `outcome: "error"`

### Requirement: Not-found and input-guard paths remain non-throwing

The system SHALL treat a successful query returning no rows or no matching
document as a normal non-throwing result, and SHALL keep the pre-database
id-shape guard in `loadSpellById` and `deleteSpellTemplate` returning its
sentinel without invoking `runStorageOp`.

#### Scenario: Spell genuinely does not exist

- **Given** no `spellTemplates` document matches `id` and `GLOBAL_USER_ID`
- **When** `storage.loadSpellById(id)` is awaited
- **Then** it resolves to `null` without throwing, and `logStorageEvent` records
  `outcome: "not_found"`

#### Scenario: Malformed spell id is rejected before any database call

- **Given** an `id` that is empty, non-string, or longer than 64 characters
- **When** `storage.loadSpellById(id)` (or `storage.deleteSpellTemplate(id)`) is
  awaited
- **Then** `loadSpellById` resolves to `null` and `deleteSpellTemplate` resolves
  without performing any delete, no `getDatabase()` call is made, and no
  `logStorageEvent` call is made for that invocation

#### Scenario: Update/delete of a missing row

- **Given** `updateSessionLog` / `deleteSessionLog` / `removeShare` invoked for a
  row that does not exist
- **When** the operation completes successfully with no matched document
- **Then** `updateSessionLog` resolves to `null`, and `deleteSessionLog` /
  `removeShare` resolve to `false`, none of them throwing

#### Scenario: Empty list read

- **Given** a `sessionLogs` / `spellTemplates` / `campaignCharacterShares` query
  that matches no documents
- **When** the corresponding list method is awaited
- **Then** it resolves to `[]` without throwing, and `logStorageEvent` records
  `outcome: "not_found"`

### Requirement: updateSessionLog writes only allowlisted fields

The system SHALL build the `updateSessionLog` `$set` document from an explicit
allowlist of mutable `SessionLogInput` fields, dropping `campaignId`, `userId`,
`id`, `_id`, and any unknown key from an untrusted patch body.

#### Scenario: Immutable and unknown patch keys are dropped

- **Given** `storage.updateSessionLog(id, userId, campaignId, patch)` where
  `patch` includes `title`, `campaignId`, `userId`, `id`, and an arbitrary key
- **When** the update executes
- **Then** the Mongo `$set` contains `title` (and other allowlisted fields) but
  none of `campaignId`, `userId`, `id`, `_id`, or the arbitrary key

### Requirement: addShare preserves the DuplicateShareError contract

The system SHALL, when the `campaignCharacterShares` insert fails with a MongoDB
duplicate-key error (`code === 11000`), reject with a `DuplicateShareError`
rather than a `StorageError`, routed through `runStorageOp`'s `rethrowAsIs`
predicate.

#### Scenario: Duplicate share insert

- **Given** `shareRepo.addShare` and an insert that rejects with an error whose
  `code` is `11000`
- **When** `storage.addShare(share)` is awaited
- **Then** it rejects with a `DuplicateShareError` for that campaign/character,
  not a `StorageError`

#### Scenario: Non-duplicate insert failure

- **Given** `shareRepo.addShare` and an insert that rejects with a generic
  driver error
- **When** `storage.addShare(share)` is awaited
- **Then** it rejects with a `StorageError` whose `op` is `"addShare"` and
  `collection` is `"campaignCharacterShares"`, with the original error as
  `cause`

### Requirement: Spell-by-id route distinguishes outage from not-found

The system SHALL cause `app/api/spells/[id]/route.ts` to respond HTTP 500 (with
the failure logged) when `storage.loadSpellById` rejects with a `StorageError`,
and HTTP 404 only when it resolves to `null`.

#### Scenario: Database outage on GET spell

- **Given** `storage.loadSpellById` rejecting with a `StorageError`
- **When** `GET /api/spells/{id}` is handled
- **Then** the response status is 500, the body is the generic
  `"Failed to load spell"` error, and the `StorageError` is written to the
  server log

#### Scenario: Genuinely missing spell on GET

- **Given** `storage.loadSpellById` resolving to `null`
- **When** `GET /api/spells/{id}` is handled
- **Then** the response status is 404 with body `"Spell not found"`

### Requirement: Spell dedupe tolerates a thrown existence check

The system SHALL make `lib/import/dedupeEngine.ts` fail the affected import item
cleanly (counted as an error, batch continues, nothing saved) when
`storage.spellExistsByNameAndSource` or `storage.findMonsterByNameAndSource`
rejects, rather than proceeding as though the item is not a duplicate.

#### Scenario: Database failure during spell dedupe

- **Given** an import run and `storage.spellExistsByNameAndSource` rejecting with
  a `StorageError`
- **When** the dedupe step for a spell executes
- **Then** the item is counted as an error, `storage.saveSpellTemplate` is not
  called for it, the failure is logged, and subsequent items still process

### Requirement: Content/reference storage facade shape is preserved

The system SHALL keep every migrated method accessible as `storage.<name>` with
an identical TypeScript signature, and no consuming file's import statements
SHALL change.

#### Scenario: Existing storage mocks pass unmodified

- **Given** the existing suites that mock `storage`
  (`tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage-shares.test.ts`,
  `tests/unit/storage/sessionLog.test.ts`, and the spell/session route tests),
  updated only where they pinned the old swallow behavior now intentionally
  changed
- **When** the migration is complete and those suites run
- **Then** every suite passes

#### Scenario: Facade method count drops by exactly one (load removed)

- **Given** the count of own-enumerable keys on `storage` before the change (73)
- **When** the same count is taken after the change
- **Then** it is 72 — accounting for the removal of `storage.load()` and nothing
  else — and `tsc --noEmit` reports no errors

### Requirement: loadSpellById error contract

The system SHALL change `storage.loadSpellById` from returning `null` on any
failure to returning `null` only for a genuine not-found or a failed pre-DB
id-shape guard, and rejecting with `StorageError` on a database failure.

#### Scenario: Changed behavior on database error

- **Given** `storage.loadSpellById` previously returned `null` when the `findOne`
  threw
- **When** the same failure occurs after this change
- **Then** the call rejects with a `StorageError` instead of resolving to `null`

### Requirement: storage.load aggregate session loader is removed

The system SHALL NOT expose `storage.load`. Consumers that need aggregate
session data compose the per-domain loaders (`loadEncounters`,
`loadCharacters`, `loadParties`, `loadCampaigns`, `loadCombatState`) directly.

#### Scenario: load is no longer part of the facade

- **Given** the migrated `storage` object
- **When** `storage.load` is accessed
- **Then** it is `undefined`, and no source file under `app/`, `lib/`, or
  `scripts/` references `storage.load`

### Requirement: Characterization coverage remains green

The system SHALL keep the `#500` characterization tests for this domain cluster
passing, with the single intentional `loadSpellById` behavior change
(swallow → throw) rewritten in
`tests/unit/lib/storage.characterization.test.ts` and documented in the pull
request description.

#### Scenario: Characterization suite after migration

- **Given** `tests/unit/lib/storage.characterization.test.ts` updated so the
  `loadSpellById` DB-error case asserts `rejects.toThrow(StorageError)` while the
  genuine-not-found and bad-id cases still assert `resolves` to `null`
- **When** the suite runs against the migrated code
- **Then** it passes, and the changed assertion is listed in the PR body with
  its rationale

### Requirement: Performance

The migration SHALL NOT add any `await` beyond `runStorageOp`'s existing
`Date.now()` bracketing, and SHALL NOT alter any query filter, sort, projection,
limit, or the `listCampaignRolls` cursor computation.

#### Scenario: Latency budget

- **Given** the migrated methods under the existing unit and integration suites
- **When** the suites run before and after the change
- **Then** no method adds an await beyond `runStorageOp`'s existing `Date.now()`
  bracketing, `listCampaignRolls` returns the identical
  `{ rolls, nextCursor? }` for the same inputs, and total suite runtime does not
  regress beyond normal run-to-run variance

### Requirement: Security

A `StorageError` raised by any migrated method SHALL expose only the operation
name and collection name in its `message`; raw driver text, connection strings,
and credentials MUST remain confined to `error.cause` and server-side logs.
Access scoping (`userId`, `GLOBAL_USER_ID`, and the campaign-role visibility
filter in `listCampaignRolls`) MUST be unchanged.

#### Scenario: Error message does not leak infrastructure detail

- **Given** any migrated method rejecting with `StorageError`
- **When** `StorageError.message` is inspected
- **Then** it contains only the operation name and collection name — no
  connection string, credentials, or raw driver text

#### Scenario: Roll visibility scoping unchanged

- **Given** `listCampaignRolls` invoked by a non-DM member
- **When** it runs after the migration
- **Then** the `$or` visibility filter still returns only `group`-scoped rolls,
  the caller's own rolls, and (for a DM) `dm-only` rolls — identical to the
  pre-migration filter

### Requirement: Reliability

Every migrated method whose collection operation throws SHALL emit exactly one
`logStorageEvent` with `outcome: "error"`, and every migrated read SHALL emit
exactly one event per terminal path with the matching `outcome`.

#### Scenario: Failure is observable

- **Given** any migrated method whose collection operation throws
- **When** the method rejects
- **Then** exactly one `logStorageEvent` call was made with `outcome: "error"`,
  the operation `name`, and the `collection`

#### Scenario: Telemetry on every path

- **Given** a migrated read method
- **When** it completes on the success, not-found, and error paths respectively
- **Then** each path emits exactly one `logStorageEvent` with the matching
  `outcome` (`success` / `not_found` / `error`) and stable `name` + `collection`
