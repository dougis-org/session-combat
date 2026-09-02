## ADDED Requirements

This document details *changes* to requirements and is additive to the [`design.md`](../../design.md) document, not a replacement.

### Requirement: ADDED Campaign and template domain methods live in per-domain repos

The system SHALL implement the monster-template, campaign-template, campaign,
and campaign-membership storage methods in dedicated modules
`lib/storage/monsterTemplateRepo.ts`, `lib/storage/campaignTemplateRepo.ts`,
`lib/storage/campaignRepo.ts`, and `lib/storage/membershipRepo.ts`, with each
database operation wrapped in `runStorageOp`.

#### Scenario: Method resolves through its domain repo

- **Given** a caller invokes `storage.loadCampaigns(userId)`
- **When** the call executes
- **Then** it delegates to `campaignRepo.loadCampaigns`, which performs the
  `campaigns` collection query inside a single `runStorageOp` call and resolves
  to the same `Campaign[]` shape the pre-migration method returned

#### Scenario: All 27 named methods are migrated

- **Given** the change is implemented
- **When** the module boundaries are inspected
- **Then** `loadMonsterTemplates`, `loadGlobalMonsterTemplates`,
  `loadAllMonsterTemplates`, `saveMonsterTemplate`, `deleteMonsterTemplate`,
  `monsterExistsByNameAndSource`, `findMonsterByNameAndSource`,
  `loadGlobalCampaignTemplates`, `loadGlobalCampaignTemplateById`,
  `saveCampaignTemplate`, `deleteCampaignTemplate`, `loadCampaigns`,
  `loadCampaignById`, `saveCampaign`, `deleteCampaign`,
  `setActiveCampaignSession`, `claimActiveCampaignSession`,
  `loadCampaignByIdAny`, `listCampaignsForMember`, `getCampaignsByIds`,
  `addMember`, `updateMemberStatus`, `listMembersForCampaign`, `getMember`,
  `listInvitationsForUser`, `getUserById`, and `getUsersByIds` are each defined
  in one of the four repo modules and no longer have an inline implementation
  in `lib/storage.ts`

#### Scenario: Cross-repo helper calls stay within the repo layer

- **Given** `monsterTemplateRepo.loadGlobalMonsterTemplates` needs user-scoped
  template loading
- **When** it runs
- **Then** it calls `loadMonsterTemplates(GLOBAL_USER_ID)` via a direct
  sibling-function reference, not via the `storage` facade, so no
  `repo -> lib/storage -> repo` import cycle is created

### Requirement: ADDED Public storage facade shape is preserved

The system SHALL keep the `storage` object exported from `lib/storage.ts`
byte-compatible in surface: every migrated method remains accessible as
`storage.<name>` with an identical TypeScript signature, and no consuming file's
import statements change.

#### Scenario: Callers and mocks are untouched

- **Given** the existing test suites that mock `storage`
  (`tests/unit/lib/storage.test.ts`, `tests/unit/lib/storage-shares.test.ts`,
  `tests/unit/lib/storage.characters.test.ts`,
  `tests/unit/lib/storage.campaignEncounters.test.ts`,
  `tests/unit/lib/storage.characterization.test.ts`)
- **When** the migration is complete and the suites run unmodified
- **Then** every suite passes

#### Scenario: Facade method count is unchanged

- **Given** the count of own-enumerable methods on `storage` before the change
- **When** the same count is taken after the change
- **Then** the two counts are equal and `tsc --noEmit` reports no errors

### Requirement: ADDED Storage failures in the migrated cluster surface as StorageError

The system SHALL, for every migrated method, reject with a `StorageError`
(logged via `logStorageEvent` with `outcome: "error"`) when the underlying
MongoDB operation throws, instead of catching the error and returning a
sentinel value.

#### Scenario: Database failure during a previously-swallowing read

- **Given** `campaignRepo.loadCampaigns` and a `campaigns` collection query that
  rejects with a driver error
- **When** `storage.loadCampaigns(userId)` is awaited
- **Then** it rejects with a `StorageError` whose `op` is `"loadCampaigns"` and
  `collection` is `"campaigns"`, the original error is available as
  `error.cause`, and one `logStorageEvent` call with `outcome: "error"` was made

#### Scenario: The ten converting methods no longer swallow

- **Given** `loadMonsterTemplates`, `loadAllMonsterTemplates`,
  `monsterExistsByNameAndSource`, `findMonsterByNameAndSource`,
  `loadGlobalCampaignTemplates`, `loadGlobalCampaignTemplateById`,
  `loadCampaigns`, `loadCampaignById`, `listCampaignsForMember`, and
  `listMembersForCampaign`
- **When** each is invoked while its collection query rejects
- **Then** each rejects with `StorageError` and none returns `[]`, `null`, or
  `false`

### Requirement: ADDED Empty and not-found results do not throw

The system SHALL treat a successful query that returns no rows or no matching
document as a normal non-throwing result: `[]` for list methods, `null` for
single-record lookups, and the natural boolean for existence checks.

#### Scenario: Campaign has no members

- **Given** a `campaignMembers` collection with no documents for `campaignId`
- **When** `storage.listMembersForCampaign(campaignId)` is awaited
- **Then** it resolves to `[]` without throwing, and `logStorageEvent` records
  `outcome: "not_found"`

