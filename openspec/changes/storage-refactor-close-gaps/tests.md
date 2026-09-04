---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `storage-refactor-close-gaps` change.
All work follows a strict TDD (Test-Driven Development) process: write a
failing test, write the minimal code to pass it, then refactor.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** before writing any implementation code, write a
    test that captures the requirements of the task. Run it and confirm it
    fails.
2.  **Write code to pass the test:** write the simplest possible code (porting
    the existing verbatim logic into the new repo file, wrapped in
    `runStorageOp`) to make the test pass.
3.  **Refactor:** clean up while keeping the test green; add the short
    doc-comment noted in tasks.md Task B.

## Test Cases

### Task A — `savedContentRepo.ts` (maps to spec: "ADDED Saved-content methods live in a dedicated repo built on runStorageOp")

- [ ] `savedContentRepo.list` resolves to the same `SavedContent[]` shape as
      the pre-migration method on a successful query (scenario: "Method
      resolves through its domain repo")
- [ ] `savedContentRepo.list` logs a `logStorageEvent` with `outcome:
      "not_found"` when the query returns an empty array (per design.md
      Decision 3's `isEmpty` policy)
- [ ] `savedContentRepo.list` rejects with a `StorageError` (op:
      `"savedContent.list"` or equivalent, collection: `"savedContent"`,
      `error.cause` set) and does **not** resolve to `[]` when the
      underlying `find().toArray()` rejects — asserts exactly one
      `logStorageEvent` call with `outcome: "error"` (scenario: "Database
      failure during a previously-swallowing read")
- [ ] `savedContentRepo.create` resolves to the same `SavedContent` shape on
      success and rejects with `StorageError` (no swallow, no behavior
      change from pre-migration rethrow) on a DB failure
- [ ] `savedContentRepo.update` resolves to the same `boolean` shape on
      success and rejects with `StorageError` on a DB failure
- [ ] `savedContentRepo.remove` resolves to the same `boolean` shape on
      success and rejects with `StorageError` on a DB failure
- [ ] `storage.savedContent.list/create/update/remove` each delegate to the
      corresponding `savedContentRepo` function with unchanged
      signatures — existing mocks of `storage.savedContent.*` in
      `app/api/content/route.ts` and `app/api/content/[id]/route.ts` test
      files pass unmodified (scenario: "All four saved-content methods are
      migrated")

### Task B — `encounterRepo.ts` additions (maps to spec: "ADDED Encounter-campaign linking methods live in encounterRepo, built on runStorageOp")

- [ ] `encounterRepo.loadEncountersByIds` resolves to the same `Encounter[]`
      shape as the pre-migration method on success (scenario: "Method
      resolves through its domain repo")
- [ ] `encounterRepo.loadEncountersByIds` logs `outcome: "not_found"` on an
      empty result and returns `[]` immediately (no DB call) when passed an
      empty `ids` array, matching the pre-migration short-circuit
- [ ] `encounterRepo.loadEncountersByIds` rejects with `StorageError` on a DB
      failure, asserts exactly one `logStorageEvent` error event
- [ ] `encounterRepo.addEncounterToCampaign` resolves to `void` on success
      and rejects with `StorageError` (collection: `"campaigns"`) on a DB
      failure — logged through the seam instead of raw `console.error`
      (scenario: "Database failure during a previously-console.error'd
      write")
- [ ] `encounterRepo.removeEncounterFromCampaign` resolves to `void` on
      success and rejects with `StorageError` (collection: `"campaigns"`) on
      a DB failure
- [ ] `storage.loadEncountersByIds`/`addEncounterToCampaign`/
      `removeEncounterFromCampaign` each delegate to the corresponding
      `encounterRepo` function with unchanged signatures — existing mocks in
      `app/api/encounters/route.ts`,
      `app/api/campaigns/[id]/encounters/route.ts`,
      `app/api/campaigns/[id]/encounters/[encounterId]/route.ts`, and
      `lib/scripts/backfillCampaignEncounters.ts` test files pass unmodified
      (scenario: "All three encounter-linking methods are migrated")

### Task D — swallow-site sweep (maps to spec: "ADDED lib/storage.ts has zero remaining console.error/console.warn call sites")

- [ ] `grep -c "console\.\(error\|warn\)" lib/storage.ts` returns `0` after
      Tasks A–C are complete (scenario: "Facade file is fully migrated")

### Task E — caller re-verification (maps to design.md's risk mitigation for Decision 4)

- [ ] Manual/scripted re-grep of all 6 confirmed caller files for the 7
      methods shows no new caller introduced since design.md was written,
      and each caller already handles (or now correctly handles, per its own
      existing try/catch) a thrown error from these methods — not a unit
      test per se, but a required verification step before Task C is
      considered done

### Cross-cutting: full existing suite (maps to design.md Non-Functional Requirements Mapping — reliability)

- [ ] Full existing Jest/Vitest suite passes unmodified after Tasks A–C,
      with zero new failures attributable to this change (any pre-existing
      flake is out of scope)
- [ ] Type check (`tsc`/`next build` type-checking) passes with no new errors
