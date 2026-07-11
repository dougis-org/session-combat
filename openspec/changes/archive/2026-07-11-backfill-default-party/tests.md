---
name: tests
description: Tests for the change
---

# Tests

## Overview

This document outlines the tests for the `backfill-default-party` change. All work should follow a strict TDD (Test-Driven Development) process: write a failing test first, write the minimal code to pass it, then refactor.

Scope note: per `design.md` Decision 4, this script (and its tests) are deletable — the integration test below is written to give confidence before running the script against real data, and is deleted alongside `lib/scripts/backfillDefaultParties.ts` once the script itself is removed. It is not a permanent addition to the suite.

## Testing Steps

For each task in `tasks.md`:

1.  **Write a failing test:** Before writing any implementation code, write a test that captures the requirements of the task. Run the test and ensure it fails.
2.  **Write code to pass the test:** Write the simplest possible code to make the test pass.
3.  **Refactor:** Improve the code quality and structure while ensuring the test still passes.

## Test Cases

Maps to `tasks.md` T1–T6 and `specs/scripts/spec.md` scenarios.

- [ ] **Party-less campaign is identified as a candidate** (task T1; spec scenario "Campaign with no party is identified") — seed a `campaigns` collection with one campaign (`id: "camp-1"`) and no matching `Party`; run the candidate query in isolation; assert `camp-1` appears in the result set.
- [x] **Campaign with an existing party is excluded** (task T1; spec scenario "Campaign with an existing party is excluded") — seed a campaign (`id: "camp-2"`) and a `Party` with `campaignId: "camp-2"`; run the candidate query; assert `camp-2` does not appear in the result set. Covered by `backfillDefaultParties.integration.test.ts` — "does not touch a campaign that already has a party".
- [x] **Default party is created with the correct shape** (task T2; spec scenario "Default party created for a party-less campaign") — run the full script against a seeded party-less campaign (`id: "camp-1"`, `userId: "user-1"`); assert exactly one new `Party` document exists with `campaignId: "camp-1"`, `userId: "user-1"`, `name: "Main Party"`, `description: ""`, `members: []`. Covered by `backfillDefaultParties.integration.test.ts` — "creates a default Main Party for a campaign with no party".
- [ ] **Backfilled party shape matches the #474 auto-create shape** (task T2; spec scenario "Backfilled party is indistinguishable in shape from a #474-created party") — compare the field set (excluding `id`, `createdAt`, `updatedAt`, `campaignId`) of a party created via the script against a party created via `POST /api/campaigns`; assert they match.
- [x] **Campaign document is not modified** (task T2/T3; spec scenario "Campaign document is untouched after backfill") — capture a campaign's full document (including `updatedAt`) before running the script; run the script; assert the campaign document is byte-for-byte unchanged afterward. Covered by `backfillDefaultParties.integration.test.ts` — "does not modify the Campaign document" (asserts full document deep equality).
- [x] **One failed insert does not abort the run** (task T3; NFAC "A single failed insert does not abort the entire run") — seed two party-less campaigns; force the first `Party` insert to throw (e.g. mock/stub); run the script; assert the second campaign still receives a correctly-shaped `Party` and the failure for the first is reflected in the run's summary/log output. Covered by `backfillDefaultParties.integration.test.ts` — "continues past a failed insert and reports it in the summary".
- [ ] **Summary logging reflects actual counts** (task T4; NFAC "Script logs per-campaign results and a final summary") — seed a mix of party-less and already-has-party campaigns; run the script; assert the logged summary counts (backfilled / skipped) match the seeded data exactly.
- [x] **Idempotent on a second run** (task T6; spec scenario "Double-run idempotency") — seed one party-less campaign; run the script once (assert one `Party` created); run the script again against the same database state; assert no additional `Party` document is created and the second run's summary reports zero backfills for that campaign. Covered by `backfillDefaultParties.integration.test.ts` — "is idempotent — second run creates no additional party".
- [ ] **Script is importable without side effects** (task T5, matching the `migrateGlobalMonsters.ts` precedent) — if the script exports its core function separately from its `require.main`/CLI-invocation guard, assert that importing the module in a test does not open a database connection or produce console output on its own.

## Manual Verification (non-automated, task T7)

- [ ] Run the script against a local/dev database seeded with a realistic mix of campaigns (with and without existing parties); visually confirm console output matches expectations before considering the script safe to run against staging/production.
