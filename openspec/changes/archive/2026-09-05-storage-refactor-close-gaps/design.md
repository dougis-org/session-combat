## Context

- Relevant architecture: `lib/storage.ts` is a facade object re-exporting
  methods implemented in per-domain repo files under `lib/storage/*Repo.ts`
  (established by #501–#504). Every migrated method wraps its DB call in
  `runStorageOp(meta, fn)` (`lib/storage/runOp.ts`), which times the call,
  emits a single `logStorageEvent` on both success and failure, and on
  failure either rethrows a caller-identified domain error as-is
  (`meta.rethrowAsIs`) or wraps it in `StorageError`.
- Dependencies: `lib/storage/runOp.ts` (`runStorageOp`), `lib/storage/errors.ts`
  (`StorageError`), `lib/telemetry/logger.ts` (`logStorageEvent`), `lib/db.ts`
  (`getDatabase`), `lib/storage/helpers.ts` (`normalizeStoredEntityId`).
- Interfaces/contracts touched: `storage.savedContent.{list,create,update,remove}`,
  `storage.loadEncountersByIds`, `storage.addEncounterToCampaign`,
  `storage.removeEncounterFromCampaign` — all 7 keep identical signatures and
  return types; only their internal implementation and error behavior change.
  Real callers confirmed via grep: `app/api/content/route.ts`,
  `app/api/content/[id]/route.ts` (savedContent, already wrap calls in
  try/catch → 500), `app/api/encounters/route.ts`,
  `app/api/campaigns/[id]/encounters/route.ts`,
  `app/api/campaigns/[id]/encounters/[encounterId]/route.ts`,
  `lib/scripts/backfillCampaignEncounters.ts` (encounter-linking methods).

## Goals / Non-Goals

### Goals

- Route all 7 remaining methods through `runStorageOp`/`logStorageEvent`.
- Make `savedContent.list()` throw/log a real failure on DB outage instead of
  silently returning `[]`.
- Zero remaining `console.error`/`console.warn` in `lib/storage.ts`.
- Keep `lib/storage.ts`'s public shape byte-for-byte compatible.

### Non-Goals

- Changing `savedContent`'s data model, validation, or MongoDB collection.
- Migrating any caller off the `storage` facade to narrow imports (#506 territory).
- Adding new `isEmpty`/not-found semantics beyond what sibling repos already do.

## Decisions

### Decision 1: New `savedContentRepo.ts`, not folding into an existing repo

- Chosen: create `lib/storage/savedContentRepo.ts` with 4 exported functions
  (`list`, `create`, `update`, `remove`) mirroring the existing
  `storage.savedContent.*` nesting.
- Alternatives considered: fold into `membershipRepo.ts` or a generic
  `miscRepo.ts` alongside `load`/`clear`.
- Rationale: `savedContent` is its own MongoDB collection with its own
  lifecycle (AI-generated content saved per campaign) — unrelated to
  membership or the storage-wide misc bucket. A dedicated repo file matches
  the one-collection-per-repo convention every other domain already follows
  (`encounterRepo.ts` ↔ `encounters`, `spellRepo.ts` ↔ `spells`, etc.).
- Trade-offs: one more small file vs. a bigger shared one; consistency with
  existing convention outweighs the minor file-count increase.

### Decision 2: Encounter-linking methods join the existing `encounterRepo.ts`

- Chosen: add `loadEncountersByIds`, `addEncounterToCampaign`,
  `removeEncounterFromCampaign` as new exports in the existing
  `lib/storage/encounterRepo.ts`.
- Alternatives considered: a separate `campaignEncounterLinkRepo.ts`.
- Rationale: `loadEncountersByIds` reads the same `encounters` collection as
  `loadEncounters`/`saveEncounter`/`deleteEncounter`, already in this file.
  `addEncounterToCampaign`/`removeEncounterFromCampaign` write to the
  `campaigns` collection's `encounterIds` array but are encounter-domain
  operations by intent (linking an encounter to a campaign), and #503's
  `campaignRepo.ts` already owns campaign-lifecycle CRUD, not
  encounter-campaign linking — keeping the linking logic next to
  `encounterRepo.ts`'s other encounter operations avoids splitting one
  conceptual operation (attach/detach an encounter) across two files.
- Trade-offs: `encounterRepo.ts` gains two functions that touch the
  `campaigns` collection rather than `encounters`; acceptable since they're
  encounter-centric operations and the file already imports what's needed.

### Decision 3: `runStorageOp` config per method — `isEmpty` on the two list reads, none elsewhere

- Chosen: `savedContent.list` and `loadEncountersByIds` pass
  `isEmpty: (res) => res.length === 0` (logs `not_found` on an empty array,
  matching the dominant convention). `create`/`update`/`remove`/
  `addEncounterToCampaign`/`removeEncounterFromCampaign` pass no `isEmpty` —
  they don't return arrays, and their success/failure is binary. No method
  passes `rethrowAsIs`; a failure always becomes a wrapped `StorageError`,
  matching all 6 of these methods' pre-migration rethrow behavior (none of
  the 7 throw a domain-specific error type that needs preserving as-is).
- Alternatives considered: omit `isEmpty` on the two list reads, following
  `loadEncounters`'s (undocumented) precedent of treating an empty array as
  plain `success`.
- Rationale: surveying every migrated repo file shows `isEmpty: (res) =>
  res.length === 0` is the dominant, clearly intentional convention for
  "list all X for a scope" queries — `loadSpells`, `loadSessionLogs`,
  `loadCampaigns`, `loadParties`, `listSharesForCampaign`,
  `loadMonsterTemplates`, and others all use it. The one documented
  exception, `rollRepo.ts`'s `listCampaignRolls`, explains *why* it omits
  `isEmpty`: it's a cursor-paginated feed where an empty page is a normal
  "no more entries" result, not a domain-empty condition. `savedContent.list`
  and `loadEncountersByIds` are plain non-paginated "all matching rows"
  queries — the same shape as `loadSpells`/`loadSessionLogs` — so they
  should follow that majority convention, not the paginated exception.
  `loadEncounters`'s own omission of `isEmpty` looks like a #502 oversight
  rather than a deliberate exception (it has no doc comment explaining it,
  unlike `listCampaignRolls`) and is out of scope to fix here.
- Trade-offs: telemetry for these two methods will log `not_found` for a
  legitimately-empty result (e.g. a campaign with no saved content yet),
  same as `loadSpells`/`loadSessionLogs` already do — an accepted, consistent
  trade-off across the codebase, not a new one introduced by this change.

### Decision 4: `savedContent.list()` behavior change is intentional and unguarded

- Chosen: let `runStorageOp` propagate the wrapped `StorageError` on a DB
  outage in `savedContent.list()`, rather than adding a compatibility shim
  that catches `StorageError` and falls back to `[]`.
- Alternatives considered: preserve the old swallow behavior for `list()`
  specifically (lowest-risk, but perpetuates the exact bug #708 exists to
  fix).
- Rationale: confirmed via grep that both callers (`app/api/content/route.ts`
  GET handler) already wrap `storage.savedContent.list(...)` in a
  `try { ... } catch (error) { ...return 500... }` block — so a thrown error
  now produces a correct 500 instead of a masked empty-list 200. This is the
  exact fix pattern #504 already applied to `loadSpellById()`.
- Trade-offs: none identified; this is the core bug fix the proposal exists
  to deliver.

## Proposal to Design Mapping

- Proposal element: Move `savedContent.*` onto `runStorageOp`
  - Design decision: Decision 1, Decision 3, Decision 4
  - Validation approach: unit tests exercising `savedContentRepo.ts` for
    success, empty-result, and thrown-error paths; existing route-level
    tests for `app/api/content/route.ts` and `app/api/content/[id]/route.ts`
    must still pass unmodified (mock shape unchanged).
- Proposal element: Move 3 encounter-linking methods onto `runStorageOp`
  - Design decision: Decision 2, Decision 3
  - Validation approach: unit tests in `encounterRepo.test.ts` (or wherever
    encounter repo tests live) covering `loadEncountersByIds` (found/missing
    ids), `addEncounterToCampaign`/`removeEncounterFromCampaign`
    (success + DB-error path); existing `app/api/encounters` and
    `app/api/campaigns/[id]/encounters*` route tests must still pass.
- Proposal element: Zero remaining `console.error`/`console.warn` in
  `lib/storage.ts`
  - Design decision: Decisions 1–4 collectively remove all 7 sites
  - Validation approach: `grep -c "console\.\(error\|warn\)" lib/storage.ts`
    returns `0` as a CI-checkable assertion in the PR description.

## Functional Requirements Mapping

- Requirement: `storage.savedContent.list/create/update/remove` preserve
  their existing signatures and success-path return values unchanged.
  - Design element: Decision 1 (thin delegation from `lib/storage.ts`)
  - Acceptance criteria reference: tasks.md — "public shape unchanged"
  - Testability notes: existing mocks of `storage.savedContent.*` in test
    files must require zero changes; run full existing suite.
- Requirement: `savedContent.list()` throws (rather than swallows) on a DB
  failure.
  - Design element: Decision 4
  - Acceptance criteria reference: tasks.md — "savedContent.list error path"
  - Testability notes: new unit test mocking `getDatabase()` to reject,
    asserting `savedContentRepo.list(...)` rejects rather than resolving to
    `[]`.
- Requirement: `loadEncountersByIds`, `addEncounterToCampaign`,
  `removeEncounterFromCampaign` keep rethrowing on error but now via
  `runStorageOp`.
  - Design element: Decision 2, Decision 3
  - Acceptance criteria reference: tasks.md — "encounter-linking methods migrated"
  - Testability notes: unit tests assert a `StorageError` (not the raw
    Mongo error) is thrown, and that `logStorageEvent` is invoked once per
    call on both success and failure.

## Non-Functional Requirements Mapping

- Requirement category: observability
  - Requirement: every one of the 7 methods emits exactly one
    `logStorageEvent` call per invocation (success or error).
  - Design element: `runStorageOp`'s existing single-seam guarantee (unchanged
    by this proposal; simply extended to 7 more call sites)
  - Acceptance criteria reference: tasks.md — "logStorageEvent coverage"
  - Testability notes: spy on `logStorageEvent` in unit tests for each of
    the 7 methods, assert call count and `outcome` field.
