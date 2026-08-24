---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `campaign-encounter-link-api` change. All work should follow a strict TDD (Test-Driven Development) process: write a failing test, write the minimal code to pass it, refactor, repeat.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

### Storage layer — `tests/unit/lib/storage.test.ts` (or a new `tests/unit/lib/storage.campaignEncounters.test.ts`)

Maps to tasks.md task: "TDD: storage layer"

- [ ] `loadEncountersByIds` returns the matching `Encounter[]` for a set of ids owned by the given `ownerUserId` — spec scenario: "DM fetches linked encounters"
- [ ] `loadEncountersByIds` excludes encounters owned by a different `userId` even if their id is in the list — spec scenario: "Linking an encounter you don't own is rejected" (supports the ownership check)
- [ ] `loadEncountersByIds([], ownerUserId)` returns `[]` without issuing a `find()` call (assert via mock call count) — spec scenario: "Empty encounterIds returns empty list"; NFAC: "Resolving linked encounters is a single query"
- [ ] `loadEncountersByIds` issues exactly one `find()` call regardless of id-list size (assert mock call count === 1 for a 20-id list) — NFAC: "Resolving linked encounters is a single query"
- [ ] `addEncounterToCampaign` performs `$addToSet` scoped to `{ id: campaignId, userId: dmUserId }` — spec scenario: "DM links an owned encounter"
- [ ] `addEncounterToCampaign` called twice with the same `encounterId` leaves the array containing it exactly once (integration-level assertion against a test DB, or assert `$addToSet` semantics via driver mock) — spec scenario: "Linking the same encounter twice is idempotent"
- [ ] `removeEncounterFromCampaign` performs `$pull` scoped to `{ id: campaignId, userId: dmUserId }` — spec scenario: "DM unlinks a linked encounter"
- [ ] `removeEncounterFromCampaign` on an id not present in `encounterIds` completes without error and leaves the array unchanged — spec scenario: "Unlinking an encounter that isn't linked is a no-op success"

### `GET /api/campaigns/[id]/encounters` — `tests/unit/api/campaigns/id.encounters.route.test.ts` and/or `tests/integration/api/campaignEncounters.test.ts`

Maps to tasks.md task: "TDD: GET /api/campaigns/[id]/encounters"

- [ ] Active DM member receives 200 with the full resolved `Encounter[]` for the campaign's `encounterIds` — spec scenario: "DM fetches linked encounters"
- [ ] Active player member (non-owner of the encounters) receives 200 with the identical resolved list, not filtered by their own `userId` — spec scenario: "Player member fetches the same linked encounters"
- [ ] Non-member (no membership record) receives 404 — spec scenario: "Non-member is rejected"
- [ ] Campaign with `encounterIds: []` returns 200 with `[]` — spec scenario: "Empty encounterIds returns empty list"

### `POST /api/campaigns/[id]/encounters` — same test files as GET above

Maps to tasks.md task: "TDD: POST /api/campaigns/[id]/encounters"

- [ ] DM linking an encounter they own receives a 2xx response and the campaign's `encounterIds` includes the new id — spec scenario: "DM links an owned encounter"
- [ ] DM linking the same `encounterId` a second time receives a 2xx response and `encounterIds` still contains it exactly once — spec scenario: "Linking the same encounter twice is idempotent"
- [ ] DM linking an `encounterId` owned by a different user receives 404 and `encounterIds` is unchanged — spec scenario: "Linking an encounter you don't own is rejected"
- [ ] Active player member attempting to link receives 404 and `encounterIds` is unchanged — spec scenario: "Player member cannot link"

### `DELETE /api/campaigns/[id]/encounters/[encounterId]` — `tests/unit/api/campaigns/id.encounters.encounterId.route.test.ts` and/or integration equivalent

Maps to tasks.md task: "TDD: DELETE /api/campaigns/[id]/encounters/[encounterId]"

- [ ] DM unlinking a linked encounter receives 200, `encounterIds` no longer contains it, and the underlying `Encounter` document still exists (`GET /api/encounters/[id]` still 200s) — spec scenario: "DM unlinks a linked encounter"
- [ ] DM unlinking an `encounterId` not currently in `encounterIds` receives 200 (no-op) and `encounterIds` is unchanged — spec scenario: "Unlinking an encounter that isn't linked is a no-op success"
- [ ] Active player member attempting to unlink receives 404 and `encounterIds` is unchanged — spec scenario: "Player member cannot unlink"

### `POST /api/encounters` with `campaignId` — `tests/unit/api/encounters/route.test.ts` (extend existing) and/or integration equivalent

Maps to tasks.md task: "TDD: POST /api/encounters campaignId extension"

- [ ] DM posting with a valid `campaignId` receives 201 with the created `Encounter`, and the campaign's `encounterIds` includes the new encounter's id — spec scenario: "Create and link succeeds"
- [ ] Posting with no `campaignId` field behaves identically to current behavior (encounter created, owned by requester, no campaign touched) — spec scenario: "campaignId omitted behaves exactly as before"
- [ ] Player member (non-DM) posting with that campaign's `campaignId` receives 404 and no `Encounter` document is created — spec scenario: "Requester is not the campaign's DM"
- [ ] When `storage.addEncounterToCampaign` is mocked/forced to throw after `storage.saveEncounter` succeeds: response is 201, includes the created `Encounter` plus a `linkWarning` field, the encounter is independently retrievable via `GET /api/encounters`, and the campaign's `encounterIds` does NOT include it — spec scenario: "Encounter creation succeeds but linking fails"; also validates design.md Decision 4 and the Reliability NFAC scenario "Partial failure in create+link never loses the created encounter"

### Cross-cutting

- [ ] Grep/review check across the diff: no new route introduces a `status: 403` response anywhere — NFAC "Security" (cross-referenced access-control scenarios above), design.md Decision 5