#### Scenario: Monster does not exist

- **Given** no `monsterTemplates` document matches the name/source
- **When** `storage.monsterExistsByNameAndSource(name, source)` is awaited
- **Then** it resolves to `false` without throwing

### Requirement: ADDED Campaign access checks do not mask storage failures as not-found

The system SHALL propagate a `StorageError` raised by `storage.getMember` out of
`assertCampaignAccess` rather than converting it to a "Campaign not found"
(HTTP 404) response.

#### Scenario: Database outage during an access check

- **Given** `lib/utils/campaign.ts` `assertCampaignAccess(campaignId, userId)`
  and `storage.getMember` rejecting with a `StorageError`
- **When** a campaign-scoped route handler calls `assertCampaignAccess`
- **Then** the `StorageError` propagates unhandled through `assertCampaignAccess`
  (it does not return the 404 `notFound()` response), the route responds
  HTTP 500, and the `StorageError` is logged

#### Scenario: Member genuinely absent

- **Given** `storage.getMember` resolves to `null` (no membership row)
- **When** `assertCampaignAccess` runs
- **Then** it returns the HTTP 404 `notFound()` response as before

### Requirement: ADDED Characterization coverage remains green

The system SHALL keep the `#500` characterization tests for this domain cluster
passing; any intentional behavior change is documented in the pull request
description.

#### Scenario: Characterization suite after migration

- **Given** `tests/unit/lib/storage.characterization.test.ts`
- **When** it runs against the migrated code
- **Then** it passes, and every assertion that changed meaning is listed in the
  PR body with its rationale

## MODIFIED Requirements

_None. This change adds the campaign/template domain decomposition; it does not
alter a previously-specified requirement in this capability._

## REMOVED Requirements

_None._

## Traceability

- Proposal element "Move 27 methods into 4 repos on `runStorageOp`" -> Requirement:
  ADDED Campaign and template domain methods live in per-domain repos.
- Proposal element "`lib/storage.ts` public shape unchanged; no caller imports
  change" -> Requirement: ADDED Public storage facade shape is preserved.
- Proposal element "Swallow -> `StorageError`; empty/not-found unchanged" ->
  Requirements: ADDED Storage failures in the migrated cluster surface as
  StorageError; ADDED Empty and not-found results do not throw.
- Proposal element "`getMember`/`assertCampaignAccess` and
  `listMembersForCampaign` explicit verification" -> Requirement: ADDED Campaign
  access checks do not mask storage failures as not-found (plus the ten-methods
  scenario).
- Proposal element "Characterization tests from #500 must still pass" ->
  Requirement: ADDED Characterization coverage remains green.
- Design Decision 2 -> Requirement: ADDED Public storage facade shape is preserved.
- Design Decision 3 -> Requirements: ADDED Storage failures...; ADDED Empty and
  not-found results do not throw.
- Design Decision 4 -> Requirement: ADDED Campaign access checks do not mask
  storage failures as not-found.
- Design Decision 5 -> Requirement scenario: Cross-repo helper calls stay within
  the repo layer.
- Requirement "per-domain repos" -> Tasks: "Create repo modules", "Migrate
  monster templates", "Migrate campaign templates", "Migrate campaigns",
  "Migrate membership", "Update facade".
- Requirement "facade shape preserved" -> Tasks: "Update facade",
  "method-count + tsc guardrail", "run existing storage suites unmodified".
- Requirement "failures surface as StorageError" / "empty does not throw" ->
  Tasks: "per-repo unit tests".
- Requirement "access checks do not mask failures" -> Tasks: "getMember /
  assertCampaignAccess verification test".

## Non-Functional Acceptance Criteria

> NFAC scenarios below express non-functional properties not already covered by
> the functional scenarios above.

### Requirement: Performance

#### Scenario: Latency budget

- **Given** the migrated methods under the existing unit and integration suites
- **When** the suites run before and after the change
- **Then** no method adds an await beyond `runStorageOp`'s existing
  `Date.now()` bracketing, and total suite runtime does not regress by more than
  normal run-to-run variance (no dedicated perf budget is defined for this
  change)

### Requirement: Security

See functional scenarios: "Database failure during a previously-swallowing
read" and "Database outage during an access check". In addition:

#### Scenario: Error message does not leak infrastructure detail

- **Given** any migrated method rejecting with `StorageError`
- **When** the `StorageError.message` is inspected
- **Then** it contains only the operation name and collection name — no
  connection string, credentials, or raw driver text (raw detail remains only in
  `error.cause` and server-side logs)

### Requirement: Reliability

#### Scenario: Failure is observable

- **Given** any migrated method whose collection operation throws
- **When** the method rejects
- **Then** exactly one `logStorageEvent` call was made with `outcome: "error"`,
  the operation `name`, and the `collection`, so an outage is visible in logs
  rather than silently absorbed

#### Scenario: Telemetry on every path

- **Given** a migrated read method
- **When** it completes on the success, not-found, and error paths respectively
- **Then** each path emits exactly one `logStorageEvent` with the matching
  `outcome` (`success` / `not_found` / `error`) and stable `name` + `collection`