- Requirement category: reliability
  - Requirement: no behavior regression for the 6 methods that already
    rethrow (only their logging path changes, not their throw/return
    contract).
  - Design element: Decision 3 (no `isEmpty`/`rethrowAsIs` needed — default
    `runStorageOp` wrapping matches existing rethrow-as-`StorageError`
    behavior used by every other migrated method)
  - Acceptance criteria reference: tasks.md — "existing tests green"
  - Testability notes: full existing Jest/Vitest suite run before and after;
    zero new failures.

## Risks / Trade-offs

- Risk/trade-off: `savedContent.list()`'s thrown `StorageError` differs in
  shape from the raw Mongo error the (nonexistent) previous catch never
  actually surfaced to callers — callers only ever saw `[]`, never an error
  object, so this is new observable behavior for any caller not already
  wrapping the call.
  - Impact: confirmed via grep — both call sites already wrap in
    try/catch → 500, so impact is "more correct 500 instead of masked 200,"
    not a crash.
  - Mitigation: re-grep all `storage.savedContent.list` call sites
    immediately before merging to catch any new caller introduced since
    this design was written.
- Risk/trade-off: adding 3 functions to `encounterRepo.ts` that touch the
  `campaigns` collection (not `encounters`) slightly blurs the
  one-collection-per-repo convention.
  - Impact: minor discoverability cost for a future reader expecting
    `encounterRepo.ts` to only touch `encounters`.
  - Mitigation: a short comment above the two campaign-linking functions
    noting they intentionally live here because they're encounter-domain
    operations, not campaign-lifecycle ones.

