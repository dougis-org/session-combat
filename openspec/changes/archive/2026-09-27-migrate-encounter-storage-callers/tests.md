---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `migrate-encounter-storage-callers` change. This is a purely mechanical, no-behavior-change migration (import sources and mock targets only), so there is no new production behavior to drive with a fresh failing unit test. TDD is applied instead at the wiring level: each task's "test" is a **static check that fails before the edit and passes after it** (a `grep` assertion on import/call-site wiring), paired with the **existing** unit test suite for that file, which must continue to pass unmodified (or, for the two files in tasks 7-8, pass with only the mock-target rename). Where the existing suite would pass vacuously against broken wiring (e.g., a mock silently not being called), the static check is what actually catches the regression — see the note on each such case below.

## Testing Steps

For each task in `tasks.md`:

1.  **Write/run the failing static check:** Before editing, run the file's static `grep` check and confirm it currently reports the *old* (facade) wiring — i.e., the check for "no `storage.` reference remains" fails as expected pre-edit.
2.  **Make the edit:** Perform the import/call-site swap described in the task.
3.  **Re-run the static check and the file's existing test suite:** Both must pass — the static check now finds no facade reference, and the pre-existing tests (or, for tasks 7-8, the renamed-mock tests) pass unchanged in substance.

## Test Cases

- [ ] **Task 1 (`lib/storage/encounterRepo.ts` self-call fix):**
  - [ ] Static: `grep -n "storage\." lib/storage/encounterRepo.ts` returns zero matches after the edit (fails pre-edit, since line 40 currently reads `await storage.saveEncounter(encounter);`)
  - [ ] Existing: `npx jest --testPathPatterns tests/unit/lib/storage/encounterRepo.test.ts` passes unmodified, including its `saveEncounters` coverage → maps to spec scenario "No self-referential facade import remains" and "saveEncounters behavior and telemetry are unchanged"

- [ ] **Task 2 (`app/api/encounters/[id]/route.ts`):**
  - [ ] Static: `grep -n "storage\." "app/api/encounters/[id]/route.ts"` returns zero matches after the edit
  - [ ] Existing: this route's unit test file passes unmodified (it exercises `loadEncounters`/`saveEncounter`/`deleteEncounter` behavior through the route handler, not through a `jest.mock("@/lib/storage")` stub, so no mock-target change is needed here) → maps to spec scenario "Pure-Encounter caller has no remaining facade import"

- [ ] **Task 3 (`app/api/encounters/route.ts`):**
  - [ ] Static: `grep -n "storage\." app/api/encounters/route.ts` returns zero matches after the edit
  - [ ] Existing: this route's unit test file passes unmodified → maps to spec scenario "Pure-Encounter caller has no remaining facade import"

- [ ] **Task 4 (`app/api/campaigns/[id]/encounters/route.ts`):**
  - [ ] Static: `grep -n "storage\." "app/api/campaigns/[id]/encounters/route.ts"` returns zero matches after the edit
  - [ ] Existing (mock-target change, see Task 8 below — same file's test suite is updated there, not duplicated here) → maps to spec scenario "Pure-Encounter caller has no remaining facade import"

- [ ] **Task 5 (`lib/scripts/backfillCampaignEncounters.ts`):**
  - [ ] Static: `grep -n "storage\." lib/scripts/backfillCampaignEncounters.ts` returns zero matches after the edit
  - [ ] Existing (mock-target change, see Task 7 below) → maps to spec scenario "Pure-Encounter caller has no remaining facade import"

- [ ] **Task 6 (`app/api/campaigns/global/[id]/copy/route.ts`, mixed-domain):**
  - [ ] Static: `grep -n "storage\." "app/api/campaigns/global/[id]/copy/route.ts"` after the edit returns exactly 2 matches (`storage.loadGlobalCampaignTemplateById`, `storage.addMember`) and zero matches for `storage.saveEncounter`
  - [ ] Existing: this route's unit test file passes unmodified → maps to spec scenario "Mixed-domain caller keeps both imports"

- [ ] **Task 7 (`tests/unit/scripts/backfillCampaignEncounters.test.ts` mock update):**
  - [ ] Before: confirm `expect(storage.saveEncounter).toHaveBeenCalledTimes(1)` and `(storage.loadEncountersByIds as jest.Mock)` are the pre-edit assertions (these would pass vacuously with 0 real calls once Task 5 lands, if left unmodified — this is the regression the static check plus this test-file update both guard against)
  - [ ] After: `expect(encounterRepo.saveEncounter).toHaveBeenCalledTimes(1)` and `(encounterRepo.loadEncountersByIds as jest.Mock)` — run `npx jest --testPathPatterns tests/unit/scripts/backfillCampaignEncounters.test.ts` and confirm the same call-count assertions pass against the new mock target
  - [ ] Confirm no other (non-encounter) assertion in this file changed

- [ ] **Task 8 (`tests/unit/api/campaigns/[id]/encounters/route.test.ts` mock update):**
  - [ ] Before: confirm `mockedStorage.loadEncountersByIds` / `mockedStorage.addEncounterToCampaign` are the pre-edit mock references
  - [ ] After: `mockedEncounterRepo.loadEncountersByIds` / `mockedEncounterRepo.addEncounterToCampaign` — run `npx jest --testPathPatterns "tests/unit/api/campaigns/\[id\]/encounters/route.test.ts"` and confirm the same assertions pass against the new mock target
  - [ ] Confirm `mockedCampaignRepo`-related assertions in this file are untouched

- [ ] **Task 9 (untouched-files guard):**
  - [ ] Static: `git diff --stat -- lib/storage.ts tests/unit/lib/storage.test.ts tests/unit/lib/storage.campaignEncounters.test.ts tests/unit/storage/storage.test.ts tests/unit/lib/storage/facadeShape.test.ts` produces no output → maps to spec scenario "Facade shape and unrelated storage tests remain unaffected"
  - [ ] Existing: `npx jest --testPathPatterns tests/unit/lib/storage/facadeShape.test.ts` passes with its `OWN_KEY_COUNT` assertion unchanged

- [ ] **Full-suite regression gate (covers all tasks together):**
  - [ ] `npx tsc --noEmit` passes (catches any missed import removal or typo)
  - [ ] Full `npx jest` run passes with zero unexpected failures outside the files listed above