## Rollback / Mitigation

- Rollback trigger: existing test suite fails post-migration in a way not
  attributable to the intentional `savedContent.list()` behavior change; or
  a caller in production starts 500ing on saved-content list that previously
  succeeded (would indicate a real, previously-masked DB issue surfaced,
  which is arguably not a rollback case — see verification below).
- Rollback steps: revert the PR (single, self-contained commit/PR per
  tasks.md); `lib/storage.ts`'s public shape is unchanged throughout, so
  revert is a pure code revert with no data migration.
- Data migration considerations: none — no schema or collection changes.
- Verification after rollback: confirm `lib/storage.ts` methods return to
  their prior inline implementations and the full test suite is green.

## Operational Blocking Policy

- If CI checks fail: fix before merge; this is a small, self-contained
  refactor with no external dependencies, so CI failure should be resolved
  in the same PR, not waived.
- If security checks fail: not expected (no new external inputs, no auth
  changes); investigate and fix rather than waive.
- If required reviews are blocked/stale: ping for review; this change is
  low-risk and small enough to expect fast turnaround.
- Escalation path and timeout: if unresolved after 2 business days, flag to
  the repo owner (dougis) directly rather than let #708 stall indefinitely
  the way the original gap sat undetected.

## Open Questions

- None. This design directly mirrors the proven `runStorageOp` migration
  pattern already validated three times over (#502, #503, #504) applied to
  a small, fully-enumerated set of 7 methods with confirmed real callers.
